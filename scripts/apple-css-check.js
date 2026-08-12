#!/usr/bin/env node
/* ============================================================================
   apple-css-check.js — verifies that scripts/apple-design.css actually PARSED
   the rules it claims to contain (DEV ONLY).

   Why this exists
   ---------------
   A stray comment terminator left an entire block of §5.4 sitting outside a
   comment. Braces still balanced, the file still loaded, nothing errored — the
   browser simply discarded the rules that followed and the §8 gesture hint
   silently did nothing. Text-level checks (grep, brace counting) cannot catch
   that; only asking the browser what it actually parsed can.

   This reads document.styleSheets for apple-design.css and asserts that every
   selector below is present in the parsed CSSOM.

   Usage:  node scripts/apple-css-check.js
   Exit 1 if any expected selector is missing.
   ============================================================================ */
const puppeteer = require('puppeteer');
const path = require('path');
const http = require('http');
const fs = require('fs');

const ROOT = path.resolve(__dirname, '..');

// One representative selector per section of apple-design.css. If a section is
// dropped by a parse error, its selector disappears from the CSSOM.
const EXPECTED = [
  // Phase 1 — materials
  ['.site-header.is-scrolled .main-nav', 'P1 glass header'],
  ['.site-header .main-nav::after', 'P1 scroll edge effect'],
  ['.mobile-panel', 'P1 drawer material'],
  ['.lightbox-btn', 'P1 lightbox chrome'],
  ['.dp-lang-in-nav', 'P1b relocated language toggle'],
  // Phase 2 — typography
  ['.section-title-caps', 'P2 caps tracking tier'],
  ['.newsletter-title', 'P2 Devanagari display'],
  [':root:lang(mr) .prose p', 'P2 Devanagari body scale'],
  // Phase 3 — response & touch
  ['.dp-pressed', 'P3 press feedback'],
  ['.coverflow-dot::after', 'P3 dot hit area'],
  // Phase 4 — gestures
  ['.coverflow-track', 'P4 drag transform'],
  ['.coverflow-track.is-dragging .cf-item', 'P4 drag transition suppression'],
  ['.lightbox-stage', 'P4 lightbox drag transform'],
  // Phase 5 — spatial consistency
  ['.lightbox-stage.dp-flip-run', 'P5 FLIP transition'],
  ['.coverflow-track.is-drag-left .cf-item[data-delta="1"]', 'P5/§8 directional hint'],
  ['.coverflow-track.is-drag-right .cf-item[data-delta="-1"]', 'P5/§8 directional hint (mirror)'],
  // Phase 6 — frame quality & a11y
  ['.coverflow-track.is-settling', 'P6 will-change lifecycle'],
  ['html.dp-reduced-transparency .mobile-panel', 'P6 reduced-transparency mirror'],
  ['html.dp-more-contrast .mobile-panel', 'P6 contrast mirror'],
];

const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp',
  '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.pdf': 'application/pdf', '.mp4': 'video/mp4' };

function serve() {
  return new Promise((resolve) => {
    const s = http.createServer((req, res) => {
      let rel = decodeURIComponent(req.url.split('?')[0]);
      if (rel.endsWith('/')) rel += 'index.html';
      const full = path.join(ROOT, path.normalize(rel));
      if (!full.startsWith(ROOT)) { res.writeHead(403); return res.end(); }
      fs.readFile(full, (e, buf) => {
        if (e) { res.writeHead(404); return res.end('nf'); }
        res.writeHead(200, { 'Content-Type': MIME[path.extname(full).toLowerCase()] || 'application/octet-stream', Connection: 'close' });
        res.end(buf);
      });
    });
    s.keepAliveTimeout = 0;
    s.listen(0, '127.0.0.1', () => resolve({ s, port: s.address().port }));
  });
}

(async () => {
  const { s, port } = await serve();
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(`http://127.0.0.1:${port}/index.html`, { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 600));

  const parsed = await page.evaluate(() => {
    const found = [];
    let sheetSeen = false;
    let ruleCount = 0;

    function collect(rules) {
      for (let i = 0; i < rules.length; i++) {
        const r = rules[i];
        if (r.cssRules && r.cssRules.length !== undefined && !r.selectorText) {
          collect(r.cssRules); // @media / @supports
          continue;
        }
        ruleCount++;
        if (r.selectorText) {
          const parts = r.selectorText.split(',');
          for (let j = 0; j < parts.length; j++) found.push(parts[j].trim());
        }
      }
    }

    const sheets = document.styleSheets;
    for (let k = 0; k < sheets.length; k++) {
      const sheet = sheets[k];
      if (!sheet.href || sheet.href.indexOf('apple-design.css') === -1) continue;
      sheetSeen = true;
      let rules = null;
      try { rules = sheet.cssRules; } catch (e) { rules = null; }
      if (rules) collect(rules);
    }
    return { sheetSeen, ruleCount, selectors: found };
  });

  await browser.close();
  s.close();

  if (!parsed.sheetSeen) {
    console.error('✗ apple-design.css is not loaded on index.html at all.');
    process.exit(1);
  }

  console.log(`apple-design.css parsed: ${parsed.ruleCount} rules, ${parsed.selectors.length} distinct selectors\n`);
  const set = new Set(parsed.selectors);
  let missing = 0;
  for (const [sel, label] of EXPECTED) {
    const ok = set.has(sel);
    if (!ok) missing++;
    console.log(`   ${ok ? '✓' : '✗'} ${label.padEnd(38)} ${sel}`);
  }
  console.log('\n' + '─'.repeat(60));
  if (missing) {
    console.log(`FAIL — ${missing} expected selector(s) did not survive parsing.`);
    console.log('A stray "*/" or an unclosed comment silently drops every rule that');
    console.log('follows it while braces still balance. Check the section above the');
    console.log('first missing selector.');
    process.exit(1);
  }
  console.log(`PASS — all ${EXPECTED.length} expected selectors parsed.`);
})();
