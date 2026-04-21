const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const ROOT = path.resolve(__dirname, '..');
const SHOTS = path.join(ROOT, 'screenshots');
const REF = path.join(SHOTS, 'reference');

const localFile = 'file://' + path.join(ROOT, 'index.html');

// Allow targeted section captures via CLI arg: node screenshot.js [section]
const mode = process.argv[2] || 'all';

// Hard cap on full-page screenshot height (CSS px). Pages taller than this are
// cropped via Puppeteer's `clip` so a single full-page render can't exhaust
// the session image budget. Section crops still use their natural sizes.
const FULL_PAGE_MAX_HEIGHT = 4000;

async function captureFullPageCapped(page, filePath) {
  const viewport = page.viewport();
  const docHeight = await page.evaluate(
    () => document.documentElement.scrollHeight
  );
  if (docHeight <= FULL_PAGE_MAX_HEIGHT) {
    await page.screenshot({ path: filePath, fullPage: true });
  } else {
    await page.screenshot({
      path: filePath,
      clip: { x: 0, y: 0, width: viewport.width, height: FULL_PAGE_MAX_HEIGHT },
    });
    console.log(
      `    (clipped: doc was ${docHeight}px, capped at ${FULL_PAGE_MAX_HEIGHT}px)`
    );
  }
}

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();

  // Scroll through the page once so IntersectionObserver fires for every
  // .reveal section before we capture (otherwise off-screen reveals stay
  // at opacity 0 in fullPage screenshots).
  async function primeReveals() {
    await page.evaluate(async () => {
      await new Promise((resolve) => {
        const step = 400;
        let y = 0;
        const h = document.documentElement.scrollHeight;
        const timer = setInterval(() => {
          y += step;
          window.scrollTo(0, y);
          if (y >= h) {
            clearInterval(timer);
            window.scrollTo(0, 0);
            setTimeout(resolve, 450);
          }
        }, 30);
      });
    });
  }

  // --- Desktop full page ---
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
  await page.goto(localFile, { waitUntil: 'networkidle0' });
  await primeReveals();
  await captureFullPageCapped(page, path.join(SHOTS, 'full.png'));
  console.log('  saved screenshots/full.png (1440w desktop)');

  // --- Desktop top (nav + utility bar) crop: fixed 200px so it works
  // whether header is in-flow or absolutely positioned ---
  await page.screenshot({
    path: path.join(SHOTS, 'top-desktop.png'),
    clip: { x: 0, y: 0, width: 1440, height: 200 },
  });
  console.log('  saved screenshots/top-desktop.png');

  // --- Mobile full page ---
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  await page.reload({ waitUntil: 'networkidle0' });
  await primeReveals();
  await page.screenshot({ path: path.join(SHOTS, 'full-mobile.png'), fullPage: true });
  console.log('  saved screenshots/full-mobile.png (390w mobile)');

  // --- Mobile top crop ---
  await page.screenshot({
    path: path.join(SHOTS, 'top-mobile.png'),
    clip: { x: 0, y: 0, width: 390, height: 200 },
  });
  console.log('  saved screenshots/top-mobile.png');

  // --- Mobile drawer open state ---
  try {
    await page.click('[data-mobile-open]');
    await new Promise((r) => setTimeout(r, 400));
    await page.screenshot({
      path: path.join(SHOTS, 'drawer-mobile.png'),
      fullPage: false,
    });
    console.log('  saved screenshots/drawer-mobile.png');
  } catch (e) {
    console.log('  (skipped drawer capture — selector missing)');
  }

  // --- Desktop mega-menu hover state (first item: About) ---
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
  await page.goto(localFile, { waitUntil: 'networkidle0' });
  try {
    // Force-open the first mega-panel via inline styles so the screenshot
    // captures the fully-rendered design state (bypasses Puppeteer hover flakiness).
    await page.evaluate(() => {
      const panel = document.querySelector('.nav-item .mega-panel');
      const link = document.querySelector('.nav-item .nav-link');
      if (panel) {
        panel.style.setProperty('opacity', '1', 'important');
        panel.style.setProperty('visibility', 'visible', 'important');
        panel.style.setProperty('transform', 'translateY(0)', 'important');
        panel.style.setProperty('transition', 'none', 'important');
      }
      if (link) {
        link.style.setProperty('color', '#990000', 'important');
        // add a fake underline via box-shadow to mimic :hover state
        link.style.setProperty('box-shadow', 'inset 0 -5px 0 0 #990000', 'important');
      }
    });
    await new Promise((r) => setTimeout(r, 200));
    await page.screenshot({
      path: path.join(SHOTS, 'mega-panel-desktop.png'),
      clip: { x: 0, y: 0, width: 1440, height: 500 },
    });
    console.log('  saved screenshots/mega-panel-desktop.png');
  } catch (e) {
    console.log('  (skipped mega-panel capture — error:', e.message, ')');
  }

  // --- Optional: reference screenshot of live Taft header area ---
  if (mode === 'all' || mode === 'ref') {
    if (!fs.existsSync(REF)) fs.mkdirSync(REF, { recursive: true });
    await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
    try {
      await page.goto('https://www.taftschool.org/', { waitUntil: 'networkidle2', timeout: 30000 });
      await new Promise(r => setTimeout(r, 1500));
      await page.screenshot({
        path: path.join(REF, 'taft-top-desktop.png'),
        clip: { x: 0, y: 0, width: 1440, height: 200 },
      });
      console.log('  saved screenshots/reference/taft-top-desktop.png');
    } catch (e) {
      console.log('  (skipped Taft reference — network/timeout)');
    }
  }

  await browser.close();
  console.log('Done.');
})();
