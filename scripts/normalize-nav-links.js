/*
 * Normalizes every href inside <header class="site-header">, <footer class="site-footer">,
 * <aside class="article-aside">, and <div id="mobile-drawer"> so that each link resolves
 * correctly from the current file's location.
 *
 * Algorithm per href:
 *   1. Skip if external (http[s]:, mailto:, tel:, //), anchor-only (#…), or root-absolute (/…).
 *   2. Strip leading ../ or ./ — whatever remains is the author's intended target as viewed
 *      from project root (copy-paste artefact).
 *   3. Classify remainder:
 *        - starts with known top-level dir → canonical root-relative path is the remainder
 *        - equals a known root-level file  → canonical path is the remainder
 *        - bare filename (no "/") → assume sibling of current file
 *   4. Rewrite as path.relative(currentDir, canonical).
 *
 * This fixes both the self-reference bug (href="about/…" on an /about/ page) and the
 * cross-dir bug (href="about/…" on an /academics/ page without the required ../ prefix).
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const IGNORE = new Set(['node_modules', 'screenshots', 'scripts', 'images', '.git', 'WEBsite', '.claude', 'untitled folder', 'partials']);
const TOPLEVEL_DIRS = new Set(['about', 'academics', 'admission', 'campus-life', 'news']);
const ROOT_FILES = new Set(['index.html', 'alumni.html', 'gallery.html', 'contact.html', 'give.html']);

function listAllHtml(dir, acc = []) {
  for (const f of fs.readdirSync(dir)) {
    if (IGNORE.has(f)) continue;
    const fp = path.join(dir, f);
    if (fs.statSync(fp).isDirectory()) listAllHtml(fp, acc);
    else if (f.endsWith('.html')) acc.push(path.relative(ROOT, fp).split(path.sep).join('/'));
  }
  return acc;
}

function canonicalize(href, currentDirPosix) {
  // Return canonical root-relative path (no leading slash) or null if unknown.
  let anchor = '';
  const hashIdx = href.indexOf('#');
  if (hashIdx >= 0) { anchor = href.slice(hashIdx); href = href.slice(0, hashIdx); }

  // Strip leading ./ and ../ sequences
  href = href.replace(/^(\.\.?\/)+/, '');
  if (!href) return { canonical: null, anchor };

  const firstSeg = href.split('/')[0];
  if (TOPLEVEL_DIRS.has(firstSeg)) return { canonical: href, anchor };
  if (ROOT_FILES.has(firstSeg)) return { canonical: href, anchor };
  if (!href.includes('/')) {
    // Bare filename. If file exists as sibling of current, use that; else as root file.
    if (currentDirPosix === '.') return { canonical: href, anchor };
    return { canonical: currentDirPosix + '/' + href, anchor };
  }
  return { canonical: null, anchor };
}

function convertHref(href, currentDirPosix) {
  if (/^(https?:|mailto:|tel:|\/\/|#|\/)/.test(href)) return null;
  const { canonical, anchor } = canonicalize(href, currentDirPosix);
  if (!canonical) return null;
  const rel = path.posix.relative(currentDirPosix, canonical) || canonical;
  return rel + anchor;
}

function rewriteRegion(regionHtml, currentDirPosix, counters) {
  return regionHtml.replace(/href="([^"]+)"/g, (full, href) => {
    const newHref = convertHref(href, currentDirPosix);
    if (newHref === null) { counters.kept++; return full; }
    if (newHref === href) { counters.alreadyOk++; return full; }
    counters.changed++;
    return `href="${newHref}"`;
  });
}

function processFile(fileRel) {
  const fp = path.join(ROOT, fileRel);
  let html = fs.readFileSync(fp, 'utf8');
  const dir = path.posix.dirname(fileRel);
  const counters = { changed: 0, alreadyOk: 0, kept: 0 };

  const regionRes = [
    /<header class="site-header[\s\S]*?<\/header>/,
    /<footer class="site-footer[\s\S]*?<\/footer>/,
    /<aside class="article-aside[\s\S]*?<\/aside>/g,
    /<div id="mobile-drawer"[\s\S]*?<\/aside>\s*<\/div>/,
  ];

  for (const re of regionRes) {
    html = html.replace(re, (m) => rewriteRegion(m, dir, counters));
  }

  fs.writeFileSync(fp, html);
  return counters;
}

const files = listAllHtml(ROOT);
console.log(`Normalizing nav links in ${files.length} HTML files…`);
let totalChanged = 0;
for (const f of files) {
  const r = processFile(f);
  if (r.changed > 0) console.log(`  ${f}: ${r.changed} rewritten, ${r.alreadyOk} already correct`);
  totalChanged += r.changed;
}
console.log(`\n${totalChanged} links normalized.`);
