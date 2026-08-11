#!/usr/bin/env node
/* ============================================================================
   apple-capture.js — before/after capture rig for the Apple-design pass (DEV ONLY)

   Captures the same set of pages at desktop (1440) and phone (375) widths so
   each phase can be compared frame-to-frame against the one before it.

   Usage:
       node scripts/apple-capture.js baseline      # writes screenshots/apple/baseline/
       node scripts/apple-capture.js phase1        # writes screenshots/apple/phase1/
       node scripts/apple-capture.js phase1 --measure   # also dump metrics JSON

   Every shot is taken AFTER dismissing the welcome overlay, because the card
   masks the page underneath (body.dp-welcome-open sets overflow:hidden) and
   every real visitor sees the page in the dismissed state.
   ============================================================================ */
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const ROOT = path.resolve(__dirname, '..');

// Representative slice of the site: homepage (hero + every homepage section),
// an editorial article, a data/index page, an action page, the gallery, and a
// Marathi page (Devanagari typography).
const PAGES = [
  { file: 'index.html', name: 'home' },
  { file: 'about/principals-note.html', name: 'article' },
  { file: 'news/index.html', name: 'news' },
  { file: 'contact.html', name: 'contact' },
  { file: 'gallery.html', name: 'gallery' },
  { file: 'mr/about/principals-note.html', name: 'marathi' },
];

const VIEWS = [
  { label: 'desktop', width: 1440, height: 900, mobile: false },
  { label: 'mobile', width: 375, height: 812, mobile: true },
];

async function dismissWelcome(page) {
  await page.evaluate(() => {
    const btn =
      document.querySelector('[data-welcome-close]') ||
      document.querySelector('[data-welcome-dismiss]') ||
      document.querySelector('.dp-welcome-close');
    if (btn) btn.click();
    else document.body.classList.remove('dp-welcome-open');
    const ov = document.getElementById('dp-welcome');
    if (ov && ov.parentNode) ov.parentNode.removeChild(ov);
  });
  await new Promise((r) => setTimeout(r, 300));
}

async function settleReveals(page) {
  // Walk the page so every IntersectionObserver reveal fires, then return to top.
  await page.evaluate(async () => {
    const h = document.body.scrollHeight;
    for (let y = 0; y <= h; y += 400) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 40));
    }
    window.scrollTo(0, 0);
    await new Promise((r) => setTimeout(r, 250));
  });
}

/* Header geometry + the type/material values each phase claims to change.
   Measured live in the browser so the report quotes real numbers. */
async function measure(page) {
  return page.evaluate(() => {
    const px = (v) => Math.round(parseFloat(v) * 100) / 100;
    const header = document.querySelector('.site-header');
    const out = { viewport: { w: innerWidth, h: innerHeight } };

    if (header) {
      const cs = getComputedStyle(header);
      out.headerTop = {
        height: px(header.getBoundingClientRect().height),
        pctOfScreen: Math.round((header.getBoundingClientRect().height / innerHeight) * 1000) / 10,
        position: cs.position,
      };
      const nav = header.querySelector('.main-nav');
      if (nav) {
        const ncs = getComputedStyle(nav);
        out.headerTop.navBackground = ncs.backgroundColor;
        out.headerTop.navBackdrop = ncs.backdropFilter || ncs.webkitBackdropFilter;
      }
    }

    // Scrolled (condensed) state
    window.scrollTo(0, 400);
    return new Promise((resolve) => {
      setTimeout(() => {
        if (header) {
          const cs = getComputedStyle(header);
          const nav = header.querySelector('.main-nav');
          out.headerScrolled = {
            height: px(header.getBoundingClientRect().height),
            paintedHeight: nav ? px(nav.getBoundingClientRect().bottom) : null,
            pctOfScreen: Math.round((header.getBoundingClientRect().height / innerHeight) * 1000) / 10,
            background: cs.backgroundColor,
          };
          if (nav) {
            const ncs = getComputedStyle(nav);
            out.headerScrolled.navBackground = ncs.backgroundColor;
            out.headerScrolled.navBackdrop = ncs.backdropFilter || ncs.webkitBackdropFilter;
          }
        }
        // Type samples
        const samples = {
          h1: 'h1, .hero-title',
          sectionTitle: '.section-title',
          eyebrow: '.section-eyebrow',
          newsHeadline: '.news-headline',
          body: '.prose p, .mission-body p, p',
        };
        out.type = {};
        for (const [k, sel] of Object.entries(samples)) {
          const el = document.querySelector(sel);
          if (!el) continue;
          const cs = getComputedStyle(el);
          out.type[k] = {
            size: px(cs.fontSize),
            lineHeight: cs.lineHeight === 'normal' ? 'normal' : px(cs.lineHeight),
            ratio:
              cs.lineHeight === 'normal'
                ? null
                : Math.round((parseFloat(cs.lineHeight) / parseFloat(cs.fontSize)) * 100) / 100,
            tracking: cs.letterSpacing,
            weight: cs.fontWeight,
          };
        }
        window.scrollTo(0, 0);
        setTimeout(() => resolve(out), 200);
      }, 500);
    });
  });
}

(async () => {
  const tag = process.argv[2];
  if (!tag) {
    console.error('Usage: node scripts/apple-capture.js <tag> [--measure]');
    process.exit(1);
  }
  const doMeasure = process.argv.includes('--measure');
  const outDir = path.join(ROOT, 'screenshots', 'apple', tag);
  fs.mkdirSync(outDir, { recursive: true });

  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  const metrics = {};

  for (const p of PAGES) {
    const file = path.join(ROOT, p.file);
    if (!fs.existsSync(file)) {
      console.log(`  skip    ${p.file} (missing)`);
      continue;
    }
    for (const v of VIEWS) {
      await page.setViewport({
        width: v.width,
        height: v.height,
        deviceScaleFactor: 2,
        isMobile: v.mobile,
        hasTouch: v.mobile,
      });
      await page.goto('file://' + file, { waitUntil: 'networkidle0' });
      await new Promise((r) => setTimeout(r, 400));
      await dismissWelcome(page);
      await settleReveals(page);

      // Above-the-fold shot — the frame that decides whether the chrome works.
      const foldPath = path.join(outDir, `${p.name}-${v.label}-fold.png`);
      await page.screenshot({ path: foldPath });

      // Full page.
      const fullPath = path.join(outDir, `${p.name}-${v.label}-full.png`);
      await page.screenshot({ path: fullPath, fullPage: true });

      // Scrolled shot — shows the condensed header over content (the glass test).
      await page.evaluate(() => window.scrollTo(0, 520));
      await new Promise((r) => setTimeout(r, 600));
      await page.screenshot({ path: path.join(outDir, `${p.name}-${v.label}-scrolled.png`) });
      await page.evaluate(() => window.scrollTo(0, 0));

      if (doMeasure) {
        metrics[`${p.name}-${v.label}`] = await measure(page);
      }
      console.log(`  shot    ${p.name} @ ${v.width}px`);
    }
  }

  await browser.close();

  if (doMeasure) {
    const mPath = path.join(outDir, 'metrics.json');
    fs.writeFileSync(mPath, JSON.stringify(metrics, null, 2));
    console.log(`\nMetrics → ${path.relative(ROOT, mPath)}`);
  }
  console.log(`\nDone → ${path.relative(ROOT, outDir)}/`);
})();
