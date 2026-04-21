#!/usr/bin/env node
/*
  scripts/shoot-pages.js — screenshot every page into screenshots/pages/
  Usage: node scripts/shoot-pages.js
*/
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'screenshots', 'pages');
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

const TARGETS = [
  { file: 'index.html', name: 'home' },
  { file: 'about/index.html', name: 'about-index' },
  { file: 'about/at-a-glance.html', name: 'about-at-a-glance' },
  { file: 'about/mission.html', name: 'about-mission' },
  { file: 'about/history.html', name: 'about-history' },
  { file: 'about/faculty.html', name: 'about-faculty' },
  { file: 'admission/index.html', name: 'admission-index' },
  { file: 'admission/why-dnyanprakash.html', name: 'admission-why' },
  { file: 'admission/faq.html', name: 'admission-faq' },
  { file: 'academics/index.html', name: 'academics-index' },
  { file: 'academics/balbhavan.html', name: 'academics-balbhavan' },
  { file: 'academics/balvikas-kendra.html', name: 'academics-balvikas-kendra' },
  { file: 'academics/vidyaniketan.html', name: 'academics-vidyaniketan' },
  { file: 'academics/narhare-learning-home.html', name: 'academics-nlh' },
  { file: 'campus-life/index.html', name: 'campus-life-index' },
  { file: 'campus-life/student-life.html', name: 'campus-life-student' },
  { file: 'campus-life/arts.html', name: 'campus-life-arts' },
  { file: 'campus-life/events.html', name: 'campus-life-events' },
  { file: 'news/index.html', name: 'news-index' },
  { file: 'news/second-place-latur-division.html', name: 'news-second-place' },
  { file: 'alumni.html', name: 'alumni' },
  { file: 'give.html', name: 'give' },
  { file: 'contact.html', name: 'contact' },
  { file: 'gallery.html', name: 'gallery' },
];

const MAX_HEIGHT = 3200;

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });

  for (const t of TARGETS) {
    const url = 'file://' + path.join(ROOT, t.file);
    try {
      await page.goto(url, { waitUntil: 'networkidle0', timeout: 20000 });
      // Scroll through the page once so IntersectionObserver fires for every
      // .reveal section before we capture (otherwise off-screen reveals stay
      // at opacity 0 in fullPage screenshots).
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
      const h = await page.evaluate(() => document.documentElement.scrollHeight);
      if (h <= MAX_HEIGHT) {
        await page.screenshot({ path: path.join(OUT, `${t.name}.png`), fullPage: true });
      } else {
        await page.screenshot({
          path: path.join(OUT, `${t.name}.png`),
          clip: { x: 0, y: 0, width: 1440, height: MAX_HEIGHT },
        });
      }
      console.log('  shot', t.name);
    } catch (e) {
      console.log('  FAIL', t.name, '-', e.message);
    }
  }
  await browser.close();
  console.log('Done —', TARGETS.length, 'pages');
})();
