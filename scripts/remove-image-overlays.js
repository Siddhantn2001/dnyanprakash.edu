/*
 * One-shot sweeper — converts every remaining page-hero (headline-over-image)
 * pattern to the standardized clean image + headline-in-content-area pattern.
 *
 * Finds: <section class="page-hero">
 *          <div class="page-hero-media"><img|slot /></div>
 *          <div class="page-hero-overlay" />
 *          <div class="page-hero-content">
 *            <div class="container-main">
 *              <div class="eyebrow">Eyebrow</div>
 *              <h1>Title</h1>
 *              <p class="text-lg opacity-90 ...">Subtitle</p>  (optional)
 *            </div>
 *          </div>
 *        </section>
 *        <div class="breadcrumb">…</div>
 *
 * Replaces with:
 *   <section class="article-hero-media">
 *     <img|slot />
 *   </section>
 *   <div class="breadcrumb">…</div>
 *   <section class="section-pad reveal article-body" style="padding-bottom: …;">
 *     <div class="container-main">
 *       <header class="article-heading">
 *         <div class="eyebrow">Eyebrow</div>
 *         <h1>Title</h1>
 *       </header>
 *       [<p class="lede">Subtitle</p>]
 *     </div>
 *   </section>
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const TARGETS = [
  'about/learning-through-action.html',
  'gallery.html',
  'campus-life/events.html',
  'give.html',
  'contact.html',
  'alumni.html',
];

const CSS_SENTINEL_START = '/* ==== article-template-hero:start ==== */';
const CSS_SENTINEL_END = '/* ==== article-template-hero:end ==== */';
const CSS_BLOCK = `    ${CSS_SENTINEL_START}
    .article-hero-media { background: var(--color-bg-alt); line-height: 0; }
    .article-hero-media img, .article-hero-media .slot-box {
      width: 100%; aspect-ratio: 2.4 / 1; max-height: 560px; object-fit: cover; display: block;
    }
    @media (max-width: 768px) {
      .article-hero-media img, .article-hero-media .slot-box { aspect-ratio: 16 / 10; max-height: none; }
    }
    main > section.section-pad.article-body { padding-top: 48px; padding-bottom: 40px; }
    @media (min-width: 1024px) {
      main > section.section-pad.article-body { padding-top: 56px; padding-bottom: 48px; }
    }
    .article-heading { margin: 0 0 28px; padding-bottom: 18px; border-bottom: 1px solid var(--color-border); }
    .article-heading .eyebrow {
      font-family: var(--font-sans-cond); font-size: 13px; letter-spacing: 0.14em;
      text-transform: uppercase; color: var(--color-text-muted); margin-bottom: 14px;
    }
    .article-heading h1 {
      font-family: var(--font-display); font-style: normal; font-weight: 400;
      font-size: 56px; line-height: 1.08; color: var(--color-text-primary); margin: 0;
      letter-spacing: -0.015em;
    }
    @media (max-width: 768px) {
      .article-heading { margin-bottom: 24px; padding-bottom: 20px; }
      .article-heading h1 { font-size: 36px; }
    }
    ${CSS_SENTINEL_END}`;

const NEW_LEDE_RULE = `    .lede {
      font-size: 18px;
      line-height: 1.6;
      color: var(--color-text-muted);
      margin: 0 0 20px;
      font-family: var(--font-sans);
      font-style: italic;
      font-weight: 400;
    }`;

function escapeRegExp(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
function escapeAttr(s) { return s.replace(/"/g, '&quot;'); }

function process(fileRel) {
  const fp = path.join(ROOT, fileRel);
  let html = fs.readFileSync(fp, 'utf8');

  // 1) Refresh .lede rule
  html = html.replace(/    \.lede\s*\{[^}]*\}/, NEW_LEDE_RULE);

  // 2) Inject / refresh hero-template CSS
  if (html.includes(CSS_SENTINEL_START)) {
    html = html.replace(
      new RegExp(escapeRegExp(CSS_SENTINEL_START) + '[\\s\\S]*?' + escapeRegExp(CSS_SENTINEL_END)),
      CSS_BLOCK.trim()
    );
  } else {
    html = html.replace(/  <\/style>/, `\n${CSS_BLOCK}\n  </style>`);
  }

  // 3) Find the page-hero block and its breadcrumb sibling
  const heroRe = /<section class="page-hero"[^>]*>[\s\S]*?<\/section>\s*(<div class="breadcrumb">[\s\S]*?<\/div>\s*<\/div>)/;
  const m = html.match(heroRe);
  if (!m) throw new Error(`${fileRel}: page-hero + breadcrumb not found together`);

  const heroBlock = m[0];
  const breadcrumbBlock = m[1];

  // Extract hero image (real img or placeholder slot)
  const imgMatch = heroBlock.match(/<img src="([^"]+)" alt="([^"]*)"[^/]*\/?>/);
  const slotMatch = heroBlock.match(/<div data-img-slot="([^"]+)" data-img-description="([^"]*)"[\s\S]*?<div class="slot-num">([^<]+)<\/div>\s*<div class="slot-desc">([^<]*)<\/div>/);

  let heroInner;
  if (imgMatch) {
    heroInner = `      <img src="${imgMatch[1]}" alt="${imgMatch[2]}" />`;
  } else if (slotMatch) {
    heroInner = `      <div data-img-slot="${slotMatch[1]}" data-img-description="${slotMatch[2]}" class="slot-box">
        <div class="text-center">
          <div class="slot-num">${slotMatch[3]}</div>
          <div class="slot-desc">${slotMatch[4]}</div>
        </div>
      </div>`;
  } else {
    throw new Error(`${fileRel}: hero image not found`);
  }

  // Extract aria-label for the hero section
  const ariaMatch = heroBlock.match(/<section class="page-hero"\s+aria-label="([^"]+)"/);
  const aria = ariaMatch ? ariaMatch[1] : '';

  // Extract eyebrow + h1 + optional subtitle from page-hero-content
  const eyebrowMatch = heroBlock.match(/<div class="eyebrow">([\s\S]*?)<\/div>/);
  const h1Match = heroBlock.match(/<h1[^>]*>([\s\S]*?)<\/h1>/);
  const subtitleMatch = heroBlock.match(/<p class="text-lg[^"]*"[^>]*>([\s\S]*?)<\/p>/);

  if (!eyebrowMatch || !h1Match) throw new Error(`${fileRel}: missing eyebrow or h1`);

  const eyebrow = eyebrowMatch[1].trim();
  const title = h1Match[1].trim();
  const subtitle = subtitleMatch ? subtitleMatch[1].trim() : '';

  // Build replacement
  const subtitleLine = subtitle ? `\n        <p class="lede">${subtitle}</p>` : '';
  const replacement = `<section class="article-hero-media" aria-label="${escapeAttr(aria || title.replace(/<[^>]+>/g, ''))}">
${heroInner}
    </section>
    ${breadcrumbBlock}
    <section class="section-pad reveal article-body" style="padding-bottom: 0;">
      <div class="container-main">
        <header class="article-heading">
          <div class="eyebrow">${eyebrow}</div>
          <h1>${title}</h1>
        </header>${subtitleLine}
      </div>
    </section>`;

  html = html.replace(heroRe, replacement);

  fs.writeFileSync(fp, html);
  console.log(`  ✓ ${fileRel}`);
}

console.log(`De-overlaying ${TARGETS.length} pages…`);
for (const f of TARGETS) {
  try { process(f); } catch (e) { console.log(`  ✗ ${f} — ${e.message}`); }
}
console.log('Done.');
