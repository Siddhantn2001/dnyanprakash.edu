const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const PAGES = [
  'index.html',
  'news/challenging-times-leaders.html',
  'news/142-meritorious-students.html',
  'about/mission.html',
  'academics/vidyaniketan.html',
  'admission/faq.html',
  'campus-life/arts.html',
  'news/index.html',
];

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  const outDir = path.resolve(__dirname, '..', 'screenshots', 'full-check');
  fs.mkdirSync(outDir, { recursive: true });
  for (const p of PAGES) {
    const file = path.resolve(__dirname, '..', p);
    try {
      await page.goto('file://' + file, { waitUntil: 'networkidle0', timeout: 15000 });
      const name = p.replace(/\//g, '_').replace('.html', '.png');
      await page.screenshot({ path: path.join(outDir, name), fullPage: true });
      console.log('  ✓', name);
    } catch (e) {
      console.log('  ✗', p, e.message);
    }
  }
  await browser.close();
})();
