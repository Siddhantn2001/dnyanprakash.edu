/* ═══════════════════════════════════════════════════════════════
   Landing Page Elevation — Interactive Layer
   Handles: hero arrival, parallax, details
   (The ghost numerals and 01–08 section numbers were removed in the
   targeted upgrade, A2: they were decoration, read aloud by screen readers.)
   ═══════════════════════════════════════════════════════════════ */

(function() {
  'use strict';

  // ─────────────────────────────────────────────────────────────
  // MOVE 6: Arrival & Parallax
  // ─────────────────────────────────────────────────────────────

  function initHeroArrival() {
    const title = document.querySelector('.hero-title');
    const sub = document.querySelector('.hero-sub');
    const ctasContainer = document.querySelector('.hero .flex.flex-wrap');

    if (title) {
      title.setAttribute('data-entrance', 'true');
    }
    if (sub) {
      sub.setAttribute('data-entrance', 'true');
    }
    if (ctasContainer) {
      ctasContainer.classList.add('hero-ctas');
      ctasContainer.setAttribute('data-entrance', 'true');
    }
  }

  function initHeroParallax() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return; // Respect user preference
    }

    if (window.innerWidth < 768) {
      return; // Disable on mobile
    }

    const heroMedia = document.querySelector('.hero-media');
    if (!heroMedia) return;

    window.addEventListener('scroll', () => {
      const scrolled = window.scrollY;
      const heroSection = document.querySelector('.hero');
      const heroBottom = heroSection ? heroSection.offsetHeight : 0;

      if (scrolled < heroBottom) {
        // Scroll at 0.85x speed
        const offset = scrolled * 0.15; // 1 - 0.85
        heroMedia.style.transform = `translateY(${offset}px)`;
      } else {
        // Cap at bottom of hero
        const offset = heroBottom * 0.15;
        heroMedia.style.transform = `translateY(${offset}px)`;
      }
    }, { passive: true });
  }

  // ─────────────────────────────────────────────────────────────
  // MOVE 7: Signature Details
  // ─────────────────────────────────────────────────────────────

  function initSignatureDetails() {
    // Ensure smooth scroll is set
    document.documentElement.style.scrollBehavior = 'smooth';

    // Enhance focus visibility for keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        document.body.classList.add('keyboard-focused');
      }
    });

    document.addEventListener('mousedown', () => {
      document.body.classList.remove('keyboard-focused');
    });
  }

  // ─────────────────────────────────────────────────────────────
  // Init on load
  // ─────────────────────────────────────────────────────────────

  function init() {
    initHeroArrival();
    initHeroParallax();
    initSignatureDetails();
  }

  // Run on DOMContentLoaded or if document is already ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
