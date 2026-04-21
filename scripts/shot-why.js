const puppeteer = require('puppeteer');
const path = require('path');
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1600, deviceScaleFactor: 1 });
  await page.goto('file://' + path.resolve(__dirname, '..', 'admission/why-dnyanprakash.html'), { waitUntil: 'networkidle0' });
  await page.screenshot({ path: path.resolve(__dirname, '..', 'screenshots/why-dnyanprakash.png'), fullPage: true });
  await browser.close();
  console.log('Saved.');
})();
