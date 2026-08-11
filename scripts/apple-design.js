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

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupLangToggleRelocation);
  } else {
    setupLangToggleRelocation();
  }

  global.DPMotion = DPMotion;
})(window);
