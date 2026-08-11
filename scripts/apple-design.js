/* ============================================================================
   apple-design.js — runtime layer for the Apple-design pass.
   Pairs with scripts/apple-design.css. See .claude/skills/apple-design/SKILL.md.

   Loaded last (defer) on every page, so every other script has already built
   its DOM by the time this runs — the coverflow items, the gallery tiles and
   the lightbox overlay all exist and can simply be enhanced in place.

   No libraries, no build step: everything here is hand-rolled vanilla JS, per
   the project's locked stack (CLAUDE.md §3).

   Exposes window.DPMotion so later phases share one spring implementation and
   one set of accessibility signals instead of each re-deriving them.

     PHASE 1 — shared accessibility signals + material capability detection
   ============================================================================ */
(function (global) {
  'use strict';

  /* --------------------------------------------------------------------------
     Accessibility signals (§14). Three INDEPENDENT preferences, queried live
     rather than snapshotted, because a visitor can flip any of them mid-session
     and every phase after this one branches on them.
     -------------------------------------------------------------------------- */
  function mq(query) {
    if (!global.matchMedia) return { matches: false, addEventListener: function () {} };
    return global.matchMedia(query);
  }

  var reducedMotion = mq('(prefers-reduced-motion: reduce)');
  var reducedTransparency = mq('(prefers-reduced-transparency: reduce)');
  var moreContrast = mq('(prefers-contrast: more)');

  /* Capability probe for backdrop-filter. The CSS handles this with @supports;
     the flag is here so JS-driven material work in later phases can skip
     animating a blur the browser will never paint. */
  var supportsBackdrop =
    global.CSS &&
    global.CSS.supports &&
    (global.CSS.supports('backdrop-filter', 'blur(1px)') ||
      global.CSS.supports('-webkit-backdrop-filter', 'blur(1px)'));

  var DPMotion = {
    get reducedMotion() {
      return reducedMotion.matches;
    },
    get reducedTransparency() {
      return reducedTransparency.matches;
    },
    get moreContrast() {
      return moreContrast.matches;
    },
    supportsBackdrop: !!supportsBackdrop,
  };

  /* Reflect the signals onto <html> so CSS can branch on browsers that do not
     yet implement prefers-reduced-transparency / prefers-contrast natively
     (Firefox has neither at time of writing). Phase 6 consumes these hooks. */
  function reflect() {
    var root = document.documentElement;
    root.classList.toggle('dp-reduced-motion', DPMotion.reducedMotion);
    root.classList.toggle('dp-reduced-transparency', DPMotion.reducedTransparency);
    root.classList.toggle('dp-more-contrast', DPMotion.moreContrast);
    root.classList.toggle('dp-no-backdrop', !DPMotion.supportsBackdrop);
  }

  [reducedMotion, reducedTransparency, moreContrast].forEach(function (m) {
    if (m.addEventListener) m.addEventListener('change', reflect);
    else if (m.addListener) m.addListener(reflect);
  });

  reflect();

  /* --------------------------------------------------------------------------
     PHASE 1 FOLLOW-UP — relocate the मराठी toggle out of the retired mobile
     utility strip and into the nav row.

     The strip is hidden below 769px (apple-design.css §1.1b). Its only content
     with no other home was this toggle, so it MOVES rather than disappearing:
     the existing #lang-toggle node is appended into the nav row beside the
     hamburger, which keeps scripts/lang-toggle.js's click handler, its
     site-root detection and its ?fallback=true behaviour intact. Cloning would
     have produced two toggles to keep in sync; moving produces one.

     apple-design.js is injected last, so lang-toggle.js has already wired the
     node by the time this runs — listeners travel with it.

     Above 769px the node is put back exactly where it came from, so desktop is
     byte-for-byte the layout it was before.
     -------------------------------------------------------------------------- */
  function setupLangToggleRelocation() {
    var toggle = document.getElementById('lang-toggle');
    if (!toggle) return;

    /* Anchor on the hamburger, NOT on a wrapper class.
       index.html wraps its nav row in .main-nav-inner; the other 48 pages wrap
       theirs in .container-main. Selecting .main-nav-inner therefore found
       nothing on every inner page and the toggle stayed behind in the hidden
       strip — invisible. [data-mobile-open] is the one element both layouts
       have in the same place, so it is the anchor. */
    var burger = document.querySelector('.site-header .main-nav [data-mobile-open]') ||
                 document.querySelector('.site-header [data-mobile-open]');
    if (!burger || !burger.parentNode) return;

    // Remember the exact original slot so desktop can be restored precisely.
    var homeParent = toggle.parentNode;
    var homeNext = toggle.nextSibling;

    var mobile = mq('(max-width: 768px)');
    var relocated = false;

    function apply() {
      if (mobile.matches && !relocated) {
        toggle.classList.add('dp-lang-in-nav');
        burger.parentNode.insertBefore(toggle, burger);
        relocated = true;
      } else if (!mobile.matches && relocated) {
        toggle.classList.remove('dp-lang-in-nav');
        if (homeParent) homeParent.insertBefore(toggle, homeNext);
        relocated = false;
      }
    }

    if (mobile.addEventListener) mobile.addEventListener('change', apply);
    else if (mobile.addListener) mobile.addListener(apply);
    apply();
  }

  /* --------------------------------------------------------------------------
     PHASE 3 — Press feedback on pointer-DOWN (§1 Response, §10 Gesture details).

     §1: "Respond on pointer-down, not on release. Highlight a button the instant
     it's pressed. Waiting for click/touch-up to show feedback feels dead."
     §10: "Tap: highlight on touch-DOWN (instant), commit on touch-UP. Add ~10px
     of hysteresis/hit padding around the target, and allow cancel-by-dragging-
     away and back."

     One delegated listener on the document rather than a listener per element:
     the gallery, the coverflow and the news carousel all inject their targets
     after load, and delegation covers them without re-binding.

     Deliberately NOT using setPointerCapture here. Capture would redirect the
     event stream away from the element and can interfere with a link's native
     activation; nothing in this feature needs the pointer once it has left the
     target — it only needs to know that it did. Phase 4's drag gestures are a
     different matter and do capture.

     Every listener is passive, so none of this can block scrolling. A finger
     that starts on a card and then scrolls fires pointercancel, which clears the
     pressed state — the card must not sit there looking held down.
     -------------------------------------------------------------------------- */
  var PRESSABLE = [
    'a[href]', 'button', 'summary', '[role="button"]',
    '.news-card', '.academics-card', '.meet-card', '.event-row',
    '.cf-item', '.gallery-img', '.coverflow-dot', '.news-carousel-dot',
  ].join(',');

  var SLOP = 10; // §10's ~10px of hysteresis around the target

  function setupPressFeedback() {
    var pressed = null; // { el, rect, inside }

    function mark(el) { el.classList.add('dp-pressed'); }
    function unmark(el) { if (el) el.classList.remove('dp-pressed'); }

    function end() {
      if (pressed) unmark(pressed.el);
      pressed = null;
    }

    document.addEventListener('pointerdown', function (e) {
      // Primary button / any touch or pen contact only.
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      var el = e.target.closest && e.target.closest(PRESSABLE);
      if (!el) return;
      if (el.hasAttribute('disabled') || el.getAttribute('aria-disabled') === 'true') return;
      // Inert "coming soon" links are styled pointer-events:none, but a parent
      // could still match — check the computed value rather than trusting markup.
      if (getComputedStyle(el).pointerEvents === 'none') return;

      end();
      pressed = { el: el, rect: el.getBoundingClientRect(), inside: true };
      el.classList.add('dp-pressable');
      mark(el);
    }, { passive: true });

    document.addEventListener('pointermove', function (e) {
      if (!pressed) return;
      var r = pressed.rect;
      // Hysteresis measured against the TARGET's bounds, not radially from the
      // touch-down point: "dragging away from the target" is what the user
      // perceives, and on a 340px card a radial test would cancel while the
      // finger is still comfortably on it.
      var inside =
        e.clientX >= r.left - SLOP && e.clientX <= r.right + SLOP &&
        e.clientY >= r.top - SLOP && e.clientY <= r.bottom + SLOP;
      if (inside === pressed.inside) return;
      pressed.inside = inside;
      if (inside) mark(pressed.el);   // dragged back — re-arm (§10)
      else unmark(pressed.el);
    }, { passive: true });

    ['pointerup', 'pointercancel', 'contextmenu', 'dragstart'].forEach(function (ev) {
      document.addEventListener(ev, end, { passive: true });
    });
    window.addEventListener('blur', end);

    /* NOT bound to 'scroll'. An earlier cut was, as belt-and-braces for a touch
       turning into a scroll — and it made the press state fire-and-vanish:
       any scroll event cancelled it, including momentum still settling from a
       previous flick, so touching a card while the page was gliding killed the
       highlight instantly. Event trace: scroll@8910 -> pointerdown@8933 ->
       pressed -> cleared by the next settling scroll tick.

       pointercancel is the correct and sufficient signal — every engine fires
       it for a touch pointer the moment the browser takes the gesture over for
       scrolling — and the pointermove hysteresis above is the backstop. */
  }

  function init() {
    setupLangToggleRelocation();
    setupPressFeedback();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  global.DPMotion = DPMotion;
})(window);
