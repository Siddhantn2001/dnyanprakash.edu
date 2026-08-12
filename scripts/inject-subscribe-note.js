#!/usr/bin/env node
/*
 * Dev-only, idempotent: make the footer subscribe form's disabled-state
 * explanation visible on touch devices.
 *
 * The form is a deliberate stub — input and button both carry `disabled` — and
 * the reason lives only in a `title` attribute:
 *
 *     <form class="footer-subscribe" ... title="Subscription form coming soon">
 *
 * A title tooltip needs hover, and a phone has none (skill §1). So on mobile a
 * visitor met a greyed-out "Subscribe" button with no explanation anywhere —
 * a §16 feedback failure ("confirm meaningful actions… warn before problems").
 *
 * This renders THE STRING THAT IS ALREADY THERE as a visible caption. No new
 * copy is invented: the text is read out of each page's own title attribute, so
 * if the owner rewords the tooltip the caption follows.
 *
 * Usage: node scripts/inject-subscribe-note.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

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

let changed = 0;
let skipped = 0;
let missing = 0;

for (const f of walk(ROOT)) {
  let html = fs.readFileSync(f, 'utf8');

  if (html.includes('footer-subscribe-note')) { skipped++; continue; }

  // Match the whole stub form and capture its title text.
  const re = /(<form class="footer-subscribe"[^>]*title="([^"]+)"[^>]*>[\s\S]*?<\/form>)/;
  const m = html.match(re);
  if (!m) { missing++; continue; }

  const note = `\n            <p class="footer-subscribe-note">${m[2]}</p>`;
  html = html.replace(re, `$1${note}`);
  fs.writeFileSync(f, html);
  changed++;
  console.log('  edited  ' + path.relative(ROOT, f));
}

console.log(`\nDone. ${changed} edited, ${skipped} already had it, ${missing} had no subscribe stub.`);
