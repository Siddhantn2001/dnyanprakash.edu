/**
 * Scroll reveals — calm, staggered, and never hiding content.
 *
 * Targeted upgrade (A5, A6). Content is visible by default: CSS no longer
 * hides anything marked .reveal (styles/upgrade.css). This script adds the
 * motion on top, and only to parts that start BELOW the fold, so the first
 * screen never waits for it and a page with no script loses nothing.
 *
 * Inside each section the parts enter in reading order (heading, then the
 * text, then the photographs), 70ms apart: each rises 24px and fades in over
 * 600ms, once. Photographs also settle from a 1.04 scale to 1.
 *
 * Fail-safe: anything that is in or above the viewport is shown at once,
 * checked on every scroll frame and again two seconds after load, so a
 * fast scroll, an anchor jump or a missed observer callback can never
 * leave a block blank. Reduced motion: nothing is marked at all.
 *
 * Pattern 3 (stat number count-up) is kept at the bottom.
 */
(function () {
  'use strict';

  if (!('IntersectionObserver' in window)) return;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  /* The parts that move, per section. Order within a section follows the
     DOM, which is reading order: heading, text, then pictures. */
  var PARTS = [
    'h1', 'h2', '.happening-sub', '.gallery-strip-frame', '.gallery-strip-foot',
    '.story-text > *', '.story-lead', '.story-row',
    '.news-card', '.academics-card', '.tour-facade',
    '.newsletter-header', '.newsletter-editorial', '.newsletter-cover-wrap',
    '.mission-stats-grid > *', '.events-list',
    '.lede', '.prose > p', '.prose > h2', '.prose > ul', '.article-aside > *',
    '.faq-section', '.data-row',
    '.gallery-all .gallery-img', '.footer-cols > div', '.footer-legal'
  ].join(', ');
  var MEDIA = '.story-lead, .story-row, .news-card, .academics-card, .tour-facade, .newsletter-cover-wrap, .gallery-strip-frame';
  var STEP = 70, MAX_STEPS = 5;

  var pending = [];

  function start() {
    var vh = window.innerHeight;
    /* The footer counts as one more section. Its wordmark is never marked:
       it must always be visible (A4). */
    var sections = document.querySelectorAll('main section, footer.site-footer');
    Array.prototype.forEach.call(sections, function (section) {
      var parts = section.querySelectorAll(PARTS);
      var step = 0;
      Array.prototype.forEach.call(parts, function (el) {
        /* Never a part inside a part: the outer one carries the motion. */
        if (el.parentElement && el.parentElement.closest('.rv')) return;
        if (el.getBoundingClientRect().top <= vh) return;   // above the fold: leave alone
        el.classList.add('rv');
        if (el.matches(MEDIA)) el.classList.add('rv-media');
        /* Gallery tiles stagger across a row, not down the whole grid. */
        var n = el.classList.contains('gallery-img') ? step % 3 : Math.min(step, MAX_STEPS);
        el.style.setProperty('--rv-delay', (n * STEP) + 'ms');
        step++;
        pending.push(el);
        io.observe(el);
      });
    });
    if (pending.length) {
      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('load', function () { setTimeout(sweep, 2000); });
    }
  }

  function show(el) {
    if (!el.classList.contains('rv') || el.classList.contains('rv-in')) return;
    el.classList.add('rv-in');
    io.unobserve(el);
  }

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) { if (e.isIntersecting) show(e.target); });
  }, { rootMargin: '0px 0px -6% 0px', threshold: 0 });

  /* Anything in or above the viewport is shown, whatever the observer did. */
  function sweep() {
    var vh = window.innerHeight;
    pending = pending.filter(function (el) {
      if (el.classList.contains('rv-in')) return false;
      if (el.getBoundingClientRect().top < vh) { show(el); return false; }
      return true;
    });
    if (!pending.length) window.removeEventListener('scroll', onScroll);
  }
  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () { ticking = false; sweep(); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();

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

  /* The real number stays in the markup until the counter is on screen; it
     starts from 0 only once it is about to animate, so a reader who never
     scrolls that far (or a screenshot) still sees the true figure. */
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
