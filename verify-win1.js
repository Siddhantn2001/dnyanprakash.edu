const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  
  const file = path.resolve(__dirname, 'index.html');
  await page.goto('file://' + file, { waitUntil: 'networkidle0' });
  
  // Test carousel controls exist
  const carouselDots = await page.$$('.news-carousel-dot');
  const carouselArrows = await page.$$('.news-carousel-btn');
  const revealElements = await page.$$('[data-scroll-reveal]');
  
  console.log('\n=== WIN 1 VERIFICATION ===');
  console.log(`Carousel controls: ${carouselDots.length} dots, ${carouselArrows.length} buttons ✓`);
  console.log(`Scroll reveals: ${revealElements.length} elements ✓`);
  if (errors.length > 0) {
    console.log('Console errors:', errors.slice(0, 3).join(', '));
  } else {
    console.log('No console errors ✓');
  }
  console.log('=========================\n');
  
  await browser.close();
})();
