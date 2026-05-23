/* =====================================================================
   welcome-card.js — homepage-only, once-per-visitor welcome dialog.

   - Runs only where the #dp-welcome markup exists (homepage). Safe no-op
     elsewhere, so it never shows on /mr/ or inner pages.
   - Shows once per visitor: localStorage flag "dp_welcome_seen" = "true".
   - localStorage wrapped in try/catch — if blocked, the card still shows
     and dismiss still works (it just won't persist).
   - Dismiss: X button, "Got it" button, Escape, backdrop click.
   - Respects prefers-reduced-motion (no fade/drift — appear / remove).
   - Locks background scroll while open; restores on dismiss.
   - Accessible: role="dialog", aria-modal, focus moves in + is trapped,
     focus returns to the previously focused element on close.
   ===================================================================== */
(function () {
  'use strict';

  var overlay = document.getElementById('dp-welcome');
  if (!overlay) return; // not the homepage — do nothing

  var STORAGE_KEY = 'dp_welcome_seen';

  // Already seen? Remove the markup and bail (no flash, no listeners).
  var seen = false;
  try { seen = localStorage.getItem(STORAGE_KEY) === 'true'; } catch (e) { seen = false; }
  if (seen) {
    if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
    return;
  }

  var card = overlay.querySelector('.dp-welcome-card');
  var closeBtn = overlay.querySelector('[data-welcome-close]');
  var gotItBtn = overlay.querySelector('[data-welcome-dismiss]');
  var prefersReduced =
    window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var lastFocused = null;
  var dismissed = false;

  function open() {
    lastFocused = document.activeElement;
    overlay.hidden = false;
    overlay.setAttribute('aria-hidden', 'false');
    document.body.classList.add('dp-welcome-open');

    if (prefersReduced) {
      overlay.classList.add('is-visible');
    } else {
      // Two frames so the browser paints the opacity:0 / drift state first,
      // then transitions to the visible state.
      requestAnimationFrame(function () {
        requestAnimationFrame(function () { overlay.classList.add('is-visible'); });
      });
    }

    document.addEventListener('keydown', onKeydown, true);
    // Move focus into the dialog.
    (card || gotItBtn || closeBtn).focus();
  }

  function finalizeClose() {
    overlay.classList.remove('is-visible');
    document.body.classList.remove('dp-welcome-open');
    document.removeEventListener('keydown', onKeydown, true);
    if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
    if (lastFocused && typeof lastFocused.focus === 'function') {
      try { lastFocused.focus(); } catch (e) {}
    }
  }

  function dismiss() {
    if (dismissed) return;
    dismissed = true;
    try { localStorage.setItem(STORAGE_KEY, 'true'); } catch (e) {}

    if (prefersReduced) {
      finalizeClose();
      return;
    }
    overlay.classList.remove('is-visible');
    var done = false;
    var onEnd = function () { if (done) return; done = true; finalizeClose(); };
    overlay.addEventListener('transitionend', function (e) {
      if (e.target === overlay) onEnd();
    });
    setTimeout(onEnd, 400); // fallback if transitionend doesn't fire
  }

  function onKeydown(e) {
    if (e.key === 'Escape' || e.key === 'Esc') {
      e.preventDefault();
      dismiss();
    } else if (e.key === 'Tab') {
      trapFocus(e);
    }
  }

  function trapFocus(e) {
    var focusables = overlay.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (!focusables.length) return;
    var first = focusables[0];
    var last = focusables[focusables.length - 1];
    var active = document.activeElement;
    if (e.shiftKey && (active === first || active === card)) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && active === last) {
      e.preventDefault();
      first.focus();
    }
  }

  if (closeBtn) closeBtn.addEventListener('click', dismiss);
  if (gotItBtn) gotItBtn.addEventListener('click', dismiss);
  // Backdrop click — only when the click lands on the overlay, not the card.
  overlay.addEventListener('click', function (e) {
    if (e.target === overlay) dismiss();
  });

  open();
})();
