#!/usr/bin/env node
/* ============================================================================
   apple-surfaces.js — captures the four interactive material surfaces that a
   plain page screenshot can never show: the desktop mega-panel on hover, the
   mobile drawer open, the lightbox open, and the welcome card on first visit.

   Usage: node scripts/apple-surfaces.js <tag>
   ============================================================================ */
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const ROOT = path.resolve(__dirname, '..');
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function dismissWelcome(page) {
  await page.evaluate(() => {
    const btn = document.querySelector('[data-welcome-close]') || document.querySelector('[data-welcome-dismiss]');
    if (btn) btn.click();
    const ov = document.getElementById('dp-welcome');
    if (ov && ov.parentNode) ov.parentNode.removeChild(ov);
    document.body.classList.remove('dp-welcome-open');
  });
  await wait(250);
}

(async () => {
  const tag = process.argv[2];
  if (!tag) { console.error('Usage: node scripts/apple-surfaces.js <tag>'); process.exit(1); }
  const out = path.join(ROOT, 'screenshots', 'apple', tag);
  fs.mkdirSync(out, { recursive: true });

  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  /* ---- 1. Welcome card, first visit, mobile (fresh profile ⇒ it shows) ---- */
  await page.setViewport({ width: 375, height: 812, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await page.goto('file://' + path.join(ROOT, 'index.html'), { waitUntil: 'networkidle0' });
  await wait(1100); // let the materialize transition finish
  await page.screenshot({ path: path.join(out, 'surface-welcome-mobile.png') });
  console.log('  shot    welcome card @ 375px');

  /* ---- 2. Mobile drawer open ---- */
  await dismissWelcome(page);
  await page.evaluate(() => window.scrollTo(0, 500));
  await wait(400);
  const opened = await page.evaluate(() => {
    const btn = document.querySelector('[data-mobile-open]');
    if (!btn) return false;
    btn.click();
    return true;
  });
  await wait(750);
  if (opened) {
    await page.screenshot({ path: path.join(out, 'surface-drawer-mobile.png') });
    console.log('  shot    mobile drawer @ 375px');
  } else {
    console.log('  MISS    [data-mobile-open] not found');
  }

  /* ---- 3. Lightbox open, mobile (homepage gallery strip) ---- */
  await page.goto('file://' + path.join(ROOT, 'gallery.html'), { waitUntil: 'networkidle0' });
  await wait(600);
  await dismissWelcome(page);
  const lit = await page.evaluate(() => {
    const img = document.querySelector('[data-lightbox-group] .gallery-img img');
    if (!img) return false;
    img.click();
    return true;
  });
  await wait(900);
  if (lit) {
    await page.screenshot({ path: path.join(out, 'surface-lightbox-mobile.png') });
    console.log('  shot    lightbox @ 375px');
  } else {
    console.log('  MISS    no .gallery-img img inside [data-lightbox-group]');
  }

  /* ---- 4. Desktop mega-panel on hover ---- */
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
  await page.goto('file://' + path.join(ROOT, 'about/principals-note.html'), { waitUntil: 'networkidle0' });
  await wait(500);
  await page.evaluate(() => window.scrollTo(0, 0));
  const navLink = await page.$('.nav-item .nav-link');
  if (navLink) {
    await navLink.hover();
    await wait(500);
    /* PIN the panel open rather than trusting :hover to survive the capture.
       page.screenshot({clip}) re-rasters and drops the synthetic hover, so the
       panel was being photographed mid-fade-OUT: element opacity ~0.5, which
       washes the text, the burgundy APPLY button and the background together
       and leaves the photo behind it sharp. That reads exactly like a
       backdrop-filter failure and is not one — the material is fine, the
       screenshot was lying. Pinning removes the race entirely. */
    await page.evaluate(() => {
      const el = document.querySelector('.mega-panel');
      if (!el) return;
      el.style.setProperty('opacity', '1', 'important');
      el.style.setProperty('visibility', 'visible', 'important');
      el.style.setProperty('transform', 'none', 'important');
    });
    await wait(400);
    await page.screenshot({ path: path.join(out, 'surface-megapanel-desktop.png'), clip: { x: 0, y: 0, width: 1440, height: 620 } });
    console.log('  shot    mega-panel @ 1440px (pinned open)');
  } else {
    console.log('  MISS    no .nav-item .nav-link');
  }

  await browser.close();
  console.log(`\nDone → ${path.relative(ROOT, out)}/`);
})();
