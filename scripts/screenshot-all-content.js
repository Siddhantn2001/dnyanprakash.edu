const puppeteer = require('puppeteer');
const path = require('path');

const PAGES = [
  // Reference
  'news/challenging-times-leaders.html',
  // News
  'news/142-meritorious-students.html',
  'news/second-place-latur-division.html',
  'news/parents-grade-one-textbook.html',
  'news/mrunal-kulkarni-dialogue.html',
  'news/institute-head-satish-narhare.html',
  // About
  'about/mission.html',
  'about/history.html',
  'about/faculty.html',
  'about/at-a-glance.html',
  'about/about-education.html',
  'about/learning-through-action.html',
  // Academics
  'academics/balbhavan.html',
  'academics/balvikas-kendra.html',
  'academics/vidyaniketan.html',
  'academics/narhare-learning-home.html',
  // Admission
  'admission/why-dnyanprakash.html',
  'admission/faq.html',
  // Campus Life
  'campus-life/arts.html',
  'campus-life/student-life.html',
  // Listings
  'news/index.html',
];

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1600, deviceScaleFactor: 1 });
  const outDir = path.resolve(__dirname, '..', 'screenshots', 'verify');
  require('fs').mkdirSync(outDir, { recursive: true });
  for (const p of PAGES) {
    const file = path.resolve(__dirname, '..', p);
    try {
      await page.goto('file://' + file, { waitUntil: 'networkidle0', timeout: 15000 });
      const name = p.replace(/\//g, '_').replace('.html', '.png');
      await page.screenshot({ path: path.join(outDir, name) });
      console.log('  ✓', name);
    } catch (e) {
      console.log('  ✗', p, e.message);
    }
  }
  await browser.close();
})();
