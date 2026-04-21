const puppeteer = require('puppeteer');
const path = require('path');
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
  const file = path.resolve(__dirname, '..', 'index.html');
  await page.goto('file://' + file, { waitUntil: 'networkidle0' });
  // Locate news section by aria-label
  const news = await page.$('section[aria-label="Featured News"]');
  await news.screenshot({ path: path.resolve(__dirname, '..', 'screenshots/news-desktop.png') });
  await browser.close();
  console.log('News section screenshot saved.');
})();
