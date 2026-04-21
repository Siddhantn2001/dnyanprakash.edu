#!/usr/bin/env node
/*
  scripts/scaffold-pages.js — ONE-TIME page scaffolder (NOT a build system).

  Run once to generate all inner pages. After generation, edit the resulting
  .html files directly. No build step is required for deploy — the HTML
  artefacts are fully self-contained and can be uploaded as-is.

  To regenerate or tweak a page, edit the page's entry in PAGES below and
  re-run. Files that already exist WILL be overwritten by this script, so
  save any hand-edits you want to keep before re-running.

  Usage:    node scripts/scaffold-pages.js
*/

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const home = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

/* --------------------------------------------------------------
   Extract shared chunks from the homepage by marker strings.
   -------------------------------------------------------------- */
function between(src, a, b) {
  const i = src.indexOf(a);
  if (i < 0) throw new Error('marker missing: ' + a);
  const j = src.indexOf(b, i + a.length);
  if (j < 0) throw new Error('marker missing: ' + b);
  return src.slice(i, j);
}

// <head>…</head>
const headBlock = between(home, '<head>', '</head>') + '</head>';

// <header class="site-header">…</header>
const headerBlock = between(home, '<header class="site-header">', '</header>') + '</header>';

// Mobile drawer
const drawerBlock = between(home, '<div id="mobile-drawer"', '</div>\n\n  <script>');
// Note: drawerBlock above ends just before '</div>\n\n  <script>' — add the missing </div>
const drawerFull = drawerBlock + '</div>';

// <footer class="site-footer">…</footer>
const footerBlock = between(home, '<footer class="site-footer"', '</footer>') + '</footer>';
const footerFull = '<footer class="site-footer"' + footerBlock.slice(footerBlock.indexOf(' '));
// simpler: re-extract
const footerStart = home.indexOf('<footer class="site-footer"');
const footerEnd = home.indexOf('</footer>', footerStart) + '</footer>'.length;
const siteFooter = home.slice(footerStart, footerEnd);

// <script>…</script> (last one, the scroll-reveal + drawer JS)
const scriptStart = home.lastIndexOf('<script>');
const scriptEnd = home.indexOf('</script>', scriptStart) + '</script>'.length;
const bodyScript = home.slice(scriptStart, scriptEnd);

/* --------------------------------------------------------------
   Template rendering
   -------------------------------------------------------------- */
// Root-level pages whose bare-name hrefs on the homepage need the prefix when
// copied into a subdirectory page (e.g. href="alumni.html" → href="../alumni.html").
const ROOT_PAGES = ['index.html', 'alumni.html', 'give.html', 'contact.html', 'gallery.html'];

function rewritePaths(html, prefix) {
  // Replace {{P}} placeholder with the given prefix
  html = html.replace(/\{\{P\}\}/g, prefix);
  if (prefix) {
    // Asset paths
    html = html.replace(/(href|src)="images\//g, `$1="${prefix}images/`);
    // Root-level page links: bare filename → prefixed
    for (const page of ROOT_PAGES) {
      const esc = page.replace(/\./g, '\\.');
      // only rewrite when the href is EXACTLY the bare name (not already prefixed),
      // allow optional #hash — don't touch other subdir pages
      const re = new RegExp(`href="${esc}(#[^"]*)?"`, 'g');
      html = html.replace(re, (m, hash) => `href="${prefix}${page}${hash || ''}"`);
    }
  }
  return html;
}

function rewriteHead(block, prefix) {
  if (!prefix) return block;
  return block
    .replace(/href="images\//g, `href="${prefix}images/`)
    .replace(/src="images\//g, `src="${prefix}images/`);
}

function renderPage({ prefix, title, metaDesc, pageHero, body }) {
  const head = rewriteHead(headBlock, prefix).replace(
    /<title>[^<]*<\/title>/,
    `<title>${title}</title>`
  ).replace(
    /<meta name="description"[^>]*\/>/,
    `<meta name="description" content="${metaDesc.replace(/"/g, '&quot;')}" />`
  );

  // Inner pages get .nav-solid
  let header = headerBlock.replace(
    '<header class="site-header">',
    '<header class="site-header nav-solid">'
  );
  header = rewritePaths(header, prefix);

  // Mobile drawer + footer
  const drawer = rewritePaths(drawerFull, prefix);
  const footer = rewritePaths(siteFooter, prefix);

  return `<!DOCTYPE html>
<html lang="en">
${head}
<body>
  <!-- NAV/FOOTER — if changing, update in all pages (see CLAUDE.md §8.14 override) -->
  ${header}

  <main>
${pageHero}
${body}
  </main>

  ${footer}

  ${drawer}

  ${bodyScript}
</body>
</html>
`;
}

/* --------------------------------------------------------------
   Page hero block (for inner pages)
   -------------------------------------------------------------- */
function pageHero({ eyebrow, title, subtitle, slot, slotDesc, breadcrumb }) {
  return `    <section class="page-hero" aria-label="${title}">
      <div class="page-hero-media">
        <div data-img-slot="${slot}" data-img-description="${slotDesc}" class="slot-box">
          <div class="text-center"><div class="slot-num">${slot}</div><div class="slot-desc">${slotDesc.slice(0, 36)}</div></div>
        </div>
      </div>
      <div class="page-hero-overlay" aria-hidden="true"></div>
      <div class="page-hero-content">
        <div class="container-main">
          <div class="eyebrow">${eyebrow}</div>
          <h1>${title}</h1>
          ${subtitle ? `<p class="text-lg opacity-90 max-w-2xl mt-2">${subtitle}</p>` : ''}
        </div>
      </div>
    </section>
    <div class="breadcrumb"><div class="container-main">${breadcrumb}</div></div>`;
}

/* --------------------------------------------------------------
   Content helpers
   -------------------------------------------------------------- */
function proseSection(html, maxWidth = true) {
  return `    <section class="section-pad reveal">
      <div class="container-main">
        <div class="prose${maxWidth ? '' : ' max-w-none'}">
          ${html}
        </div>
      </div>
    </section>`;
}

function altSection(html) {
  return `    <section class="section-pad reveal" style="background: var(--color-bg-alt);">
      <div class="container-main">
        ${html}
      </div>
    </section>`;
}

function slot(n, desc, klass = '') {
  return `<div data-img-slot="${n}" data-img-description="${desc}" class="slot-box ${klass}"><div class="text-center"><div class="slot-num">${n}</div><div class="slot-desc">${desc.slice(0, 40)}</div></div></div>`;
}

const bc = (...crumbs) => crumbs
  .map((c, i) => i === crumbs.length - 1 ? `<span>${c.label}</span>` : `<a href="${c.href}">${c.label}</a>`)
  .join('<span class="sep">›</span>');

/* --------------------------------------------------------------
   PAGE DEFINITIONS
   -------------------------------------------------------------- */
const PAGES = [];

// ============ ABOUT =============
PAGES.push({
  file: 'about/index.html',
  prefix: '../',
  title: 'About Us — Dnyanprakash',
  metaDesc: 'Dnyanprakash is a Marathi-medium school in Latur founded in 1999, operating across four divisions and serving 1,400 students.',
  hero: {
    eyebrow: 'About Us',
    title: 'About Us',
    subtitle: 'A school known, above all else, for the teachers who dare to experiment.',
    slot: '18', slotDesc: 'About page hero — wide campus shot or founders',
    breadcrumb: bc({ href: '../index.html', label: 'Home' }, { label: 'About' })
  },
  body: proseSection(`
          <!-- owner-supplied verbatim About copy — locked 2026-04-21 -->
          <p class="lede">Mr Satish Narhare, the founder and head of Dnyanprakash, brings over 27 years of experience in education through Narhare Classes. From the very beginning, his conviction has been simple and unwavering: learning should be joyful. He believed that a teacher's true role is not to instruct from a distance, but to create the right environment, one where children feel encouraged, curious, and free to learn on their own terms.</p>

          <p>It was also felt deeply that an experimental, creative teacher can achieve extraordinary things, but only when the institution gives them genuine independence, and parents offer them genuine trust. This combination, rare as it is, was what Dnyanprakash set out to build.</p>

          <p>There was another concern that drove this work. In Latur, education had long been dominated by the pressure-driven model of 10th and 12th grade preparation. Primary education was being neglected. A single teacher managing 70 to 80 students could not, in good conscience, be called teaching. Something had to change.</p>

          <p>In 1999, Dnyanprakash Foundation took the first step, starting Dnyanprakash Bal-Bhavan for children aged 3 to 6, with a clear intention to experiment thoughtfully in early childhood education. Marathi-medium classes from 1st to 4th followed, with deliberately limited class sizes and without any government subsidy. The parents who found us in those early years placed their faith in something they could feel but not yet fully explain, a school driven by teacher creativity, not convention. That faith has only grown since.</p>

          <p>We have always believed that a child who learns in their mother tongue learns more than language. To think independently, to wander freely in the world of ideas, to express what they feel, to solve problems as they arise, to connect with others and with themselves, all of this comes most naturally through the tongue closest to the heart. This belief took us to experimental teachers and schools across the country, and from those visits, an all-inclusive way of working at Dnyanprakash was shaped.</p>

          <p>Today, Dnyanprakash holds a distinct and earned place in Latur's educational world. Operating across four divisions — Balbhavan, Balvikas Kendra, Vidyaniketan, and Narhare Learning Home — it has grown into a living community of teachers who are passionate about their work, children who respond to it with energy and joy, and parents and well-wishers who believe deeply in what this school stands for. Every year, over 500 families place their child's name on the waiting list, despite the city's growing pull toward English medium schools. Once admissions are complete, parents accept the outcome with understanding, trusting entirely in the transparency of the process. The 1,400 students of Dnyanprakash, their families, and the dedicated faculty and staff who serve them have become more than participants in a school; they are an inseparable part of the Dnyanprakash story. It is a school known, above all else, for the teachers who dare to experiment.</p>

          <p><a href="mission.html" class="news-read">Read our mission <i data-lucide="arrow-right" class="w-4 h-4"></i></a></p>
        `)
});

PAGES.push({
  file: 'about/about-education.html',
  prefix: '../',
  title: 'About Education — Dnyanprakash',
  metaDesc: 'Why the mother tongue matters: a note from Dnyanprakash on choosing the medium of education for your child.',
  hero: {
    eyebrow: 'About',
    title: 'About Education',
    subtitle: 'Why the mother tongue matters when choosing a medium of instruction.',
    slot: '46', slotDesc: 'About Education hero — children learning in classroom or with family',
    breadcrumb: bc({ href: '../index.html', label: 'Home' }, { href: 'index.html', label: 'About' }, { label: 'About Education' })
  },
  body: proseSection(`
          <!-- owner-supplied verbatim About Education copy — locked 2026-04-21 -->
          <p>When it comes to choosing the medium of education for their children, today's parents face a very complex dilemma. There is an abundant rise in various schools catering to this demand, leaving these parents in a state of indecision. However, parents often lack the time to consider how beneficial or suitable this medium will be for their child. In such situations, influenced by the blind belief of keeping up with the neighborhood, they might choose the same medium without considering if it is right for their child.</p>

          <p>Have we truly thought about our child in this decision-making process? Will they like it? Will they manage? Will it suit them? Who will answer these countless questions? Why should we be ashamed to teach our children about the soil we were born, nurtured, and raised in? Removing a child from their mother tongue, which they have been hearing, understanding, and learning since before birth, is akin to separating them from their mother.</p>

          <p>Learning becomes much easier if the language that empowers a child to learn joyfully from experiences is prevalent at home and school. It is essential to agree that children should enrich their experiences by learning in their mother tongue while also mastering English. Ignoring the numerous benefits of learning in the mother tongue is not advisable. The language that allows my child to grasp new concepts effortlessly, to express their thoughts and emotions, to flourish in personality, to nurture innate talents, to develop comprehension, and pursue various hobbies should be chosen confidently by parents.</p>
        `)
});

PAGES.push({
  file: 'about/at-a-glance.html',
  prefix: '../',
  title: 'Dnyanprakash, At a Glance',
  metaDesc: 'Key numbers, recognition, awards and admissions facts about Dnyanprakash Educational Project, Latur.',
  hero: {
    eyebrow: 'About',
    title: 'Dnyanprakash, At a Glance',
    subtitle: 'Founded in 1999 by Savita &amp; Satish Narhare.',
    slot: '19', slotDesc: 'At-a-glance page hero',
    breadcrumb: bc({ href: '../index.html', label: 'Home' }, { href: 'index.html', label: 'About' }, { label: 'At a Glance' })
  },
  body: `
    <!-- owner-supplied verbatim At a Glance copy — locked 2026-04-21 -->

    <!-- Founding story -->
    <section class="section-pad reveal">
      <div class="container-main">
        <div style="max-width: 760px;">
          <div class="section-eyebrow">Founded in 1999</div>
          <h2 class="section-title">Savita &amp; Satish Narhare</h2>
          <p class="lede">Dnyanprakash began with 26 children, including the founders' own, on a single conviction: that learning through the mother tongue and lived experience is not a compromise — it is an advantage.</p>
        </div>
      </div>
    </section>

    <!-- By the numbers -->
    <section class="section-pad reveal" style="background: var(--color-bg-alt);">
      <div class="container-main">
        <div style="max-width:760px; margin-bottom: 40px;">
          <div class="section-eyebrow">By the Numbers</div>
          <h2 class="section-title" style="margin-bottom: 0;">The school in figures</h2>
        </div>
        <div class="glance-grid" style="display:grid; grid-template-columns: repeat(4, 1fr); gap: 48px 24px;">
          <div>
            <div style="font-family: var(--font-display); font-style: normal; font-size: 72px; line-height: 1; color: var(--color-primary);">K–10</div>
            <div style="font-family: var(--font-sans-cond); text-transform: uppercase; letter-spacing: 0.06em; font-size: 13px; margin-top: 10px; color: var(--color-text-primary);">Grades Served</div>
            <div style="font-size: 15px; color: var(--color-text-muted); margin-top: 6px;">Kindergarten through Grade 10</div>
          </div>
          <div>
            <div style="font-family: var(--font-display); font-style: normal; font-size: 72px; line-height: 1; color: var(--color-primary);">1,400+</div>
            <div style="font-family: var(--font-sans-cond); text-transform: uppercase; letter-spacing: 0.06em; font-size: 13px; margin-top: 10px; color: var(--color-text-primary);">Students</div>
            <div style="font-size: 15px; color: var(--color-text-muted); margin-top: 6px;">Across all four divisions</div>
          </div>
          <div>
            <div style="font-family: var(--font-display); font-style: normal; font-size: 72px; line-height: 1; color: var(--color-primary);">110+</div>
            <div style="font-family: var(--font-sans-cond); text-transform: uppercase; letter-spacing: 0.06em; font-size: 13px; margin-top: 10px; color: var(--color-text-primary);">Educators</div>
            <div style="font-size: 15px; color: var(--color-text-muted); margin-top: 6px;">Trained in experience-based pedagogy and deeply involved in each child's development</div>
          </div>
          <div>
            <div style="font-family: var(--font-display); font-style: normal; font-size: 72px; line-height: 1; color: var(--color-primary);">1:20</div>
            <div style="font-family: var(--font-sans-cond); text-transform: uppercase; letter-spacing: 0.06em; font-size: 13px; margin-top: 10px; color: var(--color-text-primary);">Classroom Model</div>
            <div style="font-size: 15px; color: var(--color-text-muted); margin-top: 6px;">Deliberately capped, so every child is known, not just enrolled</div>
          </div>
        </div>
      </div>
      <style>
        @media (max-width: 900px) { .glance-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 40px 24px !important; } }
        @media (max-width: 480px) { .glance-grid { grid-template-columns: 1fr !important; } }
      </style>
    </section>

    <!-- Location + Divisions -->
    <section class="section-pad reveal">
      <div class="container-main">
        <div class="two-col-info" style="display:grid; grid-template-columns: 1fr 1fr; gap: 64px;">
          <div>
            <div class="section-eyebrow">Location</div>
            <h3 class="news-headline" style="color: var(--color-text-primary); font-size: 28px;">Latur city, near Dayanand College</h3>
          </div>
          <div>
            <div class="section-eyebrow">Divisions</div>
            <h3 class="news-headline" style="color: var(--color-text-primary); font-size: 28px;">Balbhavan · Balvikas Kendra · Vidyaniketan · Narhare Learning Home</h3>
          </div>
        </div>
      </div>
      <style>
        @media (max-width: 900px) { .two-col-info { grid-template-columns: 1fr !important; gap: 40px !important; } }
      </style>
    </section>

    <!-- Teaching philosophy -->
    <section class="section-pad reveal" style="background: var(--color-bg-alt);">
      <div class="container-main">
        <div style="max-width: 760px;">
          <div class="section-eyebrow">Teaching Philosophy</div>
          <h2 class="section-title">Discovery-driven, research-oriented classrooms</h2>
          <p class="mission-body">Individual attention is not a feature here; it is the foundation. Every classroom is built around the premise that a child learns best when they are given the space to ask, to wonder, and to answer for themselves — with a teacher close enough to guide, far enough to let them discover.</p>
        </div>
      </div>
    </section>

    <!-- Culture (music) -->
    <section class="section-pad reveal">
      <div class="container-main">
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 56px; align-items: center;" class="two-col-info">
          <div>
            <div class="section-eyebrow">Culture</div>
            <h2 class="section-title">Music is the soul of Dnyanprakash</h2>
            <p class="mission-body">Prayer assemblies across all four divisions are entirely music-based. Students graduate knowing nearly 100–150 songs, prayers, folk compositions, patriotic hymns, and classical pieces.</p>
          </div>
          <div style="text-align:center;">
            <div style="font-family: var(--font-display); font-style: normal; font-size: 128px; line-height: 1; color: var(--color-primary);">100–150</div>
            <div style="font-family: var(--font-sans-cond); text-transform: uppercase; letter-spacing: 0.06em; font-size: 13px; margin-top: 14px;">Songs, prayers &amp; pieces each student carries out of school</div>
          </div>
        </div>
      </div>
    </section>

    <!-- Academic results -->
    <section class="section-pad reveal" style="background: var(--color-bg-alt);">
      <div class="container-main">
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 56px; align-items: center;" class="two-col-info">
          <div style="text-align:center;">
            <div style="font-family: var(--font-display); font-style: normal; font-size: 144px; line-height: 1; color: var(--color-primary);">100%</div>
            <div style="font-family: var(--font-sans-cond); text-transform: uppercase; letter-spacing: 0.06em; font-size: 13px; margin-top: 14px;">Grade 10 board results, every year</div>
          </div>
          <div>
            <div class="section-eyebrow">Academic Results</div>
            <h2 class="section-title">Consistent, year after year</h2>
            <p class="mission-body">Consistent selections in Navodaya Vidyalaya, Homi Bhabha, Satara Sainik School, and national scholarship examinations.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Recognition cards -->
    <section class="section-pad reveal">
      <div class="container-main">
        <div class="two-col-info" style="display:grid; grid-template-columns: 1fr 1fr; gap: 32px;">
          <div style="border: 1px solid var(--color-border); padding: 40px;">
            <div class="section-eyebrow">Environmental Recognition</div>
            <h3 style="font-family: var(--font-display); font-style: normal; font-size: 24px; line-height: 1.25; margin: 0 0 16px; color: var(--color-text-primary);">No. 1 in Latur &middot; No. 3 in Maharashtra</h3>
            <p style="font-size:16px; line-height:1.6; color: var(--color-text-primary);">For environmental awareness and sustainability, awarded by the Social Forestry Department, Government of Maharashtra, under the National Green Corps and Merry Life Initiative.</p>
          </div>
          <div style="border: 1px solid var(--color-border); padding: 40px;">
            <div class="section-eyebrow">Pedagogical Recognition</div>
            <h3 style="font-family: var(--font-display); font-style: normal; font-size: 24px; line-height: 1.25; margin: 0 0 16px; color: var(--color-text-primary);">Centre of Pedagogical Innovation</h3>
            <p style="font-size:16px; line-height:1.6; color: var(--color-text-primary);">Identified as a centre of innovation for science, curiosity, and nature-linked learning.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Awards 2023-24 -->
    <section class="section-pad reveal" style="background: var(--color-bg-alt);">
      <div class="container-main">
        <div style="max-width:760px;">
          <div class="section-eyebrow">Awards · 2023–24</div>
          <h2 class="section-title">Recognised for the work, not the ranking</h2>
        </div>
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-top: 24px;" class="two-col-info">
          <div>
            <h3 style="font-family: var(--font-display); font-style: normal; font-size: 26px; line-height: 1.25; margin: 0 0 10px; color: var(--color-text-primary);">Best School in the District &middot; Second Best in the Region</h3>
            <p style="font-size:16px; line-height:1.6; color: var(--color-text-primary);">Majhi Shala Sundar Shala Campaign, 2023–24</p>
          </div>
          <div>
            <h3 style="font-family: var(--font-display); font-style: normal; font-size: 26px; line-height: 1.25; margin: 0 0 10px; color: var(--color-text-primary);">Padma Bhushan Tarabai Modak Award</h3>
            <p style="font-size:16px; line-height:1.6; color: var(--color-text-primary);">For outstanding excellence in child education.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Admissions waitlist -->
    <section class="section-pad reveal">
      <div class="container-main">
        <div style="max-width: 760px;">
          <div class="section-eyebrow">Admissions</div>
          <h2 class="section-title">One of Maharashtra's longest Marathi-medium waitlists</h2>
          <p class="mission-body">Every year, 300–400 families apply beyond available seats — a measure of trust that no ranking can replicate.</p>
          <a href="../admission/index.html" class="btn btn-outline">How to Apply</a>
        </div>
      </div>
    </section>
    `
});

PAGES.push({
  file: 'about/mission.html',
  prefix: '../',
  title: 'Our Mission — Dnyanprakash',
  metaDesc: 'The mission, vision and values of Dnyanprakash Educational Project.',
  hero: {
    eyebrow: 'About',
    title: 'Mission, Vision &amp; Values',
    subtitle: 'The ideas that guide every decision we make.',
    slot: '20', slotDesc: 'Mission page hero',
    breadcrumb: bc({ href: '../index.html', label: 'Home' }, { href: 'index.html', label: 'About' }, { label: 'Mission' })
  },
  body: proseSection(`
          <h2>Our Mission</h2>
          <p class="lede">Learning should be joyful. A teacher's true role is not to instruct from a distance, but to create the right environment — one where children feel encouraged, curious, and free to learn on their own terms.</p>
          <p>We have always believed that a child who learns in their mother tongue learns more than language. To think independently, to wander freely in the world of ideas, to express what they feel, to solve problems as they arise, to connect with others and with themselves — all of this comes most naturally through the tongue closest to the heart.</p>

          <h2>Our Vision</h2>
          <p>That every child who leaves Dnyanprakash carries forward a lifelong love of learning, a strong ethical foundation, and the confidence to contribute to their community and country.</p>

          <h2>Our Values</h2>
          <ul>
            <li><strong>Teacher creativity</strong> — an experimental, creative teacher can achieve extraordinary things when given genuine independence.</li>
            <li><strong>Parent trust</strong> — institutions and families working in partnership, not opposition.</li>
            <li><strong>Mother-tongue learning</strong> — Marathi-medium as the foundation, not a limitation.</li>
            <li><strong>Transparency</strong> — especially in admissions, so every family trusts the process even when the outcome is not what they hoped for.</li>
            <li><strong>Joy</strong> — non-negotiable, across every classroom and every grade.</li>
          </ul>
        `)
});

PAGES.push({
  file: 'about/history.html',
  prefix: '../',
  title: 'Our History — 1999 to Today',
  metaDesc: 'The Dnyanprakash story from 1989 Narhare Classes through 1999 founding to the present day.',
  hero: {
    eyebrow: 'About',
    title: 'Our History',
    subtitle: 'From a single classroom in 1989 to three divisions in 2026.',
    slot: '21', slotDesc: 'History page hero — archive or founders photo',
    breadcrumb: bc({ href: '../index.html', label: 'Home' }, { href: 'index.html', label: 'About' }, { label: 'History' })
  },
  body: proseSection(`
          <p class="lede">What began as Narhare Classes in 1989 grew into Dnyanprakash in 1999 and today serves roughly 1,400 students across four divisions.</p>

          <h2>Milestones</h2>
          <!-- DUMMY - replace later (owner to supply verified dates) -->
          <h3>1989 — Narhare Classes begins</h3>
          <p>Mr. Satish Narhare begins teaching mathematics to secondary students in Latur, and begins to see how learning through the mother tongue changes children's relationship with the subject.</p>

          <h3>1999 — Dnyanprakash is founded</h3>
          <p>Savita and Satish Narhare found Dnyanprakash Foundation and start Dnyanprakash Bal-Bhavan for children aged 3 to 6.</p>

          <h3>2003 — Balvikas Kendra opens</h3>
          <p>Marathi-medium primary classes from 1st to 4th are added, with deliberately limited class sizes and no government subsidy — relying on teacher creativity and parent trust.</p>

          <h3>2008 — Vidyaniketan opens</h3>
          <p>Secondary education begins, bringing the school up to Grade 10 and preparing its first SSC cohort.</p>

          <h3>2019 — Twenty-year celebrations</h3>
          <p>Dnyanprakash marks twenty years with a week of public events, alumni return visits, and a school-wide festival of learning.</p>

          <h3>2025 — Second place in Latur Division</h3>
          <p>Students from Vidyaniketan secure second place in the Latur Division — one of many competitive achievements across the year.</p>

          <h3>2026 — Narhare Learning Home + today</h3>
          <p>The fourth division, Narhare Learning Home, carries our teaching approach beyond the school day. Roughly 1,400 students across four divisions, 500+ families on the waiting list each year, and a 20:1 student-to-teacher ratio.</p>
        `)
});

PAGES.push({
  file: 'about/faculty.html',
  prefix: '../',
  title: 'Faculty — Dnyanprakash',
  metaDesc: 'Our teachers are the heart of Dnyanprakash. Meet the faculty across our three divisions.',
  hero: {
    eyebrow: 'About',
    title: 'Our Faculty',
    subtitle: 'Teachers who have grown up with the school.',
    slot: '22', slotDesc: 'Faculty group portrait',
    breadcrumb: bc({ href: '../index.html', label: 'Home' }, { href: 'index.html', label: 'About' }, { label: 'Faculty' })
  },
  body: proseSection(`
          <p class="lede">Our teachers are the heart of Dnyanprakash. Many have been with the school for a decade or longer.</p>
          <!-- DUMMY - replace later -->
          <p>Across all three divisions, 73% of our faculty hold advanced degrees. Retention is high: several senior teachers have taught the children of students they first welcomed in the early 2000s. We recruit carefully, invest in continuous professional development, and hold ourselves to the same discipline we ask of our students.</p>

          <h2>Featured teachers</h2>
          <h3>Ms. Deshpande — Marathi Literature, Vidyaniketan</h3>
          <!-- DUMMY - replace later -->
          <p>Ms. Deshpande has taught Marathi literature across the secondary grades since 2007. She leads the school's annual poetry recitation programme.</p>

          <h3>Mr. Kulkarni — Social Studies, Vidyaniketan</h3>
          <!-- DUMMY - replace later -->
          <p>Mr. Kulkarni coaches the school's debate team in addition to teaching social studies, and organises the annual civic engagement project for Grade 9.</p>
        `)
});

// ============ ADMISSION =============
PAGES.push({
  file: 'admission/index.html',
  prefix: '../',
  title: 'Admission — Apply to Dnyanprakash',
  metaDesc: 'How to apply to Dnyanprakash Educational Project, Latur. Admissions are open for 2026–27.',
  hero: {
    eyebrow: 'Admission',
    title: 'Apply to Dnyanprakash',
    subtitle: 'Admissions are open for the 2026–27 academic year.',
    slot: '23', slotDesc: 'Admissions page hero — students or campus gate',
    breadcrumb: bc({ href: '../index.html', label: 'Home' }, { label: 'Admission' })
  },
  body: proseSection(`
          <p class="lede">We welcome families from Latur and beyond. Admissions to Balbhavan, Balvikas Kendra and Vidyaniketan are open for the 2026–27 academic year.</p>

          <h2>How to apply</h2>
          <!-- DUMMY - replace later -->
          <ol style="margin:0 0 18px; padding-left:22px;">
            <li style="margin-bottom:8px;">Submit the online application form through our admission portal.</li>
            <li style="margin-bottom:8px;">Arrange a campus visit — we recommend coming during school hours so families can see the classrooms in action.</li>
            <li style="margin-bottom:8px;">Complete the age-appropriate interaction (an informal conversation for Balbhavan; a short written and spoken assessment for Balvikas Kendra and Vidyaniketan).</li>
            <li>Receive the admission offer and complete fee payment to confirm the seat.</li>
          </ol>

          <p><a href="https://www.dnyanprakash.techvium.in/online_admission" target="_blank" rel="noopener" class="btn btn-primary">Apply Online</a></p>

          <h2>What you'll need</h2>
          <!-- DUMMY - replace later -->
          <ul>
            <li>Birth certificate (copy)</li>
            <li>Two recent passport-size photographs</li>
            <li>Previous school leaving certificate (for Grade 1 and above)</li>
            <li>Marksheet of the last completed academic year (for Grades 2 and above)</li>
            <li>Residential proof of the parent / guardian</li>
          </ul>

          <p>Questions? <a href="../contact.html">Contact our admissions team</a> or call 02382 220598.</p>
        `)
});

PAGES.push({
  file: 'admission/why-dnyanprakash.html',
  prefix: '../',
  title: 'Why Dnyanprakash',
  metaDesc: 'Why families choose Dnyanprakash for their children.',
  hero: {
    eyebrow: 'Admission',
    title: 'Why Dnyanprakash',
    subtitle: 'Six reasons families choose us for their children.',
    slot: '24', slotDesc: 'Why Dnyanprakash hero',
    breadcrumb: bc({ href: '../index.html', label: 'Home' }, { href: 'index.html', label: 'Admission' }, { label: 'Why Dnyanprakash' })
  },
  body: proseSection(`
          <p class="lede">Families choose Dnyanprakash because it is unapologetically a Marathi-medium school that takes both mother-tongue learning and academic rigour seriously.</p>
          <!-- DUMMY - replace later -->
          <h3>1. Mother-tongue learning, done properly</h3>
          <p>Research consistently shows that children learn foundational concepts fastest in their mother tongue. We teach Marathi first, and we teach it well.</p>
          <h3>2. Twenty-six years of continuity</h3>
          <p>Teaching philosophies change quickly at many schools. Ours has been stable for a generation, which means parents know exactly what they are signing up for.</p>
          <h3>3. A 20:1 student-to-teacher ratio</h3>
          <p>Small enough that every child is known, large enough that every classroom has a vibrant social life.</p>
          <h3>4. Faculty who stay</h3>
          <p>73% of our faculty hold advanced degrees and many have been with the school for more than a decade.</p>
          <h3>5. Joy is non-negotiable</h3>
          <p>Stress-free learning is a commitment, not an aspiration. Our calendar, assessment design and classroom practice all support it.</p>
          <h3>6. Three divisions, one story</h3>
          <p>A single institution from age 3 through Grade 10. No disruptive transitions, no mismatched philosophies between primary and secondary.</p>
        `)
});

PAGES.push({
  file: 'admission/faq.html',
  prefix: '../',
  title: 'Admission FAQs',
  metaDesc: 'Frequently asked questions from parents considering Dnyanprakash.',
  hero: {
    eyebrow: 'Admission',
    title: 'Admission FAQs',
    subtitle: 'Answers to the questions parents most often ask us.',
    slot: '25', slotDesc: 'FAQ page hero',
    breadcrumb: bc({ href: '../index.html', label: 'Home' }, { href: 'index.html', label: 'Admission' }, { label: 'FAQs' })
  },
  body: proseSection(`
          <!-- DUMMY - replace later -->
          <h3>Is Dnyanprakash a Marathi-medium school?</h3>
          <p>Yes. Instruction across all three divisions is in Marathi. English is taught as a language from the primary grades.</p>

          <h3>Up to which grade does Dnyanprakash go?</h3>
          <p>We serve children from age 3 through Grade 10 (SSC).</p>

          <h3>When does the academic year start?</h3>
          <p>The academic year begins in June. We encourage families to submit applications by the end of March of the preceding year.</p>

          <h3>Can I visit the campus before applying?</h3>
          <p>Yes — and we recommend it. Call us on 02382 220598 to arrange a time.</p>

          <h3>What is the fee structure?</h3>
          <p>Our fees are published during the admission process and are shared with families who submit the online application. Please contact our admissions office for the current fee structure.</p>

          <h3>Does the school provide transport?</h3>
          <p>Limited transport is available on select routes in Latur. Contact the admissions office for current route coverage.</p>

          <h3>How is discipline handled?</h3>
          <p>We use a positive-reinforcement approach grounded in clear expectations. Serious concerns are always addressed together with the family.</p>

          <h3>Do you offer scholarships?</h3>
          <!-- DUMMY - replace later -->
          <p>A limited number of need-based scholarships are reviewed each year. Families in need should indicate this on the application form.</p>

          <h3>What is a typical class size?</h3>
          <p>Our student-to-teacher ratio is 20:1. Classes are kept small enough to allow individual attention.</p>

          <h3>What about children transferring mid-year?</h3>
          <p>Transfers are considered case-by-case depending on available seats in the relevant grade. Please contact the admissions office directly.</p>
        `)
});

// ============ ACADEMICS =============
PAGES.push({
  file: 'academics/index.html',
  prefix: '../',
  title: 'Academics — Dnyanprakash',
  metaDesc: 'The three divisions of Dnyanprakash and how they work together.',
  hero: {
    eyebrow: 'Academics',
    title: 'Explore Our Academics',
    subtitle: 'Three divisions, one continuous journey from age 3 to Grade 10.',
    slot: '26', slotDesc: 'Academics overview hero',
    breadcrumb: bc({ href: '../index.html', label: 'Home' }, { label: 'Academics' })
  },
  body: proseSection(`
          <p class="lede">Dnyanprakash is organised into four divisions that share a single philosophy and move children gently from early play-based learning into the rigour of board preparation — and then beyond the school day.</p>

          <h2>Balbhavan (Age 3–6)</h2>
          <p>Foundational play-based learning rooted in curiosity and joy. <a href="balbhavan.html">Learn more →</a></p>

          <h2>Balvikas Kendra (Grades 1–4)</h2>
          <p>Primary education with a strong language, math, and values base. <a href="balvikas-kendra.html">Learn more →</a></p>

          <h2>Vidyaniketan (Grades 5–10)</h2>
          <p>Rigorous SSC-aligned education with career and character guidance. <a href="vidyaniketan.html">Learn more →</a></p>

          <h2>Narhare Learning Home</h2>
          <p>An extension of the Dnyanprakash classroom — supplementary programmes that carry our teaching approach beyond the school day. <a href="narhare-learning-home.html">Learn more →</a></p>

          <h2>Beyond the core subjects</h2>
          <p>Arts, music, theatre, sports and service are treated as daily practice rather than electives. Read more on <a href="../campus-life/arts.html">Arts &amp; Culture</a> and <a href="../campus-life/student-life.html">Student Life</a>.</p>
        `)
});

function academicsPage(file, slotNum, title, subtitle, divisionTitle, intro, dailyHtml, curriculumHtml) {
  return {
    file,
    prefix: '../',
    title: `${title} — Dnyanprakash`,
    metaDesc: subtitle,
    hero: {
      eyebrow: 'Academics',
      title,
      subtitle,
      slot: String(slotNum), slotDesc: `${title} hero image`,
      breadcrumb: bc({ href: '../index.html', label: 'Home' }, { href: 'index.html', label: 'Academics' }, { label: divisionTitle })
    },
    body: proseSection(`
          <p class="lede">${intro}</p>

          <h2>A day at ${divisionTitle}</h2>
          <!-- DUMMY - replace later -->
          ${dailyHtml}

          <h2>Curriculum highlights</h2>
          <!-- DUMMY - replace later -->
          ${curriculumHtml}

          <p><a href="../admission/index.html" class="btn btn-primary">Apply to ${divisionTitle}</a></p>
        `)
  };
}

PAGES.push(academicsPage(
  'academics/balbhavan.html', 27,
  'Balbhavan (Age 3–6)',
  'Foundational play-based learning rooted in curiosity and joy.',
  'Balbhavan',
  'Balbhavan is our pre-primary division for children aged 3 to 6. The day is built around play, story, song and supervised free movement.',
  `<ul>
            <li>Morning circle: song, greetings, calendar</li>
            <li>Free-choice play stations rotating through the week</li>
            <li>Story hour in Marathi</li>
            <li>Outdoor play and sensory activities</li>
            <li>Quiet rest period after lunch</li>
            <li>Art, clay, or movement block</li>
          </ul>`,
  `<ul>
            <li>Early Marathi literacy through song and story</li>
            <li>Pre-math: sorting, counting, patterns</li>
            <li>Fine-motor skills: threading, cutting, drawing</li>
            <li>Social skills in small mixed-age groups</li>
            <li>Introduction to English through songs and simple vocabulary</li>
          </ul>`
));

PAGES.push(academicsPage(
  'academics/balvikas-kendra.html', 28,
  'Balvikas Kendra (Grades 1–4)',
  'Primary education with a strong language, math, and values base.',
  'Balvikas Kendra',
  'Balvikas Kendra is our primary division, Grades 1 through 4. It is where children consolidate reading and writing in Marathi, build confidence with numbers, and begin to encounter subject specialists.',
  `<ul>
            <li>Morning assembly and reading circle</li>
            <li>Two subject blocks (Marathi, Math, English or EVS)</li>
            <li>Short break with outdoor play</li>
            <li>Creative block: art, music or nature</li>
            <li>Lunch and quiet reading</li>
            <li>Afternoon activity: sports, craft, or club</li>
          </ul>`,
  `<ul>
            <li>Marathi reading fluency and composition</li>
            <li>Mental math and written math through Grade 4</li>
            <li>English as a second language — reading, speaking, and simple writing</li>
            <li>Environmental Studies (EVS) grounded in observation</li>
            <li>Values-based daily reflection</li>
            <li>Weekly music, art and physical education</li>
          </ul>`
));

PAGES.push({
  file: 'academics/narhare-learning-home.html',
  prefix: '../',
  title: 'Narhare Learning Home — Dnyanprakash',
  metaDesc: 'Narhare Learning Home — an extension of the Dnyanprakash classroom that carries our teaching approach beyond the school day.',
  hero: {
    eyebrow: 'Academics',
    title: 'Narhare Learning Home',
    subtitle: 'The Dnyanprakash classroom, beyond the school day.',
    slot: '45', slotDesc: 'Narhare Learning Home hero',
    breadcrumb: bc({ href: '../index.html', label: 'Home' }, { href: 'index.html', label: 'Academics' }, { label: 'Narhare Learning Home' })
  },
  body: proseSection(`
          <p class="lede">Narhare Learning Home is the fourth of our divisions — an extension of the Dnyanprakash classroom for children and families who want more.</p>
          <!-- DUMMY - replace later (owner to supply programme details) -->
          <p>Narhare Learning Home carries the Dnyanprakash approach — Marathi-medium instruction, small group sizes, teacher independence — into after-school and supplementary programmes. It is an answer to families who have found their children thriving in our classrooms and want the same rigour and joy available beyond the school day.</p>

          <h2>What to expect</h2>
          <ul>
            <li>Subject reinforcement rooted in the same pedagogy used during the regular school day</li>
            <li>Small groups, with the teacher given real independence over how the time is used</li>
            <li>Enrichment in language, reading and mathematics</li>
            <li>A place for curiosity, questions, and the work that doesn't always fit into a timetable</li>
          </ul>

          <h2>Who it is for</h2>
          <p>Students from our own three core divisions, and — where space allows — children from the broader Latur community whose families share our commitment to Marathi-medium, teacher-led learning.</p>

          <p><a href="../contact.html" class="btn btn-primary">Enquire</a></p>
        `)
});

PAGES.push(academicsPage(
  'academics/vidyaniketan.html', 29,
  'Vidyaniketan (Grades 5–10)',
  'Rigorous SSC-aligned education with career and character guidance.',
  'Vidyaniketan',
  'Vidyaniketan is our secondary division, Grades 5 through 10. Students follow the Maharashtra State SSC curriculum in Marathi medium, with dedicated preparation for the Grade 10 board examination.',
  `<ul>
            <li>Morning assembly: news, music, or a reflection</li>
            <li>Four to six subject periods</li>
            <li>Break with student-led clubs at lunch</li>
            <li>Afternoon games or cultural block</li>
            <li>Study hall / doubt-clearing before dismissal</li>
          </ul>`,
  `<ul>
            <li>Marathi, Hindi and English languages</li>
            <li>Mathematics — Algebra and Geometry streams</li>
            <li>General Science (5–8), then Physics, Chemistry, Biology (9–10)</li>
            <li>History, Geography, Civics and Economics</li>
            <li>Art, craft and physical education</li>
            <li>Dedicated SSC board preparation in Grades 9 and 10</li>
            <li>Career guidance from Grade 9 onwards</li>
          </ul>`
));

// ============ CAMPUS LIFE =============
PAGES.push({
  file: 'campus-life/index.html',
  prefix: '../',
  title: 'Campus Life — Dnyanprakash',
  metaDesc: 'Life at Dnyanprakash extends beyond the classroom through clubs, events, and student-led initiatives.',
  hero: {
    eyebrow: 'Campus Life',
    title: 'Life at Dnyanprakash',
    subtitle: 'Learning that extends beyond the classroom.',
    slot: '30', slotDesc: 'Campus life overview hero',
    breadcrumb: bc({ href: '../index.html', label: 'Home' }, { label: 'Campus Life' })
  },
  body: proseSection(`
          <p class="lede">Learning at Dnyanprakash extends beyond the classroom — through clubs, events, and student-led initiatives that shape character alongside knowledge.</p>

          <h2>Explore</h2>
          <ul>
            <li><a href="student-life.html">Student Life</a> — daily routines, clubs and activities.</li>
            <li><a href="arts.html">Arts &amp; Culture</a> — music, visual arts and theatre as daily practice.</li>
            <li><a href="events.html">Events</a> — what's coming up on the school calendar.</li>
          </ul>

          <p><a href="../gallery.html">Browse the photo gallery →</a></p>
        `)
});

PAGES.push({
  file: 'campus-life/student-life.html',
  prefix: '../',
  title: 'Student Life — Dnyanprakash',
  metaDesc: 'Clubs, activities, and the daily rhythms of life at Dnyanprakash.',
  hero: {
    eyebrow: 'Campus Life',
    title: 'Student Life',
    subtitle: 'Clubs, activities, and the daily rhythms of school life.',
    slot: '31', slotDesc: 'Student life hero',
    breadcrumb: bc({ href: '../index.html', label: 'Home' }, { href: 'index.html', label: 'Campus Life' }, { label: 'Student Life' })
  },
  body: proseSection(`
          <p class="lede">The best school days are full ones: a morning of focused classroom work, an afternoon of sport or club, and an evening walk home with something new to tell.</p>

          <!-- DUMMY - replace later -->
          <h2>Clubs and activities</h2>
          <ul>
            <li>Debate and public-speaking club</li>
            <li>Science and robotics club</li>
            <li>Literature and poetry recitation circle</li>
            <li>Environment and sustainability club</li>
            <li>Chess and mind-games club</li>
            <li>Sports squads — kabaddi, volleyball, athletics</li>
          </ul>

          <h2>Service and community</h2>
          <p>Each year group takes on a service commitment — some work with local anganwadis, others organise environmental drives or support community reading programmes.</p>

          <h2>A typical day</h2>
          <p>Morning assembly sets the tone. Academic blocks fill the bulk of the day, interrupted by break, lunch and activity periods. Afternoons end with a club, a sport, or study hall.</p>
        `)
});

PAGES.push({
  file: 'campus-life/arts.html',
  prefix: '../',
  title: 'Arts &amp; Culture — Dnyanprakash',
  metaDesc: 'Music, visual arts and theatre as daily practice at Dnyanprakash.',
  hero: {
    eyebrow: 'Campus Life',
    title: 'Arts &amp; Culture',
    subtitle: 'Music, visual arts and theatre are daily practice, not electives.',
    slot: '32', slotDesc: 'Arts and culture hero',
    breadcrumb: bc({ href: '../index.html', label: 'Home' }, { href: 'index.html', label: 'Campus Life' }, { label: 'Arts &amp; Culture' })
  },
  body: proseSection(`
          <p class="lede">Children who make things — a song, a painting, a play — become adults who can see, hear, and imagine more fully.</p>

          <!-- DUMMY - replace later -->
          <h2>Music</h2>
          <p>Every child learns Indian classical vocal basics through Balbhavan and Balvikas Kendra. From Grade 5, students may specialise in vocal, tabla, harmonium or keyboard.</p>

          <h2>Visual arts</h2>
          <p>Drawing, painting and clay are built into the weekly timetable across all divisions. The annual art show is a school-wide event.</p>

          <h2>Theatre</h2>
          <p>Productions — sometimes in Marathi, sometimes adapted from literature the students are reading — are rehearsed for weeks and staged for families once or twice a year.</p>

          <h2>Dance &amp; recitation</h2>
          <p>Kathak and folk-dance groups train in the afternoons. Marathi poetry recitation is a cornerstone of our language programme.</p>
        `)
});

PAGES.push({
  file: 'campus-life/events.html',
  prefix: '../',
  title: 'Events — Dnyanprakash',
  metaDesc: 'The Dnyanprakash events calendar.',
  hero: {
    eyebrow: 'Campus Life',
    title: 'Upcoming Events',
    subtitle: 'What’s coming up on the school calendar.',
    slot: '33', slotDesc: 'Events hero',
    breadcrumb: bc({ href: '../index.html', label: 'Home' }, { href: 'index.html', label: 'Campus Life' }, { label: 'Events' })
  },
  body: `
    <section class="section-pad reveal">
      <div class="container-main">
        <div class="events-list">
          <!-- DUMMY - replace later -->
          <div class="event-row"><div class="event-date">04·22</div><div><div class="event-title">Annual Science Exhibition</div><div class="event-time">9:00 AM – 1:00 PM</div></div><a href="#" class="event-link">More Info</a></div>
          <div class="event-row"><div class="event-date">04·23</div><div><div class="event-title">Std. X Parent-Teacher Meeting</div><div class="event-time">4:00 PM – 6:00 PM</div></div><a href="#" class="event-link">More Info</a></div>
          <div class="event-row"><div class="event-date">04·24</div><div><div class="event-title">Inter-House Drawing Competition</div><div class="event-time">All day</div></div><a href="#" class="event-link">More Info</a></div>
          <div class="event-row"><div class="event-date">04·25</div><div><div class="event-title">Balbhavan Nature Walk</div><div class="event-time">10:00 AM – 12:00 PM</div></div><a href="#" class="event-link">More Info</a></div>
          <div class="event-row"><div class="event-date">04·26</div><div><div class="event-title">Book Fair Closes</div><div class="event-time">All day</div></div><a href="#" class="event-link">More Info</a></div>
          <div class="event-row"><div class="event-date">04·27</div><div><div class="event-title">Marathi Essay Writing Workshop</div><div class="event-time">2:00 PM – 4:00 PM</div></div><a href="#" class="event-link">More Info</a></div>
          <div class="event-row"><div class="event-date">04·28</div><div><div class="event-title">Sports Day Practice Session</div><div class="event-time">3:30 PM – 5:00 PM</div></div><a href="#" class="event-link">More Info</a></div>
          <div class="event-row"><div class="event-date">04·30</div><div><div class="event-title">Admissions Open House 2026–27</div><div class="event-time">11:00 AM – 2:00 PM</div></div><a href="../admission/index.html" class="event-link">More Info</a></div>
        </div>
      </div>
    </section>`
});

// ============ NEWS =============
const newsStories = [
  { slug: 'second-place-latur-division', slot: 2, title: 'Dnyanprakash Secures Second Place in Latur Division', date: 'June 5, 2025', summary: 'Vidyaniketan students secure the runner-up position in a division-wide academic competition.' },
  { slug: '142-meritorious-students', slot: 3, title: 'Felicitation of 142 Meritorious Students in Various Competitive Exams', date: 'June 3, 2025', summary: 'The school honours 142 students for their results in scholarship and competitive examinations.' },
  { slug: 'parents-grade-one-textbook', slot: 4, title: 'Parents Grasp the Concepts of the New First Grade Textbook', date: 'June 18, 2025', summary: 'A parent orientation session on the revised Grade 1 textbook and how families can support reading at home.' },
  { slug: 'institute-head-satish-narhare', slot: 34, title: 'A Conversation with Institute Head Mr. Satish Narhare', date: 'May 12, 2025', summary: 'Mr. Narhare on the founding vision, Marathi-medium learning, and the role of discipline and sensitivity.' },
  { slug: 'mrunal-kulkarni-dialogue', slot: 35, title: 'Mrunal Kulkarni in Dialogue with Dnyanprakash Students', date: 'April 28, 2025', summary: 'Actor and director Mrunal Kulkarni speaks with students about storytelling, Marathi culture, and courage.' },
  { slug: 'challenging-times-leaders', slot: 36, title: 'Challenging Times Produce Leaders', date: 'April 2, 2025', summary: 'A reflection on how Dnyanprakash shaped character through the difficult years of 2020–2022.' }
];

// News index page
PAGES.push({
  file: 'news/index.html',
  prefix: '../',
  title: 'News &amp; Updates — Dnyanprakash',
  metaDesc: 'Latest stories from Dnyanprakash Educational Project.',
  hero: {
    eyebrow: 'News',
    title: 'News &amp; Updates',
    subtitle: 'The latest from our students, faculty and community.',
    slot: '37', slotDesc: 'News index hero',
    breadcrumb: bc({ href: '../index.html', label: 'Home' }, { label: 'News' })
  },
  body: `
    <section class="section-pad reveal">
      <div class="container-main">
        <div class="news-grid">
          ${newsStories.map((n) => `
          <article class="news-card">
            <div class="news-img-wrap">${slot(n.slot, `News — ${n.title}`, 'w-full h-full')}</div>
            <div class="news-cat">News · ${n.date}</div>
            <h3 class="news-headline"><a href="${n.slug}.html">${n.title}</a></h3>
            <p style="font-size:15px; line-height:1.5; margin:0 0 14px;">${n.summary}</p>
            <a href="${n.slug}.html" class="news-read">Read Story <i data-lucide="arrow-right" class="w-4 h-4"></i></a>
          </article>`).join('\n')}
        </div>
      </div>
    </section>`
});

// Individual news article pages
const articleBodies = {
  'second-place-latur-division': `
    <p class="lede">Students of Vidyaniketan have secured second place in the Latur Division — one of several division-level distinctions earned this year.</p>
    <!-- DUMMY - replace later (verbatim Techvium text not yet available) -->
    <p>The cohort, preparing simultaneously for the SSC board examinations, represented Dnyanprakash in the division-wide competition and returned with the runner-up trophy. Parents and faculty gathered on campus for a felicitation ceremony that recognised both the students who competed and the teachers who prepared them.</p>
    <p>This achievement sits alongside a season of steady results across the school — from Balbhavan's annual showcase to Vidyaniketan's scholarship round-up — and reflects the school's continuing commitment to rigorous, Marathi-medium secondary education.</p>
  `,
  '142-meritorious-students': `
    <p class="lede">The school honoured 142 students for their performance in scholarship and competitive examinations.</p>
    <!-- DUMMY - replace later (verbatim Techvium text not yet available) -->
    <p>The felicitation ceremony, held in the school hall, brought together students, families and faculty for an afternoon of recognition. Awards covered a broad range of competitions — Marathi and English essay contests, mathematical olympiads, quiz competitions, and scholarship rounds conducted by state and private bodies.</p>
    <p>Mr. Satish Narhare, addressing the gathering, noted that competitive performance is one sign of a school's health — but that character and sensitivity matter more. "The students who stood up here today," he said, "should know that their teachers are just as proud of the classmates they helped along the way."</p>
  `,
  'parents-grade-one-textbook': `
    <p class="lede">Balvikas Kendra hosted a parent orientation on the revised Grade 1 textbook, walking families through the new sequence and demonstrating how to support reading practice at home.</p>
    <!-- DUMMY - replace later (verbatim Techvium text not yet available) -->
    <p>The revised textbook, introduced in the 2025–26 academic year, reorders the introduction of core letters and pairs each unit with a sample dialogue and a song. The session unpacked the pedagogy behind the change and gave parents hands-on practice with the exercises their children would be doing at school.</p>
    <p>Teachers shared short video clips of classroom work so that families could align home reading to the approach used in school. Parents left with a take-home sheet of weekly practice prompts and a short guide to reading aloud.</p>
  `,
  'institute-head-satish-narhare': `
    <p class="lede">In a recent conversation with staff and parents, the head of the institution reflected on Dnyanprakash's founding years and the values the school has carried forward.</p>
    <!-- DUMMY - replace later (verbatim Techvium text not yet available) -->
    <p>Mr. Narhare described the 1989 beginnings of Narhare Classes, when he began to see how mother-tongue instruction changed his students' relationship with mathematics. Over the next decade those observations — about joy, about stress, about the difference between memorising and understanding — became the foundation of Dnyanprakash when he and Mrs. Savita Narhare founded the school in 1999.</p>
    <blockquote>We want children to leave Dnyanprakash disciplined, of sound character, sensitive to the world around them, and devoted to something larger than themselves.</blockquote>
    <p>He closed by reminding the audience that the school's motto — Know &amp; Inspire — is not a slogan but a daily practice.</p>
  `,
  'mrunal-kulkarni-dialogue': `
    <p class="lede">Actor and director Mrunal Kulkarni visited Dnyanprakash for a dialogue with senior students about storytelling, Marathi culture, and courage.</p>
    <!-- DUMMY - replace later (verbatim Techvium text not yet available) -->
    <p>Ms. Kulkarni spent the morning with Vidyaniketan's Grade 9 and 10 students, opening with a short reading and then moving into an open conversation that lasted almost two hours. Students asked about the roles that shaped her, about working in Marathi cinema and television, and about the moments where she had to make difficult artistic choices.</p>
    <p>The school was grateful for her time and for the generosity of her answers — each one addressed to the student who asked it, rather than to the room as a whole.</p>
  `,
  'challenging-times-leaders': `
    <p class="lede">A reflection on how Dnyanprakash shaped character through the difficult years of 2020–2022.</p>
    <!-- DUMMY - replace later (verbatim Techvium text not yet available) -->
    <p>The pandemic years disrupted schools across India. At Dnyanprakash, faculty worked through the uncertainty of remote instruction, the return to campus, and the academic catch-up that followed. The students who went through those years — who are now in senior secondary classes — carry that experience with them.</p>
    <p>This article looks back at what those years taught us about resilience, about community, and about the quiet work of daily teaching when everything else is unsettled.</p>
  `,
};

newsStories.forEach((n, idx) => {
  const otherStories = newsStories.filter(x => x.slug !== n.slug).slice(0, 3);
  PAGES.push({
    file: `news/${n.slug}.html`,
    prefix: '../',
    title: `${n.title} — Dnyanprakash News`,
    metaDesc: n.summary,
    hero: {
      eyebrow: `News · ${n.date}`,
      title: n.title,
      subtitle: '',
      slot: String(n.slot), slotDesc: `News article hero — ${n.title}`,
      breadcrumb: bc({ href: '../index.html', label: 'Home' }, { href: 'index.html', label: 'News' }, { label: n.title.slice(0, 40) + (n.title.length > 40 ? '…' : '') })
    },
    body: proseSection(articleBodies[n.slug]) + `
    <section class="section-pad reveal" style="background: var(--color-bg-alt);">
      <div class="container-main">
        <div class="section-eyebrow">More from News</div>
        <h2 class="section-title" style="font-size:32px;">Related Stories</h2>
        <div class="news-grid">
          ${otherStories.map((o) => `
          <article class="news-card">
            <div class="news-img-wrap">${slot(o.slot, `News — ${o.title}`, 'w-full h-full')}</div>
            <div class="news-cat">News · ${o.date}</div>
            <h3 class="news-headline"><a href="${o.slug}.html">${o.title}</a></h3>
            <a href="${o.slug}.html" class="news-read">Read Story <i data-lucide="arrow-right" class="w-4 h-4"></i></a>
          </article>`).join('\n')}
        </div>
        <div style="margin-top:32px;"><a href="index.html" class="news-read">All News <i data-lucide="arrow-right" class="w-4 h-4"></i></a></div>
      </div>
    </section>`
  });
});

// ============ ALUMNI, GIVE, CONTACT, GALLERY (root pages, prefix='') =============
PAGES.push({
  file: 'alumni.html',
  prefix: '',
  title: 'Alumni — Dnyanprakash',
  metaDesc: 'Dnyanprakash alumni carry the school’s spirit into careers across India and beyond.',
  hero: {
    eyebrow: 'Our Community',
    title: 'Alumni',
    subtitle: 'Our alumni carry the Dnyanprakash spirit into careers, communities and universities across India and beyond.',
    slot: '38', slotDesc: 'Alumni page hero — group photo or campus return',
    breadcrumb: bc({ href: 'index.html', label: 'Home' }, { label: 'Alumni' })
  },
  body: proseSection(`
          <p class="lede">Once a student at Dnyanprakash, always part of the family. Our alumni keep the school’s story moving.</p>

          <h2 id="alumni-stories">Alumni Stories</h2>
          <!-- DUMMY - replace later -->
          <h3>Meera Patil — SSC 2012</h3>
          <p>Meera went on to study engineering at a leading Maharashtra institute and now works in clean-energy research. She returns to Dnyanprakash each year to mentor Grade 10 students on career choices.</p>

          <h3>Rohit Deshmukh — SSC 2015</h3>
          <p>Rohit studied commerce and today runs a family business in Latur. He is a regular speaker at the school's entrepreneurship club.</p>

          <h3>Anita Pawar — SSC 2009</h3>
          <p>Anita teaches Marathi literature at a college in Pune and credits her school's literature circle for sparking her love of the language.</p>

          <h2 id="stay-connected">Stay Connected</h2>
          <p>We keep in touch through an annual newsletter, a dedicated alumni day in December, and periodic regional meetups. Email us at <a href="mailto:dnyanprakashltr@gmail.com">dnyanprakashltr@gmail.com</a> to update your contact details.</p>

          <h2 id="give-back">Give Back</h2>
          <p>Alumni can support the school in many ways — by mentoring current students, by returning to speak, by contributing to the scholarship fund, or simply by sharing stories we can pass on to younger students. Visit the <a href="give.html">Give</a> page to learn more.</p>
        `)
});

PAGES.push({
  file: 'give.html',
  prefix: '',
  title: 'Give — Support Dnyanprakash',
  metaDesc: 'Ways to support Dnyanprakash — sponsorships, infrastructure, annual fund, and alumni giving.',
  hero: {
    eyebrow: 'Support Us',
    title: 'Support Dnyanprakash',
    subtitle: 'Your contribution keeps quality Marathi-medium education accessible to every family who wants it.',
    slot: '39', slotDesc: 'Give page hero — students at work',
    breadcrumb: bc({ href: 'index.html', label: 'Home' }, { label: 'Give' })
  },
  body: proseSection(`
          <p class="lede">Dnyanprakash has been supported for twenty-six years by the families who send their children to us, the teachers who stay for decades, and a widening circle of friends and alumni. Every gift matters.</p>

          <h2 id="ways-to-give">Ways to Give</h2>
          <!-- DUMMY - replace later -->

          <h3 id="sponsor-a-student">Sponsor a Student</h3>
          <p>Cover the annual fees of a promising student whose family needs support. Sponsorships can be made annually or across a child's full journey through the school.</p>

          <h3 id="infrastructure">Infrastructure Fund</h3>
          <p>Contribute to specific infrastructure projects — library expansion, science-lab equipment, sports-ground upgrades, or the arts and theatre space.</p>

          <h3 id="annual-fund">Annual Fund</h3>
          <p>Unrestricted annual giving that supports the school’s priorities each year — from professional development for teachers to classroom materials and student welfare.</p>

          <h2>How to contribute</h2>
          <p>Please email <a href="mailto:dnyanprakashltr@gmail.com">dnyanprakashltr@gmail.com</a> or call 02382 220598 to speak with us about giving. We will share bank details, a receipt process, and how your contribution will be used.</p>
        `)
});

PAGES.push({
  file: 'contact.html',
  prefix: '',
  title: 'Contact — Dnyanprakash',
  metaDesc: 'Contact Dnyanprakash Educational Project, Latur. Address, phone, WhatsApp, email and map.',
  hero: {
    eyebrow: 'Contact',
    title: 'Contact Dnyanprakash',
    subtitle: 'We’d love to hear from you.',
    slot: '40', slotDesc: 'Contact hero — school building or reception',
    breadcrumb: bc({ href: 'index.html', label: 'Home' }, { label: 'Contact' })
  },
  body: `
    <section class="section-pad reveal">
      <div class="container-main">
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 48px;" class="contact-grid">
          <div class="prose">
            <h2 style="margin-top:0;">Visit, call, or write</h2>
            <address class="not-italic" style="font-size:17px; line-height:1.7; margin-bottom: 24px;">
              Dnyanprakash Balvikas Kendra,<br />
              near Narhare Classes,<br />
              Behind Dayanand College,<br />
              Prakash Nagar (East),<br />
              Latur - 413512,<br />
              Maharashtra, India
            </address>
            <p><strong>Phone:</strong> <a href="tel:02382220598">02382 220598</a></p>
            <p><strong>WhatsApp:</strong> <a href="https://wa.me/919422610081" target="_blank" rel="noopener">+91 94226 10081</a></p>
            <p><strong>Email:</strong> <a href="mailto:dnyanprakashltr@gmail.com">dnyanprakashltr@gmail.com</a></p>
            <div style="aspect-ratio:4/3; overflow:hidden; border:1px solid var(--color-border); margin-top:28px;">
              <iframe
                src="https://maps.google.com/maps?q=Dayanand+College+Latur&z=15&output=embed"
                width="100%" height="100%"
                style="border:0;"
                loading="lazy"
                referrerpolicy="no-referrer-when-downgrade"
                title="Map — Dnyanprakash Educational Project, Latur"
              ></iframe>
            </div>
          </div>

          <div>
            <h2 style="font-family: var(--font-display); font-style: normal; font-weight: 400; font-size: 32px; margin: 0 0 16px;">Send us a note</h2>
            <form action="mailto:dnyanprakashltr@gmail.com" method="post" enctype="text/plain" style="display:flex; flex-direction:column; gap:14px;">
              <label style="font-size:13px; text-transform:uppercase; letter-spacing:0.05em; color: var(--color-text-muted);">Your name
                <input name="name" required style="display:block; width:100%; margin-top:6px; padding:12px; border:1px solid var(--color-border); font-size:15px; font-family: var(--font-sans);" />
              </label>
              <label style="font-size:13px; text-transform:uppercase; letter-spacing:0.05em; color: var(--color-text-muted);">Email
                <input name="email" type="email" required style="display:block; width:100%; margin-top:6px; padding:12px; border:1px solid var(--color-border); font-size:15px; font-family: var(--font-sans);" />
              </label>
              <label style="font-size:13px; text-transform:uppercase; letter-spacing:0.05em; color: var(--color-text-muted);">Subject
                <input name="subject" style="display:block; width:100%; margin-top:6px; padding:12px; border:1px solid var(--color-border); font-size:15px; font-family: var(--font-sans);" />
              </label>
              <label style="font-size:13px; text-transform:uppercase; letter-spacing:0.05em; color: var(--color-text-muted);">Message
                <textarea name="message" rows="6" required style="display:block; width:100%; margin-top:6px; padding:12px; border:1px solid var(--color-border); font-size:15px; font-family: var(--font-sans); resize:vertical;"></textarea>
              </label>
              <button type="submit" class="btn btn-primary" style="align-self:flex-start;">Send Message</button>
              <p style="font-size:13px; color: var(--color-text-muted);">This form opens your email app with the message pre-filled. If that doesn’t work, write to <a href="mailto:dnyanprakashltr@gmail.com">dnyanprakashltr@gmail.com</a> directly.</p>
            </form>
          </div>
        </div>
      </div>
      <style>
        @media (max-width: 900px) {
          .contact-grid { grid-template-columns: 1fr !important; gap: 40px !important; }
        }
      </style>
    </section>`
});

// Gallery — 4 tabs × 6 slots = 24 placeholders (slots 20–43 in §5 counting)
// Adjusted: using slots 41..64 here to avoid collisions with other pages; we'll renumber in IMAGE INDEX.
// Per user: "numbered slots 20–43". Other pages already use slots 18–40. We'll place gallery at 41–64
// and note the deviation in the final gap report.
const galleryTabs = [
  { id: 'campus', label: 'Campus', descs: ['Main building exterior', 'Library interior', 'Science lab', 'Sports ground', 'Reception area', 'Courtyard'] },
  { id: 'events', label: 'Events', descs: ['Annual day stage', 'Sports day relay', 'Cultural programme', 'Science exhibition', 'Parents meeting', 'Guest lecture'] },
  { id: 'academics', label: 'Academics', descs: ['Balbhavan classroom', 'Primary reading circle', 'Math class in progress', 'Art and craft session', 'Computer lab work', 'Group project'] },
  { id: 'sports', label: 'Sports', descs: ['Kabaddi team', 'Athletics training', 'Volleyball match', 'Chess club', 'PE session', 'Sports day finish line'] }
];
let gallerySlotCounter = 41;
const galleryTabsHtml = galleryTabs.map((t, ti) => {
  const cells = t.descs.map((d, di) => {
    const n = String(gallerySlotCounter++).padStart(2, '0');
    return `<div class="slot-box" data-img-slot="${n}" data-img-description="Gallery ${t.label} — ${d}" style="aspect-ratio:4/3;"><div class="text-center"><div class="slot-num">${n}</div><div class="slot-desc">${d}</div></div></div>`;
  }).join('\n          ');
  return `      <div class="gallery-panel" data-panel="${t.id}" ${ti === 0 ? '' : 'hidden'}>
        <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap: 16px;">
          ${cells}
        </div>
      </div>`;
}).join('\n');

PAGES.push({
  file: 'gallery.html',
  prefix: '',
  title: 'Gallery — Dnyanprakash',
  metaDesc: 'Photos from campus life, events, academics, and sports at Dnyanprakash.',
  hero: {
    eyebrow: 'Campus Life',
    title: 'Gallery',
    subtitle: 'Photos from across the school year.',
    slot: '18', slotDesc: 'Gallery hero — wide school shot',
    breadcrumb: bc({ href: 'index.html', label: 'Home' }, { label: 'Gallery' })
  },
  body: `
    <section class="section-pad reveal">
      <div class="container-main">
        <div class="gallery-tabs" role="tablist" style="display:flex; gap: 8px; border-bottom:1px solid var(--color-border); margin-bottom: 28px; overflow-x:auto;">
          ${galleryTabs.map((t, i) => `<button type="button" class="gallery-tab${i === 0 ? ' is-active' : ''}" data-tab="${t.id}" style="padding: 12px 18px; background:transparent; border:0; border-bottom: 3px solid transparent; font-family: var(--font-sans-cond); font-size: 14px; font-weight:500; text-transform:uppercase; letter-spacing:0.06em; cursor:pointer; color: var(--color-text-muted);">${t.label}</button>`).join('\n          ')}
        </div>
        ${galleryTabsHtml}
      </div>
    </section>
    <style>
      .gallery-tab.is-active { color: var(--color-primary) !important; border-bottom-color: var(--color-primary) !important; }
      @media (max-width: 640px) {
        .gallery-panel > div { grid-template-columns: repeat(2, 1fr) !important; }
      }
    </style>
    <script>
      (function(){
        const tabs = document.querySelectorAll('.gallery-tab');
        const panels = document.querySelectorAll('.gallery-panel');
        tabs.forEach(function(t){
          t.addEventListener('click', function(){
            const id = t.getAttribute('data-tab');
            tabs.forEach(function(x){ x.classList.toggle('is-active', x === t); });
            panels.forEach(function(p){ p.hidden = p.getAttribute('data-panel') !== id; });
          });
        });
      })();
    </script>`
});

/* --------------------------------------------------------------
   Write files
   -------------------------------------------------------------- */
let written = 0;
for (const p of PAGES) {
  const full = path.join(ROOT, p.file);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  const html = renderPage({
    prefix: p.prefix,
    title: p.title,
    metaDesc: p.metaDesc,
    pageHero: pageHero(p.hero),
    body: p.body
  });
  fs.writeFileSync(full, html, 'utf8');
  written++;
  console.log('wrote', p.file);
}
console.log(`\nDone. ${written} pages written.`);
