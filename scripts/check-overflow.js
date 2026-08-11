#!/usr/bin/env node
/* ============================================================================
   check-overflow.js — mobile horizontal-overflow regression guard (DEV ONLY)

   Why this exists
   ---------------
   In July 2026 the homepage could be swiped sideways on mobile, revealing a
   white gap on the right. Root cause: decorative content (the newsletter
   coverflow's off-screen fanned covers, the ghost "1999"/"८२" watermarks)
   extended up to ~346px past the viewport, and containment relied only on
   `html { overflow-x: clip }`, which iOS Safari < 16 ignores. See the fix in
   scripts/mobile-polish.css (`.newsletter-section, .mission-stats { overflow-x:
   clip }`) and index.html (footer `minmax(0,1fr)`, input `min-width:0`, stats
   arrow insets).

   This script re-verifies the invariant that made the bug detectable:

       documentElement.scrollWidth === clientWidth   (no horizontal overflow)

   for every page at several narrow widths, AFTER dismissing the welcome
   overlay (the bug is masked while `body.dp-welcome-open { overflow:hidden }`
   is active — it only appears once the visitor closes the card).

   How to run
   ----------
       node scripts/check-overflow.js            # scan every page
       node scripts/check-overflow.js index.html # scan one page (substring ok)

   Exit code 1 if ANY page overflows at ANY width, and it prints the worst
   offending element so you know where to look. Never run by the owner; this
   is a developer pre-flight check, like scripts/screenshot.js.
   ============================================================================ */
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

// iPhone-relevant widths: SE/mini (320/360/375), 12–15 (390/393), Plus/Max (414/430).
const WIDTHS = [320, 360, 375, 390, 393, 414, 430];
const TOLERANCE = 1; // sub-pixel rounding slack

function findPages(filter) {
  const root = path.resolve(__dirname, '..');
  const out = [];
  (function walk(dir) {
    for (const name of fs.readdirSync(dir)) {
      if (name === 'node_modules' || name === '.git') continue;
      const full = path.join(dir, name);
      const stat = fs.statSync(full);
      if (stat.isDirectory()) walk(full);
      else if (name.endsWith('.html')) out.push(full);
    }
  })(root);
  // Skip the raw Taft reference capture — not our page.
  let pages = out.filter((f) => !f.includes(path.join('screenshots', 'reference')));
  if (filter) pages = pages.filter((f) => f.includes(filter));
  return pages.sort();
}

async function checkPage(page, file) {
  const results = [];
  for (const width of WIDTHS) {
    await page.setViewport({ width, height: 820, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
    await page.goto('file://' + file, { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 350));
    // Dismiss the welcome overlay exactly as a visitor would (the bug is masked
    // until then). Fall back to removing the lock class if the button is absent.
    await page.evaluate(() => {
      const btn = document.querySelector('[data-welcome-close]') || document.querySelector('.dp-welcome-close');
      if (btn) btn.click();
      else document.body.classList.remove('dp-welcome-open');
    });
    await new Promise((r) => setTimeout(r, 250));
    // Scroll through so every IntersectionObserver reveal settles.
    await page.evaluate(async () => {
      const h = document.body.scrollHeight;
      for (let y = 0; y <= h; y += 300) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 15)); }
      window.scrollTo(0, 0);
      await new Promise((r) => setTimeout(r, 150));
    });
    const r = await page.evaluate((tol) => {
      const de = document.documentElement;
      const cw = de.clientWidth;
      const overflow = de.scrollWidth - cw;
      let worst = null;
      if (overflow > tol) {
        for (const el of document.querySelectorAll('*')) {
          const rc = el.getBoundingClientRect();
          if (rc.width === 0 && rc.height === 0) continue;
          const over = Math.round(rc.right - cw);
          if (over > tol && (!worst || over > worst.over)) {
            worst = { over, tag: el.tagName.toLowerCase(), cls: (el.className && el.className.toString ? el.className.toString() : '').slice(0, 50) };
          }
        }
      }
      return { cw, scrollWidth: de.scrollWidth, overflow, worst };
    }, TOLERANCE);
    results.push({ width, ...r });
  }
  return results;
}

(async () => {
  const filter = process.argv[2];
  const pages = findPages(filter);
  if (!pages.length) { console.error('No pages matched.'); process.exit(1); }
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  const failures = [];
  for (const file of pages) {
    const rel = path.relative(path.resolve(__dirname, '..'), file);
    const res = await checkPage(page, file);
    const bad = res.filter((r) => r.overflow > TOLERANCE);
    if (bad.length) {
      failures.push({ rel, bad });
      console.log(`✗ ${rel}`);
      for (const b of bad) {
        console.log(`    ${b.width}px  overflow ${b.overflow}px  →  <${b.worst.tag} class="${b.worst.cls}"> (+${b.worst.over}px)`);
      }
    } else {
      console.log(`✓ ${rel}`);
    }
  }
  await browser.close();
  console.log('\n' + '─'.repeat(60));
  if (failures.length) {
    console.log(`FAIL — ${failures.length}/${pages.length} page(s) have horizontal overflow on mobile.`);
    console.log('Each listed element extends past the viewport right edge. Clip it at a');
    console.log('mid-page wrapper (overflow-x: clip) or constrain its width — see');
    console.log('scripts/mobile-polish.css for the pattern. Do NOT add overflow:hidden to <body> (§11).');
    process.exit(1);
  }
  console.log(`PASS — all ${pages.length} pages contained at widths ${WIDTHS.join(', ')}px.`);
})();
