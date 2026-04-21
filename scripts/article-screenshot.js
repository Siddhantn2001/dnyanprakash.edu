const puppeteer = require('puppeteer');
const path = require('path');
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1600, deviceScaleFactor: 2 });
  const file = path.resolve(__dirname, '..', 'news', 'challenging-times-leaders.html');
  await page.goto('file://' + file, { waitUntil: 'networkidle0' });
  await page.screenshot({ path: path.resolve(__dirname, '..', 'screenshots/article-top.png') });
  await browser.close();
  console.log('Article top screenshot saved.');
})();
