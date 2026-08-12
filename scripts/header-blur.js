/*
 * Scroll-based header-image blur — shared across every page.
 * Loaded via <script defer src="…/scripts/header-blur.js"></script>.
 *
 * Behaviour (per owner spec):
 *   - At scrollY = 0 the hero is perfectly sharp (0px blur).
 *   - As the user scrolls, blur scales linearly up to MAX_BLUR (8px).
 *   - Full blur is reached by the time the next content section is in view
 *     (i.e. when scrollY === heroHeight).
 *   - Scrolling back up sharpens the image again, smoothly.
 *
 * Implementation notes:
 *   - requestAnimationFrame-throttled passive scroll listener — no jank.
 *   - CSS `transition: filter 0.1s ease-out` is set inline so we don't
 *     depend on a page-level stylesheet change.
 *   - Works on mobile + desktop (passive listener, no touch hooks needed).
 *   - Vanilla JS, zero dependencies, no external libraries.
 *   - Honours prefers-reduced-motion — the blur is a visual flourish, so
 *     we skip it entirely for users who opted out of motion.
 */
(function () {
  'use strict';

  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  // Hero targets: homepage .hero-media, every other page's .article-hero-media.
  const header = document.querySelector('.hero-media, .article-hero-media');
  if (!header) return;

  const MAX_BLUR = 8;
  let ticking = false;
  let lastBlur = -1;

  header.style.transition = 'filter 0.1s ease-out';

  function update() {
    ticking = false;
    const h = header.offsetHeight || window.innerHeight || 1;
    const y = window.scrollY || window.pageYOffset || 0;
    const ratio = Math.min(1, Math.max(0, y / h));
    const blur = Math.round(ratio * MAX_BLUR * 100) / 100; // 2dp — enough precision, avoids redundant style writes
    if (blur === lastBlur) return;
    lastBlur = blur;
    header.style.filter = blur === 0 ? '' : `blur(${blur}px)`;
    /* will-change is raised only while the blur is actually in play (§11:
       "hint with will-change where motion is imminent" — and not where it
       isn't). This used to be set once at load and left up for the life of the
       page, pinning a full-viewport compositor layer for a hero image even
       after the visitor had scrolled past it and while it sat perfectly sharp
       at the top. Now it comes down at both ends of the range. */
    header.style.willChange = blur > 0 && blur < MAX_BLUR ? 'filter' : 'auto';
  }

  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  update();
})();
