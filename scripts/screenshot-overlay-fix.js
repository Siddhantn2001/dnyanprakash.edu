const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1000, deviceScaleFactor: 1 });
  const outDir = path.resolve(__dirname, '..', 'screenshots', 'overlay-fix');
  fs.mkdirSync(outDir, { recursive: true });
  const pages = [
    'about/learning-through-action.html',
    'gallery.html',
    'campus-life/events.html',
    'give.html',
    'contact.html',
    'alumni.html',
  ];
  for (const p of pages) {
    await page.goto('file://' + path.resolve(__dirname, '..', p), { waitUntil: 'networkidle0' });
    const name = p.replace(/\//g, '_').replace('.html', '.png');
    await page.screenshot({ path: path.join(outDir, name) });
    console.log('  ✓', name);
  }
  await browser.close();
})();
