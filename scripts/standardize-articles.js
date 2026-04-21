/*
 * Site-wide content-page standardizer.
 * Applies one canonical template (from news/challenging-times-leaders.html) to every
 * article-type / content page: news, about, academics, admission, campus-life.
 *
 * Layout contract each page produces:
 *   <section class="article-hero-media"><img|slot-box /></section>
 *   <div class="breadcrumb">…</div>
 *   <section class="section-pad reveal article-body">
 *     <header class="article-heading">eyebrow + h1 + bottom divider</header>
 *     <div class="article-layout">
 *       <div class="prose">italic .lede + body paragraphs</div>
 *       <aside class="article-aside">
 *         pull-quote (cite "From the article")
 *         Related pages (5 universal links)
 *         Instagram follow block
 *         Admissions CTA
 *       </aside>
 *     </div>
 *   </section>
 *
 * Idempotent: rerunning detects the sentinel block and replaces it rather than duplicating.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

// Every article/content page that must match the reference template.
// Hub/index/landing/form pages are deliberately NOT in this list.
const TARGETS = [
  // News articles
  'news/142-meritorious-students.html',
  'news/second-place-latur-division.html',
  'news/parents-grade-one-textbook.html',
  'news/mrunal-kulkarni-dialogue.html',
  'news/institute-head-satish-narhare.html',
  // About
  'about/mission.html',
  'about/history.html',
  'about/faculty.html',
  'about/at-a-glance.html',
  'about/about-education.html',
  'about/learning-through-action.html',
  // Academics
  'academics/balbhavan.html',
  'academics/balvikas-kendra.html',
  'academics/vidyaniketan.html',
  'academics/narhare-learning-home.html',
  // Admission
  'admission/why-dnyanprakash.html',
  'admission/faq.html',
  // Campus Life
  'campus-life/arts.html',
  'campus-life/student-life.html',
  // Section landings (treat as articles since they have prose-style copy)
  'about/index.html',
  'academics/index.html',
  'admission/index.html',
  'campus-life/index.html',
];

// Italic, smaller, lighter lede — replaces whatever .lede rule exists.
const NEW_LEDE = `    .lede {
      font-size: 18px;
      line-height: 1.6;
      color: var(--color-text-muted);
      margin: 0 0 20px;
      font-family: var(--font-sans);
      font-style: italic;
      font-weight: 400;
    }`;

const CSS_SENTINEL_START = '/* ==== article-template:start ==== */';
const CSS_SENTINEL_END = '/* ==== article-template:end ==== */';

const CSS_BLOCK = `    ${CSS_SENTINEL_START}
    .article-hero-media {
      background: var(--color-bg-alt);
      line-height: 0;
    }
    .article-hero-media img,
    .article-hero-media .slot-box {
      width: 100%;
      aspect-ratio: 2.4 / 1;
      max-height: 560px;
      object-fit: cover;
      display: block;
    }
    @media (max-width: 768px) {
      .article-hero-media img,
      .article-hero-media .slot-box { aspect-ratio: 16 / 10; max-height: none; }
    }
    main > section.section-pad.article-body { padding-top: 48px; padding-bottom: 80px; }
    @media (min-width: 1024px) {
      main > section.section-pad.article-body { padding-top: 56px; padding-bottom: 96px; }
    }
    .article-heading {
      margin: 0 0 28px;
      padding-bottom: 18px;
      border-bottom: 1px solid var(--color-border);
    }
    .article-heading .eyebrow {
      font-family: var(--font-sans-cond);
      font-size: 13px;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: var(--color-text-muted);
      margin-bottom: 14px;
    }
    .article-heading h1 {
      font-family: var(--font-display);
      font-style: normal;
      font-weight: 400;
      font-size: 56px;
      line-height: 1.08;
      color: var(--color-text-primary);
      margin: 0;
      letter-spacing: -0.015em;
    }
    @media (max-width: 768px) {
      .article-heading { margin-bottom: 24px; padding-bottom: 20px; }
      .article-heading h1 { font-size: 36px; }
    }
    .article-layout { display: grid; grid-template-columns: minmax(0, 1fr); gap: 56px; }
    @media (min-width: 1024px) {
      .article-layout { grid-template-columns: minmax(0, 1fr) 320px; gap: 72px; align-items: start; }
    }
    .article-layout .prose { max-width: none; }
    .article-aside { display: flex; flex-direction: column; gap: 28px; }
    @media (min-width: 1024px) {
      .article-aside { position: sticky; top: 96px; }
    }
    .aside-pullquote {
      border-left: 3px solid var(--color-primary);
      padding: 4px 0 4px 20px;
      margin: 0;
      font-family: var(--font-display);
      font-style: normal;
      font-size: 22px;
      line-height: 1.35;
      color: var(--color-text-primary);
    }
    .aside-pullquote cite {
      display: block;
      margin-top: 12px;
      font-family: var(--font-sans);
      font-style: normal;
      font-size: 12px;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: var(--color-text-muted);
    }
    .aside-card { background: var(--color-bg-alt); padding: 24px; }
    .aside-card-eyebrow {
      font-family: var(--font-sans);
      font-size: 12px;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: var(--color-text-muted);
      margin: 0 0 14px;
    }
    .aside-links { display: flex; flex-direction: column; gap: 10px; font-size: 15px; }
    .aside-links a {
      color: var(--color-text-primary);
      text-decoration: none;
      padding-bottom: 2px;
      border-bottom: 1px solid transparent;
      transition: color .2s, border-color .2s;
    }
    .aside-links a:hover { color: var(--color-primary); border-bottom-color: var(--color-primary); }
    .aside-instagram {
      background: #fff;
      border: 1px solid var(--color-border);
      padding: 20px 22px;
    }
    .aside-instagram-top {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 10px;
    }
    .aside-instagram-top svg {
      width: 22px; height: 22px; color: var(--color-primary);
    }
    .aside-instagram-top span {
      font-family: var(--font-sans);
      font-weight: 600;
      color: var(--color-text-primary);
      font-size: 15px;
    }
    .aside-instagram p {
      font-size: 14px; line-height: 1.5;
      color: var(--color-text-muted);
      margin: 0 0 14px;
    }
    .aside-instagram-btn {
      display: inline-block;
      background: var(--color-primary);
      color: #fff;
      padding: 10px 18px;
      font-family: var(--font-sans);
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      text-decoration: none;
      transition: background .2s;
    }
    .aside-instagram-btn:hover { background: var(--color-primary-dark); color: #fff; text-decoration: none; }
    .aside-cta { background: var(--color-primary); color: #fff; padding: 24px; }
    .aside-cta p {
      font-family: var(--font-display); font-style: normal; font-weight: 400;
      font-size: 19px; line-height: 1.3; color: #fff; margin: 0 0 16px;
    }
    .aside-cta a.aside-cta-btn {
      display: inline-block; background: #fff; color: var(--color-primary);
      padding: 11px 20px; font-family: var(--font-sans); font-size: 12px;
      font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase;
      text-decoration: none; transition: background .2s;
    }
    .aside-cta a.aside-cta-btn:hover { background: var(--color-bg-alt); }
    ${CSS_SENTINEL_END}`;

// Depth-aware relative prefix from a content page back to root.
function relPrefix(fileRel) {
  const depth = fileRel.split('/').length - 1; // how many subdirs deep
  return '../'.repeat(depth);
}

function buildAsideLinks(rel) {
  const p = relPrefix(rel);
  return `                <a href="${p}about/mission.html">Our Mission</a>
                <a href="${p}about/history.html">Our History</a>
                <a href="${p}academics/index.html">Academics Overview</a>
                <a href="${p}campus-life/index.html">Campus Life</a>
                <a href="${p}admission/index.html">Admissions</a>`;
}

const ADMISSIONS_CTA = `            <div class="aside-cta">
              <p>Admissions open for the 2026&ndash;27 academic year.</p>
              <a href="https://www.dnyanprakash.techvium.in/online_admission" target="_blank" rel="noopener" class="aside-cta-btn">Apply Online</a>
            </div>`;

const INSTAGRAM_BLOCK = `            <div class="aside-instagram">
              <div class="aside-instagram-top">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                  <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
                </svg>
                <span>@dnyanprakash_latur</span>
              </div>
              <p>Follow us on Instagram for daily moments from Dnyanprakash.</p>
              <a href="https://www.instagram.com/dnyanprakash_latur" target="_blank" rel="noopener" class="aside-instagram-btn">Follow on Instagram</a>
            </div>`;

function firstMatch(html, re) {
  const m = html.match(re);
  return m ? m[1].trim() : null;
}

function standardize(fileRel) {
  const fp = path.join(ROOT, fileRel);
  let html = fs.readFileSync(fp, 'utf8');

  // ---- 1) Replace .lede style ----
  html = html.replace(/    \.lede\s*\{[^}]*\}/, NEW_LEDE);

  // ---- 2) Inject / refresh standardized CSS block, just before </style> ----
  if (html.includes(CSS_SENTINEL_START)) {
    html = html.replace(
      new RegExp(escapeRegExp(CSS_SENTINEL_START) + '[\\s\\S]*?' + escapeRegExp(CSS_SENTINEL_END)),
      CSS_BLOCK.trim()
    );
  } else {
    html = html.replace(/  <\/style>/, `\n${CSS_BLOCK}\n  </style>`);
  }

  // ---- 2b) Idempotency guard: if the HTML has already been standardized
  //         (article-aside present), don't re-extract/re-build — the prose
  //         regex would incorrectly swallow the existing aside on re-run. ----
  if (html.includes('<aside class="article-aside"')) {
    fs.writeFileSync(fp, html);
    console.log(`  ↻ ${fileRel} (css refreshed; html already standardized)`);
    return;
  }

  // ---- 3) Extract pieces ----
  let heroImageHTML;
  const imgMatch = html.match(
    /<section class="(?:article-banner|article-hero-media)"[^>]*>\s*(?:<div[^>]*>\s*)?<img src="([^"]+)" alt="([^"]*)"[^/]*\/?>/
  );
  const slotMatch = html.match(
    /<section class="(?:page-hero|article-hero-media)"[\s\S]*?<div data-img-slot="([^"]+)" data-img-description="([^"]*)"[\s\S]*?<div class="slot-num">([^<]+)<\/div>\s*<div class="slot-desc">([^<]*)<\/div>/
  );
  if (imgMatch) {
    heroImageHTML = `      <img src="${imgMatch[1]}" alt="${imgMatch[2]}" />`;
  } else if (slotMatch) {
    heroImageHTML = `      <div data-img-slot="${slotMatch[1]}" data-img-description="${slotMatch[2]}" class="slot-box">
        <div class="text-center">
          <div class="slot-num">${slotMatch[3]}</div>
          <div class="slot-desc">${slotMatch[4]}</div>
        </div>
      </div>`;
  } else {
    throw new Error(`${fileRel}: could not find hero image or slot`);
  }

  const eyebrow = firstMatch(
    html,
    /<(?:div|p) class="(?:eyebrow|section-eyebrow)">([\s\S]*?)<\/(?:div|p)>/
  );
  if (!eyebrow) throw new Error(`${fileRel}: no eyebrow found`);

  const title = firstMatch(html, /<h1[^>]*>([\s\S]*?)<\/h1>/);
  if (!title) throw new Error(`${fileRel}: no h1 found`);

  // Optional deck/subtitle (a <p> inside page-hero-content)
  const deck = firstMatch(
    html,
    /<h1[^>]*>[\s\S]*?<\/h1>\s*<p[^>]*class="[^"]*(?:text-lg|article-deck)[^"]*"[^>]*>([\s\S]*?)<\/p>/
  );

  // Prose inner block
  const proseMatch = html.match(/<div class="prose">([\s\S]*?)<\/div>\s*<\/div>\s*<\/section>/);
  if (!proseMatch) throw new Error(`${fileRel}: no prose block`);
  let proseInner = proseMatch[1].trim();

  // Existing breadcrumb (keep it verbatim)
  const breadcrumbMatch = html.match(/<div class="breadcrumb">[\s\S]*?<\/div>\s*<\/div>/);
  if (!breadcrumbMatch) throw new Error(`${fileRel}: no breadcrumb`);
  const breadcrumbHTML = breadcrumbMatch[0];

  // ---- 4) Pull quote — prefer deck, else lede, else first <p> ----
  const ledeMatch = proseInner.match(/<p class="lede">([\s\S]*?)<\/p>/);
  let pullQuoteText;
  if (deck) pullQuoteText = stripTags(deck);
  else if (ledeMatch) pullQuoteText = truncate(stripTags(ledeMatch[1]), 180);
  else {
    const firstP = proseInner.match(/<p[^>]*>([\s\S]*?)<\/p>/);
    pullQuoteText = firstP ? truncate(stripTags(firstP[1]), 180) : '';
  }

  // If deck exists and prose doesn't already start with a .lede, hoist deck as the italic lede
  if (deck && !ledeMatch) {
    proseInner = `<p class="lede">${deck}</p>\n            ${proseInner}`;
  }

  // ---- 5) Build new structure ----
  const newHero = `    <section class="article-hero-media" aria-label="${escapeAttr(stripTags(title))}">
${heroImageHTML}
    </section>`;

  const asideLinks = buildAsideLinks(fileRel);

  const newArticle = `    <section class="section-pad reveal article-body">
      <div class="container-main">
        <header class="article-heading">
          <div class="eyebrow">${eyebrow}</div>
          <h1>${title}</h1>
        </header>
        <div class="article-layout">
          <div class="prose">
            ${proseInner.replace(/\n/g, '\n            ')}
          </div>

          <aside class="article-aside" aria-label="Related information">
            <blockquote class="aside-pullquote">
              &ldquo;${pullQuoteText}&rdquo;
              <cite>From the article</cite>
            </blockquote>
            <div class="aside-card">
              <div class="aside-card-eyebrow">Related pages</div>
              <div class="aside-links">
${asideLinks}
              </div>
            </div>
${INSTAGRAM_BLOCK}
${ADMISSIONS_CTA}
          </aside>
        </div>
      </div>
    </section>`;

  // ---- 6) Locate replacement region: from hero <section> start through end of old article body ----
  const heroStartRe = /<section class="(article-banner|page-hero|article-hero-media)"/;
  const heroStart = html.search(heroStartRe);
  if (heroStart < 0) throw new Error(`${fileRel}: no hero section`);

  const proseEndIdx = html.indexOf(proseMatch[0]) + proseMatch[0].length;
  if (proseEndIdx < 0) throw new Error(`${fileRel}: no prose end`);

  const before = html.slice(0, heroStart);
  const after = html.slice(proseEndIdx);
  html = before + newHero + '\n' + breadcrumbHTML + '\n' + newArticle + after;

  fs.writeFileSync(fp, html);
  console.log(`  ✓ ${fileRel}`);
}

function escapeRegExp(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
function escapeAttr(s) { return s.replace(/"/g, '&quot;'); }
function stripTags(s) { return s.replace(/<[^>]+>/g, '').trim(); }
function truncate(s, n) { return s.length > n ? s.slice(0, n - 1).trim() + '…' : s; }

console.log(`Standardizing ${TARGETS.length} content pages…`);
const failed = [];
for (const f of TARGETS) {
  try { standardize(f); }
  catch (e) { failed.push({ f, err: e.message }); console.log(`  ✗ ${f} — ${e.message}`); }
}
console.log(failed.length ? `\n${failed.length} failed.` : '\nAll pages standardized.');
