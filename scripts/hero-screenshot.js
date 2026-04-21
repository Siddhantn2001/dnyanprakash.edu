const puppeteer = require('puppeteer');
const path = require('path');
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
  const file = path.resolve('/Users/siddhantnarhare/dnyanprakash-website/index.html');
  await page.goto('file://' + file, { waitUntil: 'networkidle0' });
  const hero = await page.$('section.hero');
  await hero.screenshot({ path: '/Users/siddhantnarhare/dnyanprakash-website/screenshots/hero-desktop.png' });
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  await page.reload({ waitUntil: 'networkidle0' });
  const heroM = await page.$('section.hero');
  await heroM.screenshot({ path: '/Users/siddhantnarhare/dnyanprakash-website/screenshots/hero-mobile.png' });
  await browser.close();
  console.log('Hero screenshots saved.');
})();
