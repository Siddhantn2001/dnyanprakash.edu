#!/usr/bin/env node
/*
 * Dev-only, idempotent: add "Parent Login" to the mobile drawer's Login group
 * on every page that has one.
 *
 * Why: the Apple-design pass retires the mobile utility strip (apple-design.css
 * §1.1b), and on inner pages that strip carried a "Parent Login" link. Its URL
 * — http://dnyanprakash.techvium.in/site/userlogin — is the SAME destination as
 * the drawer's existing Student / Faculty / Alumni Login links, so the
 * destination was never at risk. What would have been lost is the specific word
 * a parent scans for (§16: "direct, specific labels beat safe generic ones"),
 * so the label moves into the drawer rather than the link.
 *
 * It goes FIRST in the group: on a K–10 school site, parents are the largest
 * group using that portal.
 *
 * Note for a future pass: four differently-labelled links now resolve to one
 * identical URL. That reads as four portals when there is one, and should be
 * consolidated once we know whether the portal actually branches by role.
 * Flagged in the Phase 7 audit rather than fixed here, because collapsing them
 * changes what the page promises and is the owner's call.
 *
 * Usage: node scripts/inject-parent-login.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PORTAL = 'http://dnyanprakash.techvium.in/site/userlogin';
const LINK = `<a href="${PORTAL}" target="_blank" rel="noopener">Parent Login</a>`;

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

  // Locate the drawer's Login accordion specifically — not the mega-menu, and
  // not any other accordion that happens to contain the word "Login".
  const re = /(<details[^>]*mobile-accordion[^>]*>\s*<summary[^>]*>\s*Login\s*<\/summary>\s*<div class="mobile-sublinks">)/;
  const m = html.match(re);

  if (!m) { missing++; continue; }
  if (/>Parent Login</.test(html.slice(m.index, m.index + 900))) { skipped++; continue; }

  html = html.replace(re, `$1${LINK}`);
  fs.writeFileSync(f, html);
  changed++;
  console.log('  edited  ' + path.relative(ROOT, f));
}

console.log(`\nDone. ${changed} edited, ${skipped} already had it, ${missing} had no drawer Login group.`);
