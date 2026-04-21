/*
 * Rewrites every href in the header nav, footer, article sidebar, and mobile drawer
 * to an absolute path rooted at "/", e.g. /news/article.html.
 *
 * Why a whitelist matters: several nav links were copy-pasted across pages without
 * path adjustment (e.g. <a href="about/mission.html"> on a page inside /news/ would
 * resolve to /news/about/mission.html — broken). A naive mechanical resolver would
 * preserve those broken paths in absolute form. Instead we normalize by known
 * top-level structure so the intended destination wins.
 *
 * Skips external (http:, https:, mailto:, tel:, //), anchor-only (#…), and already-
 * absolute (/…) hrefs.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const IGNORE_DIRS = new Set(['node_modules', 'screenshots', 'scripts', 'images', 'partials', '.git']);
const TOPLEVEL_DIRS = new Set(['about', 'academics', 'admission', 'campus-life', 'news']);
const ROOT_FILES = new Set(['index.html', 'alumni.html', 'gallery.html', 'contact.html', 'give.html']);

function listAllHtml(dir, acc = []) {
  for (const f of fs.readdirSync(dir)) {
    if (IGNORE_DIRS.has(f)) continue;
    const fp = path.join(dir, f);
    if (fs.statSync(fp).isDirectory()) listAllHtml(fp, acc);
    else if (f.endsWith('.html')) acc.push(path.relative(ROOT, fp));
  }
  return acc;
}

function convertHref(href, currentDirPosix) {
  // Skip external, anchor-only, and already-absolute
  if (/^(https?:|mailto:|tel:|\/\/|#|\/)/.test(href)) return null;

  // Separate anchor
  let anchor = '';
  const hashIdx = href.indexOf('#');
  if (hashIdx >= 0) {
    anchor = href.slice(hashIdx);
    href = href.slice(0, hashIdx);
  }

  // Drop leading ./ and ../ segments — we treat remaining path as intended destination
  href = href.replace(/^(\.\.?\/)+/, '');
  if (!href) return null;

  const firstSeg = href.split('/')[0];
  let abs;

  if (TOPLEVEL_DIRS.has(firstSeg)) {
    abs = '/' + href;
  } else if (ROOT_FILES.has(firstSeg)) {
    abs = '/' + href;
  } else if (!href.includes('/')) {
    // bare filename — assume sibling to current file
    abs = (currentDirPosix === '.' ? '' : '/' + currentDirPosix) + '/' + href;
    abs = abs.replace(/\/+/g, '/');
  } else {
    // Unknown first segment — leave alone to avoid guessing
    return null;
  }

  return abs + anchor;
}

function rewriteRegion(regionMatch, currentDirPosix, counters) {
  return regionMatch.replace(/href="([^"]+)"/g, (full, href) => {
    const abs = convertHref(href, currentDirPosix);
    if (abs == null) { counters.skipped++; return full; }
    if (abs === href) { counters.skipped++; return full; }
    counters.changed++;
    return `href="${abs}"`;
  });
}

function processFile(fileRel) {
  const fp = path.join(ROOT, fileRel);
  let html = fs.readFileSync(fp, 'utf8');
  const dirPosix = path.posix.dirname(fileRel.split(path.sep).join('/'));
  const counters = { changed: 0, skipped: 0 };

  const regionRes = [
    /<header class="site-header[\s\S]*?<\/header>/,
    /<footer class="site-footer[\s\S]*?<\/footer>/,
    /<aside class="article-aside[\s\S]*?<\/aside>/g,
    /<div id="mobile-drawer"[\s\S]*?<\/aside>\s*<\/div>/,
  ];

  for (const re of regionRes) {
    html = html.replace(re, (m) => rewriteRegion(m, dirPosix, counters));
  }

  fs.writeFileSync(fp, html);
  console.log(`  ${fileRel}: ${counters.changed} rewritten, ${counters.skipped} kept`);
  return counters;
}

const files = listAllHtml(ROOT);
console.log(`Processing ${files.length} HTML files…`);
let totalChanged = 0, totalSkipped = 0;
for (const f of files) {
  const r = processFile(f);
  totalChanged += r.changed;
  totalSkipped += r.skipped;
}
console.log(`\nDone. ${totalChanged} links rewritten, ${totalSkipped} left unchanged (external / anchor / already absolute).`);
