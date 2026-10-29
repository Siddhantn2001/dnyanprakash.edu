/**
 * Scroll-triggered reveals — position-aware horizontal slide-in.
 *
 * 2026-04-30 rewrite: replaces the legacy translateY fade-up with
 * directional translate3d slide-ins where each element's horizontal
 * position vs viewport center decides which side it enters from.
 * Elements on the left half slide in from the left; elements on the
 * right slide in from the right; elements within ±10% of center fall
 * back to alternating. Mobile (single-column stacked layout) lands
 * most elements near center, so the alternating fallback dominates.
 *
 * Architecture: the inline IIFE in every HTML file still runs and
 * adds .reveal-fx to off-screen .reveal elements. Harmless because
 * mobile-polish.css uses .reveal.reveal-fx.reveal-left (0,3,0) to
 * override the inline .reveal.reveal-fx (0,2,0) translateY rule.
 * Both observers add .is-visible; whichever fires first wins.
 *
 * Pattern 3 (stat number count-up) is preserved at the bottom.
 */

/* ===== Pattern 4 — Position-aware horizontal reveals =====
   Initialises at DOMContentLoaded, not on 'load'. Bound to 'load' the
   directions were not assigned until every image on the page had finished
   downloading — with sixteen photographs in the story sections that is
   seconds on a real connection, and until then every reveal fell back to
   the inline translateY rule and entered from below. It looked right
   locally only because images come off disk instantly. Directions are
   re-assigned on 'load' and on resize, so later layout shifts correct
   themselves. */
function initReveals() {
  if (!('IntersectionObserver' in window)) return;

  var reveals = document.querySelectorAll('.reveal');
  if (!reveals.length) return;

  /* FAIL-SAFE (hotfix 2026-10-29). Hidden starting states only apply while
     <html> has .reveal-on (scripts/mobile-polish.css). It is added here and
     only if this runs within 2s of navigation: on a slow phone where the
     page is still arriving, no animation is set up and everything shows. */
  var root = document.documentElement;
  if (window.performance && performance.now() > 2000) return;
  var vh0 = window.innerHeight;
  for (var v = 0; v < reveals.length; v++) {
    /* Anything already on screen (or above it) is never hidden. */
    if (reveals[v].getBoundingClientRect().top < vh0) reveals[v].classList.add('is-visible');
  }
  root.classList.add('reveal-on');

  var observerRan = false;
  function sweep() {
    var vh = window.innerHeight;
    for (var i = 0; i < reveals.length; i++) {
      var el = reveals[i];
      if (!el.classList.contains('is-visible') && el.getBoundingClientRect().top < vh) el.classList.add('is-visible');
    }
    var tiles = document.querySelectorAll('.gallery-strip-frame .gallery-img:not(.is-in)');
    for (var t = 0; t < tiles.length; t++) {
      var r = tiles[t].getBoundingClientRect();
      if (r.top < vh && r.bottom > 0) tiles[t].classList.add('is-in');
    }
  }
  var sweeping = false;
  window.addEventListener('scroll', function () {
    if (sweeping) return; sweeping = true;
    requestAnimationFrame(function () { sweeping = false; sweep(); });
  }, { passive: true });
  /* Watchdog: if the observer has not delivered anything within 2s, drop
     the animation entirely; either way, show whatever is in view. */
  setTimeout(function () {
    if (!observerRan) root.classList.remove('reveal-on');
    sweep();
  }, 2000);

  var prefersReduced = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Reduced motion: mark everything visible immediately, skip observer.
  if (prefersReduced) {
    for (var p = 0; p < reveals.length; p++) {
      reveals[p].classList.add('is-visible');
    }
    return;
  }

  // (a) Position-aware direction assignment.
  // Element's horizontal center vs viewport center decides direction.
  // Within ±10% of center → fall back to alternating index.
  function assignDirections() {
    var vw = window.innerWidth;
    var vc = vw / 2;
    var band = vw * 0.10;
    var fallback = 0;
    for (var i = 0; i < reveals.length; i++) {
      var el = reveals[i];
      // Skip already-revealed elements during resize recompute
      if (el.classList.contains('is-visible')) continue;
      el.classList.remove('reveal-left', 'reveal-right');
      var rect = el.getBoundingClientRect();
      var elCenter = rect.left + rect.width / 2;
      var offset = elCenter - vc;
      if (offset < -band) {
        el.classList.add('reveal-left');
      } else if (offset > band) {
        el.classList.add('reveal-right');
      } else {
        el.classList.add(fallback % 2 === 0 ? 'reveal-left' : 'reveal-right');
        fallback++;
      }
    }
  }

  assignDirections();

  // (b) Parent-grouped stagger: when a parent has multiple .reveal
  //     children (news cards, explore tiles), each child fires 120ms
  //     after the previous via --reveal-delay CSS variable.
  var parentMap = new Map();
  for (var k = 0; k < reveals.length; k++) {
    var parent = reveals[k].parentElement;
    if (!parentMap.has(parent)) parentMap.set(parent, []);
    parentMap.get(parent).push(reveals[k]);
  }
  parentMap.forEach(function (group) {
    if (group.length > 1) {
      for (var n = 0; n < group.length; n++) {
        group[n].style.setProperty('--reveal-delay', (n * 120) + 'ms');
      }
    }
  });

  // (c) IntersectionObserver with anticipatory trigger.
  var observer = new IntersectionObserver(function (entries) {
    observerRan = true;
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        // 1100ms = 900ms (max transform duration) + buffer for stagger.
        // After this, .reveal-done sets will-change: auto in CSS so the
        // GPU layer is released.
        setTimeout(function (target) {
          return function () { target.classList.add('reveal-done'); };
        }(entry.target), 1100);
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.05,
    rootMargin: '0px 0px -8% 0px'
  });

  for (var m = 0; m < reveals.length; m++) {
    observer.observe(reveals[m]);
  }

  // (d) Recompute directions on resize for elements not yet revealed.
  //     Debounced so we don't thrash on every pixel of a resize drag.
  var resizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(assignDirections, 200);
  });

  // (e) Images settling can move an element across the centre line, so
  //     re-read the positions once everything has loaded.
  window.addEventListener('load', assignDirections);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initReveals);
} else {
  initReveals();
}

/* ===== Pattern 3 — Stat number count-up ===== */
(function () {
  'use strict';

  if (!('IntersectionObserver' in window)) return;

  var counters = document.querySelectorAll('.stat-counter[data-target]');
  if (!counters.length) return;

  var prefersReduced = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isMobile = window.matchMedia &&
    window.matchMedia('(max-width: 768px)').matches;

  var DURATION = isMobile ? 2000 : 1500;

  function easeOutQuart(t) {
    return 1 - Math.pow(1 - t, 4);
  }

  function format(n, target) {
    // Preserve thousands separator if target has one.
    if (target >= 1000) {
      return n.toLocaleString('en-IN');
    }
    return String(n);
  }

  function animateCounter(el) {
    var target = parseInt(el.getAttribute('data-target'), 10);
    if (isNaN(target)) return;

    if (prefersReduced) {
      el.textContent = format(target, target);
      return;
    }

    var start = performance.now();
    function tick(now) {
      var elapsed = now - start;
      var progress = Math.min(elapsed / DURATION, 1);
      var eased = easeOutQuart(progress);
      var value = Math.round(eased * target);
      el.textContent = format(value, target);
      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        el.textContent = format(target, target);
      }
    }
    requestAnimationFrame(tick);
  }

  // The real number stays in the markup until the count-up begins
  // (hotfix 2026-10-29): pre-zeroing showed "0" wherever the observer
  // stalled on a slow phone.

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  counters.forEach(function (el) {
    io.observe(el);
  });
})();
