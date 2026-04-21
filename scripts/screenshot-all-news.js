const puppeteer = require('puppeteer');
const path = require('path');

const ARTICLES = [
  '142-meritorious-students.html',
  'second-place-latur-division.html',
  'parents-grade-one-textbook.html',
  'mrunal-kulkarni-dialogue.html',
  'institute-head-satish-narhare.html',
  'challenging-times-leaders.html',
];

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1600, deviceScaleFactor: 2 });
  for (const a of ARTICLES) {
    const file = path.resolve(__dirname, '..', 'news', a);
    await page.goto('file://' + file, { waitUntil: 'networkidle0' });
    const out = path.resolve(__dirname, '..', 'screenshots', 'article-' + a.replace('.html', '') + '.png');
    await page.screenshot({ path: out });
    console.log('  saved', out);
  }
  await browser.close();
})();
