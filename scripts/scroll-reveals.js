/**
 * Scroll-triggered reveals — extras layered on top of the inline reveal IIFE
 * that already exists in every HTML file.
 *
 * The inline IIFE handles Pattern 1 (section fade-up): finds .reveal elements,
 * adds .reveal-fx to off-screen ones, observes them, adds .is-visible when
 * they enter the viewport.
 *
 * Pattern 2 (staggered tile reveals) is pure CSS — see :nth-child rules under
 * .scroll-stagger > .reveal.reveal-fx in the HTML's <style> block.
 *
 * This file adds Pattern 3 — stat number count-up animation. Targets
 * elements with class="stat-counter" and a numeric data-target. When the
 * element enters the viewport once, the inner text content animates from
 * 0 to the target using easeOutQuart, then stops.
 *
 * Respects prefers-reduced-motion: shows the final value immediately
 * without animating.
 */
(function () {
  'use strict';

  if (!('IntersectionObserver' in window)) return;

  var counters = document.querySelectorAll('.stat-counter[data-target]');
  if (!counters.length) return;

  var prefersReduced = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isMobile = window.matchMedia &&
    window.matchMedia('(max-width: 768px)').matches;

  var DURATION = isMobile ? 1000 : 1500;

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

  // Initialize each counter to 0 so it doesn't flash the final value before
  // animation starts.
  if (!prefersReduced) {
    counters.forEach(function (el) {
      el.textContent = '0';
    });
  }

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
