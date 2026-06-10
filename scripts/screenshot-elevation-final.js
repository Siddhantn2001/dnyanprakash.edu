const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  const file = path.resolve(__dirname, '..', 'index.html');
  
  // Set viewport
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
  
  // Navigate
  await page.goto('file://' + file, { waitUntil: 'networkidle0' });
  
  // Immediately close any modal
  await page.evaluate(() => {
    // Hide welcome modal
    const modal = document.querySelector('[data-welcome-modal], [class*="modal"]');
    if (modal) modal.style.display = 'none';
  });
  
  // Wait for animations
  await page.evaluate(() => new Promise(r => setTimeout(r, 1000)));
  
  // Hero
  await page.screenshot({ path: `screenshots/elevation/hero-final.png`, fullPage: false });
  
  // Mission
  await page.evaluate(() => {
    const section = document.querySelector('[aria-label="Our Mission and at a Glance"]');
    if (section) {
      section.scrollIntoView();
    }
  });
  await page.evaluate(() => new Promise(r => setTimeout(r, 800)));
  await page.screenshot({ path: `screenshots/elevation/mission-final.png`, fullPage: false });
  
  // News
  await page.evaluate(() => {
    document.querySelector('[aria-label="Featured News"]')?.scrollIntoView();
  });
  await page.evaluate(() => new Promise(r => setTimeout(r, 800)));
  await page.screenshot({ path: `screenshots/elevation/news-final.png`, fullPage: false });
  
  console.log('✅ Final screenshots ready for comparison');
  await browser.close();
})();
