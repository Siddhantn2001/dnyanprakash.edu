/* ═══════════════════════════════════════════════════════════════
   Landing Page Elevation — Interactive Layer
   Handles: Ghost depth, hero arrival, parallax, details
   ═══════════════════════════════════════════════════════════════ */

(function() {
  'use strict';

  // ─────────────────────────────────────────────────────────────
  // MOVE 3: Ghost Depth Layer — Inject decorative text
  // ─────────────────────────────────────────────────────────────

  function injectGhostLayers() {
    // Ghost "1999" behind Mission section
    const missionSection = document.querySelector('[aria-label="Our Mission and at a Glance"]');
    if (missionSection) {
      const ghost = document.createElement('div');
      ghost.className = 'ghost-text behind-content';
      ghost.setAttribute('aria-hidden', 'true');
      ghost.style.cssText = `
        position: absolute;
        top: 50%;
        right: -80px;
        transform: translateY(-50%);
        font-size: clamp(180px, 22vw, 320px);
        line-height: 1;
        white-space: nowrap;
        color: rgba(26, 22, 18, 0.04);
        pointer-events: none;
        z-index: 1;
      `;
      ghost.textContent = '1999';
      missionSection.style.position = 'relative';
      missionSection.insertBefore(ghost, missionSection.firstChild);
    }

    // Ghost "८२" behind Newsletter section (Devanagari 82 — year founded + school motto)
    const newsletterSection = document.querySelector('[data-id="newsletter"]') ||
                              Array.from(document.querySelectorAll('section')).find(s =>
                                s.textContent.includes('Publications') ||
                                s.querySelector('.newsletter-header')
                              );
    if (newsletterSection) {
      const ghost2 = document.createElement('div');
      ghost2.className = 'ghost-text behind-content';
      ghost2.setAttribute('aria-hidden', 'true');
      ghost2.style.cssText = `
        position: absolute;
        top: 20%;
        left: -100px;
        font-size: clamp(160px, 20vw, 280px);
        line-height: 1;
        color: rgba(26, 22, 18, 0.05);
        font-family: 'Noto Serif Devanagari', serif;
        pointer-events: none;
        z-index: 1;
      `;
      ghost2.textContent = '८२';
      newsletterSection.style.position = 'relative';
      newsletterSection.insertBefore(ghost2, newsletterSection.firstChild);
    }

    // Section numbers — inject "01", "02", "03" beside major sections
    const sections = document.querySelectorAll('section.section-pad');
    sections.forEach((section, idx) => {
      if (idx === 0) return; // Skip hero
      if (!section.querySelector('h2.section-title')) return; // Skip sections without title

      const num = String(idx).padStart(2, '0');
      const label = document.createElement('span');
      label.className = 'section-number';
      label.setAttribute('aria-hidden', 'true');
      label.textContent = num;

      const eyebrow = section.querySelector('.section-eyebrow') || section.querySelector('h2.section-title');
      if (eyebrow && !eyebrow.parentElement.querySelector('.section-number')) {
        eyebrow.parentElement.style.position = 'relative';
        eyebrow.parentElement.insertBefore(label, eyebrow);
      }
    });
  }

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
    injectGhostLayers();
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
