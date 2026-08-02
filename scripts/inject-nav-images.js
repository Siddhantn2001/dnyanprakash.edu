#!/usr/bin/env node
/* ============================================================================
   inject-nav-images.js — add the image slot to every desktop mega-panel
                          (DEV ONLY — never run by the owner)

   Why a script and not find/replace
   ---------------------------------
   The nav is copy-pasted into 47 HTML files (§8.14) and is NOT byte-identical
   between them:
     * relative link depth differs (root vs /about/ vs /mr/about/)
     * the six academics/* pages have the four division sublinks ENABLED,
       while every other page renders them in the disabled grey treatment
   A blind find/replace would flatten that second difference. This script
   instead works structurally: it locates each `<div class="mega-panel">` by
   its aria-label, inserts a new first child into that panel's 12-col grid,
   and re-spans the two existing columns. Nothing already in the panel is
   rewritten, so the academics divergence (and any future one) survives.

   What it does per file
   ---------------------
   1. Inserts, as the first child of each panel's `.container-main.grid`:
          <!-- NAV IMAGE SLOT: ABOUT — replace images/nav/nav-about.jpg -->
          <div class="col-span-3 mega-media"> <picture>…</picture> </div>
   2. Re-spans that panel's columns 5 / 7  ->  4 / 5 (image takes 3).
   3. Adds <link rel="stylesheet" href="…/scripts/nav-mega.css"> after the
      existing mobile-polish.css link, reusing that link's own relative
      prefix so depth is always right.

   The mobile drawer (#mobile-drawer) is never touched.

   Idempotent — a file that already contains `mega-media` is skipped, so this
   is safe to re-run after adding a new page.

       node scripts/inject-nav-images.js           # apply
       node scripts/inject-nav-images.js --dry     # report only, write nothing
   ============================================================================ */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DRY = process.argv.includes('--dry');

// aria-label on the panel -> placeholder file stem in images/nav/
const SLOTS = {
  About: 'nav-about',
  Admission: 'nav-admission',
  Academics: 'nav-academics',
  Alumni: 'nav-alumni',
  News: 'nav-news',
  Login: 'nav-login',
};

function htmlFiles() {
  const out = [];
  (function walk(dir) {
    for (const name of fs.readdirSync(dir)) {
      if (name === 'node_modules' || name === '.git') continue;
      const full = path.join(dir, name);
      if (fs.statSync(full).isDirectory()) walk(full);
      else if (name.endsWith('.html')) out.push(full);
    }
  })(ROOT);
  // screenshots/reference/taft-raw.html is a captured copy of Taft, not our page.
  return out.filter((f) => !f.includes(path.join('screenshots', 'reference'))).sort();
}

/* Derive the page's relative prefix to /scripts/ and /images/ from the
   mobile-polish.css link that every nav-bearing page already carries.
   Returns e.g. '', './', '../', '../../'. */
function prefixOf(src) {
  const m = src.match(/href="([^"]*)scripts\/mobile-polish\.css"/);
  return m ? m[1] : null;
}

function imageBlock(label, stem, prefix) {
  const slot = label.toUpperCase();
  return `
              <!-- NAV IMAGE SLOT: ${slot} — replace ${prefix}images/nav/${stem}.jpg -->
              <div class="col-span-3 mega-media">
                <picture>
                  <source srcset="${prefix}images/nav/${stem}.webp" type="image/webp" />
                  <img src="${prefix}images/nav/${stem}.jpg" alt="" loading="lazy" decoding="async" />
                </picture>
              </div>`;
}

function processFile(file) {
  let src = fs.readFileSync(file, 'utf8');
  const rel = path.relative(ROOT, file);

  if (!src.includes('class="mega-panel"')) return { rel, status: 'no-nav' };
  if (src.includes('mega-media')) return { rel, status: 'already' };

  const prefix = prefixOf(src);
  if (prefix === null) return { rel, status: 'ERROR: no mobile-polish.css link to derive path depth from' };

  let panels = 0;
  const missing = [];

  // Walk panels from the END backwards so earlier indices stay valid as we splice.
  const starts = [];
  for (let i = src.indexOf('<div class="mega-panel"'); i !== -1; i = src.indexOf('<div class="mega-panel"', i + 1)) {
    starts.push(i);
  }

  for (const start of starts.reverse()) {
    // Panel region = this panel up to the next panel (or the end of the desktop <ul>).
    const nextPanel = src.indexOf('<div class="mega-panel"', start + 1);
    const endUl = src.indexOf('</ul>', start);
    const end = nextPanel !== -1 && nextPanel < endUl ? nextPanel : endUl;
    let region = src.slice(start, end);

    const labelMatch = region.match(/aria-label="([^"]+)"/);
    const label = labelMatch && labelMatch[1];
    const stem = label && SLOTS[label];
    if (!stem) { missing.push(label || '(no aria-label)'); continue; }

    // Insert as first child of the panel's 12-col grid.
    const gridTag = '<div class="container-main grid grid-cols-12 gap-10">';
    const g = region.indexOf(gridTag);
    if (g === -1) { missing.push(`${label} (grid tag not found)`); continue; }

    // Re-span the two existing columns. Scoped to this panel only, first hit each.
    region = region.replace('<div class="col-span-5">', '<div class="col-span-4">');
    region = region.replace('<div class="col-span-7', '<div class="col-span-5');

    const gg = region.indexOf(gridTag); // recompute: replacements above shift it
    region = region.slice(0, gg + gridTag.length) + imageBlock(label, stem, prefix) + region.slice(gg + gridTag.length);

    src = src.slice(0, start) + region + src.slice(end);
    panels++;
  }

  // Stylesheet link, right after mobile-polish.css so it can override it.
  if (!src.includes('scripts/nav-mega.css')) {
    const linkRe = new RegExp(`([ \\t]*)<link rel="stylesheet" href="${prefix.replace(/[.]/g, '\\.')}scripts/mobile-polish\\.css"\\s*/?>`);
    const m = src.match(linkRe);
    if (!m) return { rel, status: 'ERROR: could not match mobile-polish.css link for stylesheet insert' };
    src = src.replace(linkRe, `${m[0]}\n${m[1]}<link rel="stylesheet" href="${prefix}scripts/nav-mega.css" />`);
  }

  if (!DRY) fs.writeFileSync(file, src);
  return { rel, status: panels === 6 && !missing.length ? 'ok' : `partial (${panels}/6)`, panels, missing, prefix };
}

const results = htmlFiles().map(processFile);
let ok = 0, skipped = 0, bad = 0;

for (const r of results) {
  if (r.status === 'ok') { ok++; console.log(`✓ ${r.rel}  (6 panels, prefix "${r.prefix}")`); }
  else if (r.status === 'no-nav' || r.status === 'already') { skipped++; console.log(`· ${r.rel}  — ${r.status}`); }
  else { bad++; console.log(`✗ ${r.rel}  — ${r.status}${r.missing && r.missing.length ? ' | unmatched: ' + r.missing.join(', ') : ''}`); }
}

console.log('\n' + '─'.repeat(64));
console.log(`${DRY ? 'DRY RUN — nothing written. ' : ''}${ok} updated, ${skipped} skipped, ${bad} failed.`);
process.exit(bad ? 1 : 0);
