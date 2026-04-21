const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1600, deviceScaleFactor: 1 });
  const outDir = path.resolve(__dirname, '..', 'screenshots', 'verify');
  fs.mkdirSync(outDir, { recursive: true });
  const pages = ['about/index.html', 'academics/index.html', 'admission/index.html', 'campus-life/index.html'];
  for (const p of pages) {
    await page.goto('file://' + path.resolve(__dirname, '..', p), { waitUntil: 'networkidle0' });
    await page.screenshot({ path: path.join(outDir, p.replace(/\//g, '_').replace('.html', '.png')) });
    console.log('  ✓', p);
  }
  await browser.close();
})();
