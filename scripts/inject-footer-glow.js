#!/usr/bin/env node
/*
 * Dev-only one-shot: inject the footer-glow CSS link + JS script tag into
 * every .html file across the project. Idempotent — skips files that already
 * reference them. Computes a relative path from each page back to /scripts/
 * based on its depth.
 *
 * The CSS link goes immediately before </head> so it lands after each page's
 * inline <style> block; the padding rule is specificity-safe either way (see
 * footer-glow.css), but load order keeps it predictable. The script tag goes
 * before </body>, after the other deferred scripts.
 *
 * Usage: node scripts/inject-footer-glow.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const CSS_FILE = 'footer-glow.css';
const JS_FILE = 'footer-glow.js';

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (
        entry.name === 'node_modules' ||
        entry.name === '.git' ||
        entry.name === 'screenshots'
      ) continue;
      walk(p, files);
    } else if (entry.name.endsWith('.html')) {
      files.push(p);
    }
  }
  return files;
}

function relScripts(filePath) {
  const fromDir = path.dirname(filePath);
  const target = path.join(ROOT, 'scripts');
  let rel = path.relative(fromDir, target);
  if (!rel.startsWith('.')) rel = './' + rel;
  return rel.split(path.sep).join('/');
}

const files = walk(ROOT);
let changed = 0;
let skipped = 0;

for (const f of files) {
  const rel = relScripts(f);
  let html = fs.readFileSync(f, 'utf8');

  // Only pages that actually carry the site footer.
  if (!html.includes('class="site-footer"')) {
    skipped++;
    continue;
  }

  const cssTag = `<link rel="stylesheet" href="${rel}/${CSS_FILE}" />`;
  const jsTag = `<script defer src="${rel}/${JS_FILE}"></script>`;
  let didChange = false;

  if (!html.includes(CSS_FILE) && html.includes('</head>')) {
    html = html.replace(
      '</head>',
      `  <!-- Footer gradient glow layer -->\n  ${cssTag}\n</head>`
    );
    didChange = true;
  }

  if (!html.includes(JS_FILE) && html.includes('</body>')) {
    html = html.replace('</body>', `  ${jsTag}\n</body>`);
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

console.log(`\nDone. ${changed} file(s) edited, ${skipped} skipped.`);
