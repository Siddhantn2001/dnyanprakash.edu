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

  global.DPMotion = DPMotion;
})(window);
