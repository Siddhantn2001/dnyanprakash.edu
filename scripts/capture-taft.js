/*
 * capture-taft.js
 * One-time reference-library capture: visits Taft pages, saves full-page
 * and cropped section screenshots for use as the visual truth when building
 * Dnyanprakash sections. Outputs to screenshots/reference/.
 *
 * Run:  node scripts/capture-taft.js
 */

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const REF = path.resolve(__dirname, '..', 'screenshots', 'reference');
if (!fs.existsSync(REF)) fs.mkdirSync(REF, { recursive: true });

const DESKTOP = { width: 1440, height: 900, deviceScaleFactor: 1 };
const MOBILE = {
  width: 390,
  height: 844,
  deviceScaleFactor: 1,
  isMobile: true,
  hasTouch: true,
};

const PAGES = [
  { slug: 'home', url: 'https://www.taftschool.org/' },
  { slug: 'about', url: 'https://www.taftschool.org/about' },
  { slug: 'admission', url: 'https://www.taftschool.org/admission' },
  { slug: 'academics', url: 'https://www.taftschool.org/academics' },
  { slug: 'campus-life', url: 'https://www.taftschool.org/campus-life' },
  { slug: 'giving', url: 'https://www.taftschool.org/giving' },
];

// Homepage sections, located by visible text. "topY" means fixed-position.
const HOME_SECTIONS = [
  { key: 'top-nav', topY: 0, height: 150 },
  { key: 'hero', topY: 0, height: 780 },
  { key: 'news-rotator', marker: 'View All News', height: 220 },
  { key: 'meet-taftie', marker: 'Meet a Taftie', height: 600 },
  { key: 'video-spotlight', marker: 'Video Spotlight', height: 500 },
  { key: 'events', marker: 'Upcoming Events', height: 500 },
  { key: 'academics', marker: 'Explore Our Academics', height: 500 },
  { key: 'mission', marker: 'Our Mission', height: 600 },
  { key: 'stats', marker: 'Taft at a Glance', height: 500 },
  { key: 'footer', marker: 'The Taft School', height: 500 },
];

const NAV_ITEMS = [
  { label: 'About', slug: 'about' },
  { label: 'Admission', slug: 'admission' },
  { label: 'Academics', slug: 'academics' },
  { label: 'Arts', slug: 'arts' },
  { label: 'Athletics', slug: 'athletics' },
  { label: 'Campus Life', slug: 'campus-life' },
  { label: 'Giving', slug: 'giving' },
  { label: 'Living Our Motto', slug: 'living-our-motto' },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

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

// Finds the smallest element whose textContent contains the marker
// (case-insensitive) and returns its absolute Y in document coords.
async function findMarkerY(page, marker) {
  return page.evaluate((text) => {
    const needle = text.toLowerCase();
    let best = null;
    let bestLen = Infinity;
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_ELEMENT,
      null,
      false
    );
    while (walker.nextNode()) {
      const el = walker.currentNode;
      const tc = (el.textContent || '').toLowerCase();
      if (!tc.includes(needle)) continue;
      // Prefer more specific (shorter-text) matches
      if (tc.length < bestLen) {
        best = el;
        bestLen = tc.length;
      }
    }
    if (!best) return null;
    const r = best.getBoundingClientRect();
    return r.top + window.scrollY;
  }, marker);
}

async function capturePage(browser, url, slug, viewport) {
  const page = await browser.newPage();
  await page.setViewport(viewport);
  try {
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
    await sleep(1500);
    const name = viewport.width >= 1000 ? 'desktop' : 'mobile';
    await captureFullPageCapped(page, path.join(REF, `taft-${slug}-${name}.png`));
    console.log(`  taft-${slug}-${name}.png`);
  } catch (e) {
    console.log(`  skipped ${slug} (${viewport.width}): ${e.message}`);
  } finally {
    await page.close();
  }
}

async function captureHomeSections(browser, viewport) {
  const page = await browser.newPage();
  await page.setViewport(viewport);
  const vpName = viewport.width >= 1000 ? 'desktop' : 'mobile';
  try {
    await page.goto('https://www.taftschool.org/', {
      waitUntil: 'networkidle2',
      timeout: 60000,
    });
    await sleep(2000);
    // Trigger lazy-load: scroll the full page once so images below fold render.
    await page.evaluate(async () => {
      const step = 400;
      for (let y = 0; y < document.body.scrollHeight; y += step) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 100));
      }
      window.scrollTo(0, 0);
    });
    await sleep(800);

    for (const sec of HOME_SECTIONS) {
      const file = path.join(REF, `taft-home-${sec.key}-${vpName}.png`);
      let y = sec.topY;
      if (sec.marker) {
        const found = await findMarkerY(page, sec.marker);
        if (found == null) {
          console.log(`  (no marker: ${sec.key})`);
          continue;
        }
        y = Math.max(0, found - 100);
      }
      await page.evaluate((to) => window.scrollTo(0, to), y);
      await sleep(400);
      const h = Math.min(sec.height || 600, 1000);
      // After scroll, clip from viewport 0 but use absolute doc y.
      try {
        await page.screenshot({
          path: file,
          clip: { x: 0, y: y, width: viewport.width, height: h },
        });
        console.log(`  ${path.basename(file)}`);
      } catch (e) {
        console.log(`  ${sec.key} clip err: ${e.message}`);
      }
    }
  } catch (e) {
    console.log(`  home sections err: ${e.message}`);
  } finally {
    await page.close();
  }
}

async function captureMegaMenus(browser) {
  const page = await browser.newPage();
  await page.setViewport(DESKTOP);
  try {
    await page.goto('https://www.taftschool.org/', {
      waitUntil: 'networkidle2',
      timeout: 60000,
    });
    await sleep(2000);

    for (const item of NAV_ITEMS) {
      try {
        // Find the top-level nav <a> whose visible text matches exactly.
        const handle = await page.evaluateHandle((label) => {
          const needle = label.toLowerCase().trim();
          const anchors = document.querySelectorAll('a');
          for (const a of anchors) {
            const t = (a.textContent || '').trim().toLowerCase();
            if (t === needle) {
              // Filter out footer/duplicate anchors by requiring the link to be in the top 200px
              const r = a.getBoundingClientRect();
              if (r.top + window.scrollY < 200 && r.width > 20) return a;
            }
          }
          return null;
        }, item.label);

        const el = handle.asElement();
        if (!el) {
          console.log(`  (no nav link: ${item.label})`);
          continue;
        }

        await el.hover();
        await sleep(700); // allow mega-menu transition
        const file = path.join(REF, `taft-megamenu-${item.slug}-desktop.png`);
        await page.screenshot({
          path: file,
          clip: { x: 0, y: 0, width: 1440, height: 700 },
        });
        console.log(`  ${path.basename(file)}`);
        // Close by moving mouse far away
        await page.mouse.move(10, 10);
        await sleep(400);
      } catch (e) {
        console.log(`  ${item.label} hover err: ${e.message}`);
      }
    }
  } finally {
    await page.close();
  }
}

async function captureMobileDrawer(browser) {
  const page = await browser.newPage();
  await page.setViewport(MOBILE);
  try {
    await page.goto('https://www.taftschool.org/', {
      waitUntil: 'networkidle2',
      timeout: 60000,
    });
    await sleep(1500);
    // Try a few common selectors for the hamburger.
    const selectors = [
      'button[aria-label*="menu" i]',
      '.menu-toggle',
      '.hamburger',
      '[class*="menu-open"]',
      '[class*="mobile-menu"]',
      'button[class*="menu"]',
    ];
    let clicked = false;
    for (const s of selectors) {
      const el = await page.$(s);
      if (el) {
        await el.click();
        clicked = true;
        console.log(`  (clicked hamburger: ${s})`);
        break;
      }
    }
    if (!clicked) {
      console.log('  (no hamburger selector matched)');
    }
    await sleep(900);
    await page.screenshot({ path: path.join(REF, 'taft-drawer-mobile.png') });
    console.log('  taft-drawer-mobile.png');
  } catch (e) {
    console.log(`  drawer err: ${e.message}`);
  } finally {
    await page.close();
  }
}

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox'],
  });

  console.log('[1/4] Full-page captures (6 pages × 2 viewports)');
  for (const p of PAGES) {
    await capturePage(browser, p.url, p.slug, DESKTOP);
    await capturePage(browser, p.url, p.slug, MOBILE);
  }

  console.log('[2/4] Homepage section crops (desktop)');
  await captureHomeSections(browser, DESKTOP);

  console.log('[3/4] Homepage section crops (mobile)');
  await captureHomeSections(browser, MOBILE);

  console.log('[4/4] Mega-menu hovers (desktop) + mobile drawer');
  await captureMegaMenus(browser);
  await captureMobileDrawer(browser);

  await browser.close();
  console.log('Done.');
})();
