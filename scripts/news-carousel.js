/**
 * Swipeable carousel — news clippings on news/index.html, and the mobile
 * fallback for the homepage story stacks.
 *
 * Vanilla JS. One track, one active slide at a time. Graceful without JS —
 * the first slide stays visible (track at translateX(0)) and everything
 * else hides via overflow: hidden on the viewport.
 *
 * MULTI-INSTANCE. Every [data-news-carousel] on the page is initialised
 * independently, so a page may hold several. Dots are looked up inside the
 * carousel first, then within its nearest section — news/index.html keeps its
 * dots as a sibling of the carousel, which is why the scope is not just the
 * carousel element itself.
 *
 * Opt out of auto-advance with data-carousel-autoplay="false". The story
 * stacks use that: they sit above body copy someone is about to read, so a
 * slide moving on its own is a distraction rather than a feature.
 */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function init(carousel) {
    var track = carousel.querySelector('[data-carousel-track]');
    if (!track) return;
    var slides = track.children;
    if (!slides || slides.length === 0) return;

    var prev = carousel.querySelector('[data-carousel-prev]');
    var next = carousel.querySelector('[data-carousel-next]');
    /* Scope the dots: inside the carousel if they are there, otherwise within
       the nearest section. Never a bare document lookup — with more than one
       carousel on the page that would wire every instance to the first dots. */
    var scope = carousel.closest('section') || document;
    var dotsContainer = carousel.querySelector('[data-carousel-dots]') ||
                        scope.querySelector('[data-carousel-dots]');
    var dots = dotsContainer ? dotsContainer.querySelectorAll('[data-slide-index]') : [];

    var autoplay = carousel.getAttribute('data-carousel-autoplay') !== 'false';
    var current = 0;
    var autoAdvanceId = null;
    var AUTO_INTERVAL = 7000;

    function go(idx) {
      current = (idx + slides.length) % slides.length;
      track.style.transform = 'translateX(-' + (current * 100) + '%)';
      for (var i = 0; i < dots.length; i++) {
        dots[i].classList.toggle('is-active', i === current);
        dots[i].setAttribute('aria-current', i === current ? 'true' : 'false');
      }
    }

    function startAutoAdvance() {
      if (!autoplay || reduceMotion) return;
      stopAutoAdvance();
      autoAdvanceId = setInterval(function () { go(current + 1); }, AUTO_INTERVAL);
    }
    function stopAutoAdvance() {
      if (autoAdvanceId) { clearInterval(autoAdvanceId); autoAdvanceId = null; }
    }

    if (prev) prev.addEventListener('click', function () { go(current - 1); startAutoAdvance(); });
    if (next) next.addEventListener('click', function () { go(current + 1); startAutoAdvance(); });

    for (var i = 0; i < dots.length; i++) {
      (function (idx) {
        dots[idx].addEventListener('click', function () { go(idx); startAutoAdvance(); });
      })(i);
    }

    // Arrow-key navigation (when carousel area has focus)
    carousel.setAttribute('tabindex', '0');
    carousel.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { e.preventDefault(); go(current - 1); startAutoAdvance(); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); go(current + 1); startAutoAdvance(); }
    });

    // Pause on hover / focus
    carousel.addEventListener('mouseenter', stopAutoAdvance);
    carousel.addEventListener('mouseleave', startAutoAdvance);
    carousel.addEventListener('focusin', stopAutoAdvance);
    carousel.addEventListener('focusout', startAutoAdvance);

    // Touch swipe support
    var touchStartX = null;
    carousel.addEventListener('touchstart', function (e) {
      touchStartX = e.touches[0].clientX;
      stopAutoAdvance();
    }, { passive: true });
    carousel.addEventListener('touchend', function (e) {
      if (touchStartX === null) return;
      var dx = e.changedTouches[0].clientX - touchStartX;
      if (Math.abs(dx) > 40) {
        go(dx > 0 ? current - 1 : current + 1);
      }
      touchStartX = null;
      startAutoAdvance();
    }, { passive: true });

    go(0);
    startAutoAdvance();
  }

  /* Re-runnable: the story stacks build their carousels after this script has
     already executed, so they call window.DPCarousel.init(el) themselves. */
  window.DPCarousel = { init: init };

  var all = document.querySelectorAll('[data-news-carousel]');
  for (var k = 0; k < all.length; k++) init(all[k]);
})();
