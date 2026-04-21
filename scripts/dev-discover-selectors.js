/*
 * _discover-drawer.js — one-off helper.
 * Loads taftschool.org at mobile viewport and prints JSON describing every
 * interactive element (button / role=button / [aria-expanded] / link with
 * aria-controls / svg-only buttons) whose bounding rect intersects the top
 * 100px of the viewport. Use to identify the hamburger before wiring it
 * into capture-taft.js. Does NOT click anything.
 *
 * Run: node scripts/_discover-drawer.js
 */
const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox'],
  });
  const page = await browser.newPage();
  await page.setViewport({
    width: 390,
    height: 844,
    deviceScaleFactor: 1,
    isMobile: true,
    hasTouch: true,
  });
  await page.goto('https://www.taftschool.org/', {
    waitUntil: 'networkidle2',
    timeout: 60000,
  });
  // Settle any animations / lazy modal injection
  await new Promise((r) => setTimeout(r, 2500));

  // Dismiss the donation modal first (selector confirmed in prior run).
  // Without this, the modal occludes the top-band buttons we're trying to find.
  const dismissed = await page.evaluate(() => {
    const btn = document.querySelector('#fsPagePopCloseButton');
    if (btn) { btn.click(); return true; }
    return false;
  });
  if (dismissed) await new Promise((r) => setTimeout(r, 800));

  const candidates = await page.evaluate(() => {
    const TOP_BAND = 100;
    const seen = new Set();
    const out = [];

    function describe(el) {
      const r = el.getBoundingClientRect();
      const inTopBand =
        r.top < TOP_BAND && r.bottom > 0 && r.width > 0 && r.height > 0;
      if (!inTopBand) return null;
      // Build a stable selector hint
      const id = el.id ? `#${el.id}` : '';
      const cls = el.className && typeof el.className === 'string'
        ? '.' + el.className.trim().split(/\s+/).slice(0, 4).join('.')
        : '';
      const tag = el.tagName.toLowerCase();
      const text = (el.textContent || '').trim().slice(0, 40);
      const aria = {
        label: el.getAttribute('aria-label'),
        controls: el.getAttribute('aria-controls'),
        expanded: el.getAttribute('aria-expanded'),
        haspopup: el.getAttribute('aria-haspopup'),
      };
      // strip null aria entries for readability
      Object.keys(aria).forEach((k) => aria[k] == null && delete aria[k]);
      // Detect svg-only / icon-only (no text content but has svg child)
      const hasSvg = !!el.querySelector('svg');
      const role = el.getAttribute('role');
      return {
        tag,
        id: el.id || null,
        classes: el.className || null,
        text: text || null,
        role: role || null,
        aria,
        hasSvg,
        rect: {
          top: Math.round(r.top),
          left: Math.round(r.left),
          width: Math.round(r.width),
          height: Math.round(r.height),
        },
        outerHTMLSnippet: el.outerHTML.slice(0, 200),
      };
    }

    // Walk every element. Filter: must be in top band AND look interactive.
    // "Interactive" = clickable (cursor:pointer), or has an svg child, or is
    // an anchor / button. We also exclude obviously-too-large elements (whole
    // header containers) by capping width.
    document.querySelectorAll('*').forEach((el) => {
      if (seen.has(el)) return;
      const r = el.getBoundingClientRect();
      if (r.top >= 100 || r.bottom <= 0 || r.width <= 0 || r.height <= 0) return;
      if (r.width > 80 || r.height > 80) return; // skip large containers
      const cs = window.getComputedStyle(el);
      const looksInteractive =
        cs.cursor === 'pointer' ||
        el.tagName === 'A' ||
        el.tagName === 'BUTTON' ||
        el.hasAttribute('onclick') ||
        !!el.querySelector('svg');
      if (!looksInteractive) return;
      seen.add(el);
      const d = describe(el);
      if (d) out.push({ matchedBy: 'walk', ...d });
    });
    return out;
  });

  // Also save a debug screenshot of the top band so the user can eyeball it.
  await page.screenshot({
    path: 'screenshots/reference/_debug-mobile-top.png',
    clip: { x: 0, y: 0, width: 390, height: 100 },
  });

  console.log(JSON.stringify({ count: candidates.length, candidates }, null, 2));
  await browser.close();
})();
