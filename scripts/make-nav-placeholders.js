#!/usr/bin/env node
/* ============================================================================
   make-nav-placeholders.js — generate labelled nav mega-panel image slots
                              (DEV ONLY — never run by the owner)

   Why this exists
   ---------------
   Each desktop mega-panel (About, Admission, Academics, Alumni, News, Login)
   has an image area on its left. The real photos don't exist yet, so this
   emits one clearly-labelled placeholder per slot into /images/nav/ — warm
   grey, slot name printed large, so that hovering any nav item immediately
   shows WHICH slot you're looking at.

   Ratio is 4:5 portrait at 720x900 (2x the ~260px display width) to match the
   .mega-media box in each page's nav CSS.

   Replacing a placeholder with a real photo
   -----------------------------------------
   Drop the photo at the same path (e.g. images/nav/nav-academics.jpg) and it
   is picked up with zero code change. Run it through the standard pipeline
   first: auto-orient, strip EXIF, resize, and emit the .webp sibling — the
   markup uses <picture> with a webp source, so both files should exist.

       node scripts/make-nav-placeholders.js

   Re-running overwrites every placeholder, so do NOT run it once real photos
   are in place — it would clobber them.
   ============================================================================ */
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const SLOTS = [
  { slot: 'ABOUT',     file: 'nav-about',     caption: 'Who We Are' },
  { slot: 'ADMISSION', file: 'nav-admission', caption: 'Join Us' },
  { slot: 'ACADEMICS', file: 'nav-academics', caption: 'Learn With Us' },
  { slot: 'ALUMNI',    file: 'nav-alumni',    caption: 'Our Community' },
  { slot: 'NEWS',      file: 'nav-news',      caption: 'Latest' },
  { slot: 'LOGIN',     file: 'nav-login',     caption: 'Access' },
];

const W = 720;
const H = 900; // 4:5 portrait

function card() {
  return `<!doctype html><html><head><meta charset="utf-8">
  <link href="https://fonts.googleapis.com/css2?family=Libre+Franklin:wght@400;500;600&family=Playfair+Display:ital@0;1&display=swap" rel="stylesheet">
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { width:${W}px; height:${H}px; display:flex; align-items:center; justify-content:center;
           background:#d9d4cd; font-family:'Libre Franklin',sans-serif; }
    /* Faint diagonal hatch so a placeholder never reads as a real flat-colour photo.
       Kept coarse (48px period) — a fine hatch is high-frequency detail and
       tripled the JPEG size for no visual gain. */
    body::before { content:''; position:absolute; inset:0;
      background:repeating-linear-gradient(45deg, rgba(255,255,255,.30) 0 6px, transparent 6px 48px); }
    .inner { position:relative; text-align:center; padding:0 48px; }
    .rule { width:56px; height:3px; background:#9E1B32; margin:0 auto 34px; }
    .cap { font-size:22px; font-weight:500; letter-spacing:.16em; text-transform:uppercase;
           color:#9E1B32; margin-bottom:26px; }
    .slot { font-size:74px; font-weight:600; letter-spacing:.04em; color:#3a352f;
            line-height:1.05; margin-bottom:30px; word-break:break-word; }
    .msg { font-family:'Playfair Display',Georgia,serif; font-style:italic; font-size:30px;
           color:#6f675d; margin-bottom:46px; }
    .path { font-family:ui-monospace,Menlo,monospace; font-size:19px; color:#8a8177;
            background:rgba(255,255,255,.55); display:inline-block; padding:10px 16px; border-radius:3px; }
  </style></head><body>
    <div class="inner">
      <div class="rule"></div>
      <div class="cap">Nav image slot</div>
      <div class="slot" id="slot"></div>
      <div class="msg">replace this image</div>
      <div class="path" id="path"></div>
    </div>
  </body></html>`;
}

(async () => {
  const outDir = path.resolve(__dirname, '..', 'images', 'nav');
  fs.mkdirSync(outDir, { recursive: true });

  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: W, height: H, deviceScaleFactor: 1 });

  // Load the shell ONCE and swap text per slot. Calling setContent per slot
  // re-requests the Google Fonts stylesheet and reliably stalls networkidle0.
  await page.setContent(card(), { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);

  for (const s of SLOTS) {
    await page.evaluate((d) => {
      document.getElementById('slot').textContent = d.slot;
      document.getElementById('path').textContent = `images/nav/${d.file}.jpg`;
    }, s);
    for (const [ext, opts] of [['jpg', { type: 'jpeg', quality: 86 }], ['webp', { type: 'webp', quality: 86 }]]) {
      const out = path.join(outDir, `${s.file}.${ext}`);
      await page.screenshot({ path: out, ...opts });
      console.log(`  ${(fs.statSync(out).size / 1024).toFixed(1).padStart(6)} KB  images/nav/${s.file}.${ext}`);
    }
  }

  await browser.close();
  console.log(`\nDone — ${SLOTS.length} slots x 2 formats written to images/nav/ (${W}x${H}, 4:5).`);
})();
