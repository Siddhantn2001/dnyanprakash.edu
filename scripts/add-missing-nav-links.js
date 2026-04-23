/*
 * Adds 3 orphaned pages into both the desktop mega-menu and the mobile drawer
 * across every HTML file:
 *
 *   About       → insert "Principal's Note" after "About Education"
 *   News col 1  → insert "Challenging Times" after "Latest News"
 *   News col 2  → insert "Institute Head, Mr. Narhare" before "Media Gallery"
 *
 * The desktop sublinks live on their own indented lines; the mobile drawer is a
 * single-line <details>...<a>...<a>... block. Both get handled.
 *
 * Leaves give.html alone — promoting it needs a new top-level nav item, which
 * is a design change the owner should sign off on separately.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

const DESKTOP_EDITS = [
  {
    find: `                  <a href="about/about-education.html" class="mega-sublink">About Education</a>\n                  <a href="about/history.html" class="mega-sublink">Our History</a>`,
    repl: `                  <a href="about/about-education.html" class="mega-sublink">About Education</a>\n                  <a href="about/principals-note.html" class="mega-sublink">Principal's Note</a>\n                  <a href="about/history.html" class="mega-sublink">Our History</a>`,
  },
  {
    find: `                  <a href="news/index.html" class="mega-sublink">Latest News</a>\n                  <a href="news/second-place-latur-division.html" class="mega-sublink">Second Place, Latur</a>`,
    repl: `                  <a href="news/index.html" class="mega-sublink">Latest News</a>\n                  <a href="news/challenging-times-leaders.html" class="mega-sublink">Challenging Times</a>\n                  <a href="news/second-place-latur-division.html" class="mega-sublink">Second Place, Latur</a>`,
  },
  {
    find: `                  <a href="news/mrunal-kulkarni-dialogue.html" class="mega-sublink">Mrunal Kulkarni Dialogue</a>\n                  <a href="gallery.html" class="mega-sublink">Media Gallery</a>`,
    repl: `                  <a href="news/mrunal-kulkarni-dialogue.html" class="mega-sublink">Mrunal Kulkarni Dialogue</a>\n                  <a href="news/institute-head-satish-narhare.html" class="mega-sublink">Institute Head, Mr. Narhare</a>\n                  <a href="gallery.html" class="mega-sublink">Media Gallery</a>`,
  },
];

// Mobile drawer — single-line accordion blocks
const MOBILE_EDITS = [
  {
    find: `<a href="about/about-education.html">About Education</a><a href="about/history.html">Our History</a>`,
    repl: `<a href="about/about-education.html">About Education</a><a href="about/principals-note.html">Principal's Note</a><a href="about/history.html">Our History</a>`,
  },
  {
    find: `<a href="news/index.html">Latest News</a><a href="campus-life/events.html">Events</a><a href="gallery.html">Media Gallery</a>`,
    repl: `<a href="news/index.html">Latest News</a><a href="news/challenging-times-leaders.html">Challenging Times</a><a href="news/institute-head-satish-narhare.html">Institute Head, Mr. Narhare</a><a href="campus-life/events.html">Events</a><a href="gallery.html">Media Gallery</a>`,
  },
];

function listAllHtml(dir, acc = []) {
  for (const f of fs.readdirSync(dir)) {
    if (['node_modules', 'screenshots', 'scripts', 'images', '.git', 'WEBsite', '.claude', 'untitled folder'].includes(f)) continue;
    const fp = path.join(dir, f);
    if (fs.statSync(fp).isDirectory()) listAllHtml(fp, acc);
    else if (f.endsWith('.html')) acc.push(path.relative(ROOT, fp));
  }
  return acc;
}

// Each sub-directory file needs its hrefs adjusted to be correct relative to that dir.
// The source patterns above are written from root perspective; we need per-file variants.
function adjustForDir(find, fileDir) {
  // fileDir is like '.', 'about', 'news', etc.
  if (fileDir === '.') return find;
  // Replace each top-level dir prefix href with the proper relative path.
  // For files inside `about/`, an href like "about/X" was already fixed earlier to just "X",
  // and hrefs to other dirs like "news/X" stay but need a ../ prefix when file is in a subdir.
  // Strategy: compute relative path of each linked file from the fileDir.
  return find.replace(/href="([^"]+)"/g, (full, href) => {
    if (/^(https?:|#|\/)/.test(href)) return full;
    // Resolve target relative to project root
    let target;
    if (href.startsWith('../')) {
      target = href.replace(/^(\.\.\/)+/, '');
    } else if (href.split('/')[0] && ['about', 'academics', 'admission', 'campus-life', 'news'].includes(href.split('/')[0])) {
      target = href; // root-relative form
    } else if (/\.html$/.test(href) && !href.includes('/')) {
      // bare filename — depends on whether file is root or subdir
      if (fileDir === '.') target = href;
      else if (['index.html','alumni.html','gallery.html','contact.html','give.html'].includes(href)) {
        target = href; // root file
      } else {
        target = fileDir + '/' + href;
      }
    } else {
      target = href;
    }
    // Now make target relative to fileDir
    const rel = path.posix.relative(fileDir, target);
    return `href="${rel}"`;
  });
}

let totalChanged = 0;
for (const fileRel of listAllHtml(ROOT)) {
  const fp = path.join(ROOT, fileRel);
  let html = fs.readFileSync(fp, 'utf8');
  const fileDir = path.posix.dirname(fileRel.split(path.sep).join('/'));
  let fileChanged = 0;

  // Sentinel strings — if already present in the file, that particular edit is a no-op.
  const SENTINELS = [
    'principals-note.html" class="mega-sublink">Principal's Note',
    'challenging-times-leaders.html" class="mega-sublink">Challenging Times',
    'institute-head-satish-narhare.html" class="mega-sublink">Institute Head',
  ];

  for (let i = 0; i < DESKTOP_EDITS.length; i++) {
    if (html.includes(SENTINELS[i])) continue; // already added
    const { find, repl } = DESKTOP_EDITS[i];
    const adjFind = adjustForDir(find, fileDir);
    const adjRepl = adjustForDir(repl, fileDir);
    if (html.includes(adjFind)) { html = html.replace(adjFind, adjRepl); fileChanged++; }
  }

  const MOBILE_SENTINELS = [
    'principals-note.html">Principal's Note',
    'challenging-times-leaders.html">Challenging Times',
  ];
  for (let i = 0; i < MOBILE_EDITS.length; i++) {
    if (html.includes(MOBILE_SENTINELS[i])) continue;
    const { find, repl } = MOBILE_EDITS[i];
    const adjFind = adjustForDir(find, fileDir);
    const adjRepl = adjustForDir(repl, fileDir);
    if (html.includes(adjFind)) { html = html.replace(adjFind, adjRepl); fileChanged++; }
  }

  if (fileChanged > 0) {
    fs.writeFileSync(fp, html);
    console.log(`  ✓ ${fileRel}  (+${fileChanged} nav blocks)`);
    totalChanged++;
  } else {
    console.log(`  · ${fileRel}  (no matches — may have non-standard nav)`);
  }
}
console.log(`\n${totalChanged}/31 files updated.`);
