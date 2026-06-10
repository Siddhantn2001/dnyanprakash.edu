const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  const file = path.resolve(__dirname, '..', 'index.html');
  await page.goto('file://' + file, { waitUntil: 'networkidle0' });
  
  // Close welcome modal if present
  await page.evaluate(() => {
    const modal = document.querySelector('[data-welcome-modal]');
    const closeBtn = document.querySelector('[data-welcome-close]');
    if (modal) modal.remove();
    if (closeBtn) closeBtn.click();
  });
  
  // Hero
  await page.screenshot({ path: `screenshots/elevation/final-hero-desktop.png`, fullPage: false });
  
  // Mission
  await page.evaluate(() => {
    document.querySelector('[aria-label="Our Mission and at a Glance"]')?.scrollIntoView();
  });
  await page.evaluate(() => new Promise(r => setTimeout(r, 600)));
  await page.screenshot({ path: `screenshots/elevation/final-mission-desktop.png`, fullPage: false });
  
  // Newsletter
  await page.evaluate(() => {
    Array.from(document.querySelectorAll('section')).find(s => s.textContent.includes('Publications'))?.scrollIntoView();
  });
  await page.evaluate(() => new Promise(r => setTimeout(r, 600)));
  await page.screenshot({ path: `screenshots/elevation/final-newsletter-desktop.png`, fullPage: false });
  
  // News
  await page.evaluate(() => {
    document.querySelector('[aria-label="Featured News"]')?.scrollIntoView();
  });
  await page.evaluate(() => new Promise(r => setTimeout(r, 600)));
  await page.screenshot({ path: `screenshots/elevation/final-news-desktop.png`, fullPage: false });
  
  console.log('✅ Clean screenshots captured');
  await browser.close();
})();
