/* =====================================================================
   welcome-card.js — the first-visit language note, as a slim strip.

   Replaces the full-screen welcome dialog (owner, Gate 1, Oct 2026).
   - Homepage only: runs where the #dp-strip markup exists; a no-op
     elsewhere, so it never shows on /mr/ or inner pages.
   - Once per visitor: localStorage "dp_welcome_seen" = "true", read and
     written inside try/catch. If storage is blocked the strip still shows
     and still closes; it just will not remember.
   - It never covers the headline, the navigation or the hero's action:
     it appears only after the hero has scrolled out of view.
   - It is position: fixed, so showing or closing it moves nothing on the
     page. The body keeps a little bottom padding while it is up so the
     footer's last line can scroll clear of it.
   - Close: the × button (44px) or Escape.
   ===================================================================== */
(function () {
  'use strict';

  var strip = document.getElementById('dp-strip');
  if (!strip) return;

  var KEY = 'dp_welcome_seen';
  var seen = false;
  try { seen = localStorage.getItem(KEY) === 'true'; } catch (e) { seen = false; }
  if (seen) { strip.parentNode.removeChild(strip); return; }

  var shown = false;
  function show() {
    if (shown) return;
    shown = true;
    strip.hidden = false;
    document.documentElement.classList.add('dp-strip-on');
    document.addEventListener('keydown', onKey);
  }
  function close() {
    try { localStorage.setItem(KEY, 'true'); } catch (e) {}
    strip.hidden = true;
    document.removeEventListener('keydown', onKey);
    // dp-strip-on stays: removing the bottom padding now could move the
    // page under the reader's eyes. It is gone on the next page view.
  }
  function onKey(e) { if (e.key === 'Escape') close(); }

  strip.querySelector('[data-strip-close]').addEventListener('click', close);
  var mr = strip.querySelector('.dp-strip-mr');
  if (mr) mr.addEventListener('click', function () { try { localStorage.setItem(KEY, 'true'); } catch (e) {} });

  var hero = document.querySelector('.hero');
  if (hero && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting && en.boundingClientRect.bottom <= 0) { show(); io.disconnect(); }
      });
    });
    io.observe(hero);
  } else {
    show();
  }
})();
