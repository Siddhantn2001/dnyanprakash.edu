#!/usr/bin/env node
/*
 * Dev-only, idempotent: reference scripts/apple-design.css and
 * scripts/apple-design.js from every .html page in the project.
 *
 * Placement matters and is the whole point of this script:
 *
 *   CSS  — injected as the LAST thing before </head>, on every page. That is
 *          the only position from which it reliably beats BOTH each page's
 *          inline <style> block AND scripts/mobile-polish.css. Those two load
 *          in a different order on index.html than on the other 48 pages
 *          (index.html links mobile-polish.css at the top of <head>, the
 *          injector for that pass put it at the bottom everywhere else), so
 *          "last before </head>" is the one slot that is unambiguous.
 *
 *   JS   — injected as the last <script defer> before </body>, so it runs
 *          after mobile-polish.js, lightbox.js, gallery-render.js and
 *          newsletter-carousel.js have defined the DOM it enhances.
 *
 * Usage: node scripts/inject-apple-design.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const CSS_FILE = 'apple-design.css';
const JS_FILE = 'apple-design.js';

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (['node_modules', '.git', 'screenshots', 'WEBsite', 'untitled folder'].includes(entry.name)) continue;
      walk(p, files);
    } else if (entry.name.endsWith('.html')) {
      files.push(p);
    }
  }
  return files;
}

function relScripts(filePath) {
  const fromDir = path.dirname(filePath);
  let rel = path.relative(fromDir, path.join(ROOT, 'scripts'));
  if (!rel.startsWith('.')) rel = './' + rel;
  return rel.split(path.sep).join('/');
}

const files = walk(ROOT);
let changed = 0;
let skipped = 0;

for (const f of files) {
  const rel = relScripts(f);
  let html = fs.readFileSync(f, 'utf8');
  let didChange = false;

  if (!html.includes(CSS_FILE) && html.includes('</head>')) {
    html = html.replace(
      '</head>',
      `  <!-- Apple-design pass — materials, type, response, motion. Loads last so it wins the cascade. -->\n` +
        `  <link rel="stylesheet" href="${rel}/${CSS_FILE}" />\n</head>`
    );
    didChange = true;
  }

  if (!html.includes(JS_FILE) && html.includes('</body>')) {
    html = html.replace(
      '</body>',
      `  <script defer src="${rel}/${JS_FILE}"></script>\n</body>`
    );
    didChange = true;
  }

  if (didChange) {
    fs.writeFileSync(f, html);
    changed++;
    console.log('  edited  ' + path.relative(ROOT, f));
  } else {
    skipped++;
  }
}

console.log(`\nDone. ${changed} file(s) edited, ${skipped} skipped (already referenced).`);
