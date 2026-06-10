const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  const file = path.resolve(__dirname, '..', 'index.html');
  
  const viewports = [
    { name: 'desktop', width: 1440, height: 900 },
  ];
  
  for (const vp of viewports) {
    await page.setViewport({ width: vp.width, height: vp.height, deviceScaleFactor: 2 });
    await page.goto('file://' + file, { waitUntil: 'networkidle0' });
    
    // Hero
    await page.screenshot({ path: `screenshots/elevation/after-hero-${vp.name}.png`, fullPage: false });
    
    // Scroll to mission
    await page.evaluate(() => {
      document.querySelector('[aria-label="Our Mission and at a Glance"]')?.scrollIntoView();
    });
    await page.evaluate(() => new Promise(r => setTimeout(r, 500)));
    await page.screenshot({ path: `screenshots/elevation/after-mission-${vp.name}.png`, fullPage: false });
    
    // Scroll to newsletter
    await page.evaluate(() => {
      Array.from(document.querySelectorAll('section')).find(s => s.textContent.includes('Publications'))?.scrollIntoView();
    });
    await page.evaluate(() => new Promise(r => setTimeout(r, 500)));
    await page.screenshot({ path: `screenshots/elevation/after-newsletter-${vp.name}.png`, fullPage: false });
    
    // Scroll to news
    await page.evaluate(() => {
      document.querySelector('[aria-label="Featured News"]')?.scrollIntoView();
    });
    await page.evaluate(() => new Promise(r => setTimeout(r, 500)));
    await page.screenshot({ path: `screenshots/elevation/after-news-${vp.name}.png`, fullPage: false });
  }
  
  console.log('✅ AFTER screenshots captured');
  await browser.close();
})();
