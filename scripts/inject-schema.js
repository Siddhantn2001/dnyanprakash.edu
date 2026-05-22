#!/usr/bin/env node
/**
 * inject-schema.js — DEV-ONLY (never run by the owner; not part of the site).
 *
 * Adds Schema.org JSON-LD structured data so Google identifies Dnyanprakash
 * as a School in Latur (and stops confusing it with the historical newspaper
 * of the same name).
 *
 *  1. A "School" (EducationalOrganization) block is injected into the <head>
 *     of EVERY .html page. All URLs are absolute (https://dnyanprakash.org/…),
 *     so the block is byte-identical on every page regardless of folder depth.
 *  2. An "FAQPage" block is injected into admission/faq.html ONLY, built by
 *     parsing that page's own <details class="faq-item"> blocks so the schema
 *     always matches the visible Q&A verbatim. (The Marathi twin is a
 *     "coming soon" placeholder with no visible Q&A, so it gets the School
 *     block only — Google requires FAQ content to be visible on the page.)
 *
 * Idempotent: re-running skips pages that already carry each marker, so it is
 * safe to run again after new pages are added.
 *
 * Usage:  node scripts/inject-schema.js
 */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SCHOOL_MARKER = '<!-- Schema.org: School (org-wide structured data) -->';
const FAQ_MARKER = '<!-- Schema.org: FAQPage (parsed from this page\'s Q&A) -->';

/* ---------- 1. School / EducationalOrganization (org-wide) ---------- */
const school = {
  '@context': 'https://schema.org',
  '@type': 'School',
  name: 'Dnyanprakash Educational Project',
  alternateName: 'Dnyanprakash',
  description:
    'A Marathi-medium school in Latur, Maharashtra, founded in 1999, serving students from kindergarten to Grade 10 across four divisions.',
  url: 'https://dnyanprakash.org',
  logo: 'https://dnyanprakash.org/images/favicon/favicon-512x512.png',
  foundingDate: '1999',
  founder: [
    { '@type': 'Person', name: 'Satish Narhare' },
    { '@type': 'Person', name: 'Savita Narhare' }
  ],
  address: {
    '@type': 'PostalAddress',
    streetAddress:
      'Dnyanprakash Balvikas Kendra, near Narhare Classes, Behind Dayanand College, Prakash Nagar (East)',
    addressLocality: 'Latur',
    postalCode: '413512',
    addressRegion: 'Maharashtra',
    addressCountry: 'IN'
  },
  sameAs: [
    'https://www.facebook.com/share/1CQwtkb8ix/?mibextid=wwXIfr',
    'https://www.instagram.com/dnyanprakash_latur',
    'https://www.youtube.com/@dnyanprakashlatur2335'
  ]
};

function ldBlock(marker, obj) {
  return (
    `  ${marker}\n` +
    `  <script type="application/ld+json">\n` +
    `${JSON.stringify(obj, null, 2)}\n` +
    `  </script>\n`
  );
}

/* ---------- HTML entity decode → plain text (for FAQ answers) ---------- */
function toPlainText(html) {
  return html
    .replace(/<[^>]+>/g, '')        // strip all tags (incl. <em>, <a>)
    .replace(/&ndash;/g, '–')
    .replace(/&mdash;/g, '—')
    .replace(/&rsquo;/g, '’')
    .replace(/&lsquo;/g, '‘')
    .replace(/&ldquo;/g, '“')
    .replace(/&rdquo;/g, '”')
    .replace(/&hellip;/g, '…')
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')         // decode last to avoid double-decoding
    .replace(/\s+/g, ' ')
    .trim();
}

/* ---------- Parse a faq.html into [{question, answer}] ---------- */
function parseFaq(html) {
  const itemRe =
    /<details class="faq-item">\s*<summary>([\s\S]*?)<\/summary>\s*<div class="faq-answer">([\s\S]*?)<\/div>\s*<\/details>/g;
  const out = [];
  let m;
  while ((m = itemRe.exec(html)) !== null) {
    const question = toPlainText(m[1]);
    // Drop the "Read more →" nav paragraph; keep only answer prose <p>s.
    const answerHtml = m[2].replace(/<p class="faq-link">[\s\S]*?<\/p>/g, '');
    const answer = toPlainText(answerHtml);
    if (question && answer) out.push({ question, answer });
  }
  return out;
}

function faqPageObject(qa) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: qa.map(({ question, answer }) => ({
      '@type': 'Question',
      name: question,
      acceptedAnswer: { '@type': 'Answer', text: answer }
    }))
  };
}

/* ---------- Walk for .html files ---------- */
function walk(dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    // Skip deps, git, and screenshots/ (Taft reference captures — not site pages).
    if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'screenshots') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, acc);
    else if (entry.name.endsWith('.html')) acc.push(full);
  }
  return acc;
}

/* ---------- Run ---------- */
const files = walk(ROOT);
const faqEnglish = path.join(ROOT, 'admission', 'faq.html');

let schoolInjected = 0, schoolSkipped = 0, faqInjected = 0;

for (const file of files) {
  let html = fs.readFileSync(file, 'utf8');
  let changed = false;

  // School block — every page
  if (!html.includes(SCHOOL_MARKER)) {
    html = html.replace('</head>', ldBlock(SCHOOL_MARKER, school) + '</head>');
    schoolInjected++;
    changed = true;
  } else {
    schoolSkipped++;
  }

  // FAQPage block — English FAQ page only
  if (file === faqEnglish && !html.includes(FAQ_MARKER)) {
    const qa = parseFaq(html);
    if (qa.length === 0) {
      console.warn('FAQ parse found 0 questions in', file);
    } else {
      html = html.replace('</head>', ldBlock(FAQ_MARKER, faqPageObject(qa)) + '</head>');
      faqInjected = qa.length;
      changed = true;
    }
  }

  if (changed) fs.writeFileSync(file, html);
}

console.log(
  `School block: injected ${schoolInjected}, skipped(existing) ${schoolSkipped} | ` +
  `FAQPage: ${faqInjected} questions into admission/faq.html | total html: ${files.length}`
);
