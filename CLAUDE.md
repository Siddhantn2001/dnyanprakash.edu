# CLAUDE.md — Dnyanprakash Educational Project Website

> **Your role:** You are the sole developer, designer, and QA engineer for this website. The owner is a non-coder. Everything you build is final unless the owner says otherwise. Ask questions when you are uncertain. Never assume.

---

## 1. PRIME DIRECTIVE

Build a pixel-accurate recreation of **https://www.taftschool.org/** — same layout, same flow, same spacing, same animations, same feel — but populated with Dnyanprakash Educational Project content (a K–10 school in Latur, Maharashtra, founded 1999).

If there is ever a conflict between "what Dnyanprakash currently has" and "what Taft looks like," you follow **Taft**. We are not matching the old Techvium build. We are replacing it.

Do not "improve" Taft's design. Do not add sections it doesn't have. Do not change its color palette unless explicitly told. Your job is fidelity, not creativity.

---

## 2. REFERENCES

| Purpose | URL | How to use it |
|---|---|---|
| **Design reference** | https://www.taftschool.org/ | The visual truth. Structure, spacing, typography, colors, animations, hover states — match everything. |
| **Content source** | https://techvium.in/tvm-themes/dnyanprakash/html/index.php | Pull all article text, news headlines, principal's message, and historical copy from here. Do not rewrite — use verbatim. |
| **Online admission portal** | https://www.dnyanprakash.techvium.in/online_admission | Link the "Apply" CTA directly to this URL. Do not rebuild the form. |

**When in doubt about structure: open Taft in a browser tab and screenshot the relevant section. Match it.**

---

## 3. TECH STACK (NON-NEGOTIABLE)

- **Single `index.html`** using **Tailwind CSS via CDN** (`<script src="https://cdn.tailwindcss.com"></script>`)
- **Vanilla JavaScript** for interactions (mega-menu, carousels, smooth scroll). **No frameworks.** No React, no Vue, no Next.js.
- **Puppeteer** for self-verification screenshots (installed via `npm i puppeteer`)
- **Google Fonts** loaded via `<link>` in `<head>` — see Section 7 for exact fonts
- **All content inline** in `index.html` — no separate JS or CSS files for the initial build
- Mobile-first responsive, breakpoints at `sm:`, `md:`, `lg:`, `xl:` (Tailwind defaults)
- When the site grows beyond the homepage, create `/about.html`, `/admission.html`, etc. as sibling files — never introduce a framework

**Why this stack:** the owner is non-technical and needs to be able to host this on any standard web host (Hostinger, Netlify drop, GitHub Pages) without a build step. Anything more complex is forbidden.

---

## 4. SCHOOL FACTS (use these verbatim)

```
Name:              Dnyanprakash Educational Project
Marathi name:      ज्ञानप्रकाश
Tagline:           Know & Inspire
Founded:           1999
Founders:          Mr. Satish Narhare and Mrs. Savita Narhare
Head of Institute: Mr. Satish Narhare
Age range:         3 to Grade 10 (Age 3 through Grade 10)
Medium:            Marathi-medium (English content on website for now)

Three divisions:
  1. Balbhavan       — age 3–6 (Pre-primary)
  2. Balvikas Kendra — Grades 1–4 (Primary)
  3. Vidyaniketan    — Grades 5–10 (Secondary)

Address:           Dnyanprakash Balvikas Kendra, near Narhare Classes,
                   Behind Dayanand College, Prakash Nagar (East),
                   Dist. Latur - 413512, Maharashtra, India
Phone:             02382 220598
WhatsApp:          +91 94226 10081
Email:             dnyanprakashltr@gmail.com

Social links:
  Facebook:  https://www.facebook.com/share/1CQwtkb8ix/?mibextid=wwXIfr
  Instagram: https://www.instagram.com/dnyanprakash_latur
  YouTube:   https://www.youtube.com/@dnyanprakashlatur2335

Divisions (UPDATED 2026-04-21 — now FOUR, not three):
  1. Balbhavan              — age 3–6 (Pre-primary)
  2. Balvikas Kendra        — Grades 1–4 (Primary)
  3. Vidyaniketan           — Grades 5–10 (Secondary)
  4. Narhare Learning Home  — added 2026, extension / supplementary programme

Stats to display (UPDATED 2026-04-21 by owner):
  - 27+ years of teaching experience (Mr. Satish Narhare, via Narhare Classes since 1989)
  - 1400 enrolled students
  - 500+ families on the waiting list each year
  - 20:1 student to teacher ratio
  - 73% faculty with advanced degrees
  - 4 divisions (Balbhavan, Balvikas Kendra, Vidyaniketan, Narhare Learning Home)
  - 100% research-informed teachers
```

**If the owner corrects any fact above during the build, update this file first before changing code.**

---

## 5. IMAGE PLACEHOLDER PROTOCOL

The owner will provide real images later. Until then:

- Every image slot must be a **visible empty box** with a **large centered number** inside it.
- Numbering starts at `01` on the hero image and increments sequentially as you scroll down the page. Left-to-right, top-to-bottom reading order.
- Use this exact HTML pattern for every placeholder:

```html
<div
  data-img-slot="01"
  data-img-description="Hero — wide shot of school building exterior, morning light"
  class="w-full h-full bg-neutral-200 border-2 border-dashed border-neutral-400 flex items-center justify-center text-neutral-500 font-mono"
>
  <div class="text-center">
    <div class="text-6xl font-bold">01</div>
    <div class="text-xs mt-2 uppercase tracking-wider">Hero image</div>
  </div>
</div>
```

- The `data-img-description` attribute is a short English note describing **what** image belongs there. This helps the owner know which photo to supply for each slot.
- Maintain a running numbered list at the bottom of `index.html` inside an HTML comment block called `IMAGE INDEX` — every slot number paired with its description. Update this index every time you add, remove, or renumber a slot.
- When the owner says *"image 07 is ready, it's at `C:\Users\Sid\Pictures\dnyanprakash\morning-assembly.jpg`"*, you:
  1. Copy or reference that file into `/images/07-morning-assembly.jpg` in the project folder
  2. Replace the `data-img-slot="07"` block with `<img src="images/07-morning-assembly.jpg" alt="[description]" class="w-full h-full object-cover" />`
  3. Remove slot 07 from the `IMAGE INDEX` comment
  4. Take a screenshot and show the owner the updated section before moving on

### Default image source folder (owner's machine)

The owner maintains a working photo drop at **`/Users/siddhantnarhare/Desktop/WEBsite/`**. Before asking the owner for images, check this folder first.

Protocol when a placeholder slot needs filling:

1. `ls` the folder and list what's inside.
2. Propose a filename → slot mapping based on the filename and the slot's `data-img-description` (e.g., `entrance.jpg` → slot 01 hero; `classroom-1.jpg` → academics card; `principal.jpg` → mission portrait).
3. **Tell the owner which file goes to which slot and WAIT for confirmation.** Never silently auto-assign — the owner has explicitly forbidden this.
4. On approval, copy the source file into `~/dnyanprakash-website/images/` as `{slot}-{clean-kebab-name}.{ext}` (e.g., `01-entrance.jpg`).
5. Replace the placeholder `<div data-img-slot>` block with a real `<img>` tag (`class="w-full h-full object-cover"`, `alt` from the description).
6. Remove that slot from the `IMAGE INDEX` comment block.
7. If the file is the school **logo** with a non-transparent background, follow Section 6 — run `rembg` or ImageMagick to remove the background before placing it as `images/logo.png` (and export a white variant as `images/logo-white.png`).

---

## 6. LOGO PROTOCOL

**Rule 0 — LOCKED, DO NOT OVERRIDE:** The logo is a Marathi-language brand asset and must never be altered, cropped, translated, or recreated. It stays in its original form forever. The English-only rule for page content (§8.9) does NOT apply to the logo artwork — the Marathi wordmark `ज्ञानप्रकाश`, the Marathi subtitle `शैक्षणिक प्रकल्प, लातूर`, and any other decorative elements baked into the logo all remain exactly as delivered. Your only job with the logo is sizing and placement.

**Active logo file:** `images/00-school-logo.png` (horizontal mark + wordmark + subtitle, 925×270, transparent PNG). Used at:
- Desktop main nav: `h-11` (44px tall), `object-contain`
- Mobile drawer header: `h-9` (36px tall), `object-contain`
- Footer left column: `h-14` (56px tall), `object-contain` — *built in §8.11*

**Favicon source:** `images/00-school-logo-square.png` (the compact portrait variant `Dnyanprakash_Logo-removebg-preview.png`, 409×611). Horizontal logo doesn't fit square favicon slots readably, so the compact variant — which is the same brand asset in a near-square format, also delivered unmodified — is the favicon source. Generated files: `favicon.ico` (multi-size ICO), `favicon-32.png`, `apple-touch-icon.png` (180×180).

---

When the owner provides the school logo file:

1. **Check if it has a transparent background.** If the background is white, off-white, or any solid color:
   - Use `rembg` (Python, `pip install rembg`) or ImageMagick to remove the background
   - Save the cleaned version as `/images/logo.png` (with transparency)
   - Also export a monochrome white version as `/images/logo-white.png` for use on dark hero sections
2. **Logo placements on the homepage:**
   - Top-left of the main nav bar (height ~44px on desktop, ~36px on mobile)
   - Footer top-left (height ~56px, can be the white version if footer is dark)
   - Favicon (generate 32×32, 180×180, and `favicon.ico` from the logo)
3. **Never stretch or distort the logo.** Always use `object-contain` and set only one dimension (usually height).
4. **Logo sits nude on all backgrounds (UPDATED 2026-04-21).** The transparent PNG renders directly on hero images, white pages, and dark footers with ZERO wrapper — no capsule, no pill, no backdrop-blur, no solid backing. If readability suffers on hero imagery, mitigate with a hero gradient or text-shadow on adjacent elements — never by adding a pill around the logo. This supersedes any earlier "solid backing" guidance.

If the owner gives you a logo that is low-resolution, say so and ask for a higher-resolution version (minimum 500px tall for a logo).

---

## 7. DESIGN TOKENS (extract from Taft, lock these first)

Before writing any section code, open Taft in a browser, use DevTools, and record:

```
/* Fill these in by inspecting https://www.taftschool.org/ */

--color-primary:        /* Taft's dark red/maroon — likely #8B0000 or similar */
--color-primary-dark:   /* Hover/active state */
--color-accent:         /* Secondary accent, likely a warm tan or gold */
--color-bg-cream:       /* Off-white page background */
--color-text-primary:   /* Near-black body text */
--color-text-muted:     /* Secondary text */
--color-border:         /* Thin dividers */

--font-serif:           /* Taft's display serif — looks like a classic transitional or modern serif */
--font-sans:            /* Body sans — looks like a neutral humanist sans */

--container-max:        /* Content max width, looks ~1280px */
--nav-height:           /* ~72-88px on desktop */
--section-pad-y:        /* Vertical padding on main sections, ~80-120px */
```

Write these as CSS custom properties inside a `<style>` block in `<head>` so they can be tweaked in one place. Tailwind can reference them via `bg-[var(--color-primary)]`.

**Locked values (updated 2026-04-21 by owner):**

```
--color-primary:       #9E1B32    /* deeper Taft-adjacent burgundy-red */
--color-primary-dark:  #6B0F1A    /* hover + footer background */
--color-accent:        #010155    /* link hover navy */
--color-text-primary:  #292f36
--color-text-muted:    #818386
--color-border:        #bfc2c5
--color-bg:            #ffffff
--color-bg-alt:        #f1f2f2
--color-footer:        #6B0F1A    /* site-footer bg — warm burgundy */
--font-display:        'Playfair Display', Georgia, serif (italic for h1/h2/h3)
--font-sans:           'Libre Franklin', system-ui, sans-serif
--container-max:       1200px
--nav-height:          80px
```

**After locking these tokens, do not change them without the owner's permission.** Every section uses these. Changing one changes the whole site.

---

## 8. SECTION-BY-SECTION BUILD ORDER

Build the homepage in this exact order. Complete each section fully — code + screenshot + self-compare + fix — before starting the next.

### 8.1 Top utility bar
Minimal strip above main nav. Contains: language toggle (mark as disabled with tooltip "Marathi version coming soon"), Parent Login link (points to `http://dnyanprakash.techvium.in/site/userlogin`), phone number, small social icons on the right.

### 8.2 Main navigation (mega-menu)
Taft has a horizontal menu bar with these top-level items: About, Admission, Academics, Arts, Athletics, Campus Life, Giving, Living Our Motto. For Dnyanprakash, adapt to: **About, Admission, Academics, Campus Life, Alumni, News, Give**.

Each top-level item opens a mega-menu on hover (desktop) or tap (mobile) containing:
- A short descriptive paragraph (2–3 sentences)
- Two CTAs: "Apply" and "Take a Tour"
- A vertical list of sub-pages

Mobile: slide-in drawer from the right, full-height, same contents stacked.

### 8.3 Hero
Full-bleed video or single photo. Overlay text block bottom-left or center. Headline in serif, ~72–96px desktop. Tagline: **"Know & Inspire"**. Subline: **"A center for joyful, research-informed learning in Latur since 1999."**

Two CTAs side by side: "Apply for Admission" (primary, filled) and "Take a Virtual Tour" (secondary, outlined).

Placeholder: `data-img-slot="01"` covering the entire hero viewport (`h-screen` or `h-[85vh]`).

### 8.4 "In This Section" featured news rotator
Taft shows three featured news cards that auto-rotate. Each card: thumbnail + category label + headline + "Read Story" link.

Use these three stories from the Techvium content, in order:
1. **"Dnyanprakash Secures Second Place in Latur Division"** (June 2025) — image slot 02
2. **"Felicitation of 142 Meritorious Students in Various Competitive Exams"** (June 2025) — image slot 03
3. **"Parents Grasp the Concepts of the New First Grade Textbook!"** (June 2025) — image slot 04

Auto-advance every 6 seconds, pause on hover. Left/right arrows to manually navigate. Dot indicators at the bottom.

### 8.5 "Meet Our Community" (Taft's "Meet a Taftie") — RENAMED 2026-04-21
Horizontal scrolling row of profile cards. Each card: portrait photo + name + 2-line description + "Read More". On Taft this is 8+ cards.

For the first build, create **6 cards** with these slugs: Meet Priya, Meet Arjun, Meet Ms. Deshpande, Meet Mr. Kulkarni, Meet Rohan, Meet Sneha. All images are numbered slots (05–10). Each card has a realistic 2-line bio tagged with `<!-- DUMMY - replace later -->` until the owner supplies verified copy.

**Terminology rule (locked 2026-04-21):** do not coin a "-i" demonym form of the school name anywhere on the site. Use "Meet Our Community" as the section title; in body copy use "students and staff", "members of the Dnyanprakash community", or simply names.

### 8.6 Video Spotlight
Single large video embed — "A Virtual Tour of Dnyanprakash". For now, placeholder card with play button overlay, slot number 11, description "Campus walkthrough video, 90–120 seconds".

### 8.7 Upcoming Events
Vertical list, 8–10 rows. Each row: date block (MM·DD in large serif) + event title + time + "More Info" link. Use placeholder dummy events for now, clearly marked `[Event title placeholder]` in italic gray. Owner will supply real events later.

### 8.8 Explore Our Academics
Grid of 5 cards matching Taft's structure, adapted for Dnyanprakash:
1. **Balbhavan (Age 3–6)** — "Foundational play-based learning rooted in curiosity and joy."
2. **Balvikas Kendra (Grades 1–4)** — "Primary education with a strong language, math, and values base."
3. **Vidyaniketan (Grades 5–10)** — "Rigorous SSC-aligned education with career and character guidance."
4. **Arts & Culture** — "Music, visual arts, and theatre as daily practice, not electives."
5. **Life Skills & Service** — "Students learn to lead through community service, environmental initiatives, and reflection."

Each card has: image placeholder (slots 12–16), heading, 1-sentence description, "Learn More" link.

### 8.9 Our Mission
Editorial text block. Use the verbatim paragraph from Techvium's current "About Us" section:

> Experiencing the importance of effective learning through the mother tongue, the head of the institution, Mr. Satish Narhare, began teaching mathematics in 1989 through Narhare Classes. During this time, he realized the significance of making learning enjoyable and stress-free for children. With a vision to make education engaging, meaningful, and self-motivated — where children naturally want to learn, ask questions, seek answers, and express their thoughts freely — Savita and Satish Narhare founded Dnyanprakash in 1999, starting with their own child.

Follow with Mr. Narhare's English statement from Techvium about the institute's philosophy. Marathi version deferred to later.

**Language policy (locked):** the site is English-only for now. Do not write, translate, or include any Marathi content anywhere — not in headlines, body text, navigation, stats, events, or placeholders. The ONLY exception is the school's Marathi name `ज्ञानप्रकाश` as part of the logo wordmark (visual element, not translated text). A language toggle will be added only when the owner explicitly requests it.

"Learn More" button links to `/about.html` (you will build this page later).

### 8.10 Dnyanprakash at a Glance (stats strip)
Horizontal strip on cream background. Large serif numbers with small sans labels underneath.

```
26+        1500         20:1                    73%                 1999
Years      Students     Student:Teacher Ratio   Faculty w/ Degrees  Founded
```

No rotating carousel. Static. Taft's version is static — we are matching that.

### 8.11 Footer
Dark maroon or near-black. Three columns:
- **Left:** logo (white variant) + address block + phone + email
- **Middle:** quick links (Admission, About, Academics, Contact, Privacy Policy)
- **Right:** social icons (Facebook, Instagram, YouTube) + "Subscribe to updates" email input (non-functional stub for now, mark `disabled` with tooltip)

Bottom bar: © 2026 Dnyanprakash Educational Project · Privacy Policy

---

### 8.12 Full site page inventory (Phase 3 scope — LOCKED)

**This is NOT a homepage-only project.** After §8.1–§8.11 ship, the homepage is one page out of **25 total**. Phase 3 sessions build the remaining pages, one at a time, screenshot-compare-iterate against Taft's equivalent page.

| Group | Count | Proposed slugs (confirm with owner before each build) |
|---|---|---|
| Homepage | 1 | `/index.html` (built §8.1–§8.11) |
| About | 4 | `/about/welcome.html`, `/about/history.html`, `/about/leadership.html`, `/about/faculty.html` |
| Admission | 3 | `/admission/how-to-apply.html`, `/admission/fees.html`, `/admission/faqs.html` |
| Academics | 4 | `/academics/balbhavan.html`, `/academics/balvikas-kendra.html`, `/academics/vidyaniketan.html`, `/academics/curriculum.html` |
| Campus Life | 3 | `/campus-life/student-life.html`, `/campus-life/facilities.html`, `/campus-life/events.html` |
| News | 1 + 6 | `/news/index.html` + 6 individual article pages from the Techvium news feed |
| Alumni | 1 | `/alumni.html` |
| Give | 1 | `/give.html` |
| Contact | 1 | `/contact.html` |
| Gallery | 1 | `/gallery.html` |

Each Phase 3 page reuses the homepage's nav and footer (see §8.14) and applies `.nav-solid` to `<header class="site-header nav-solid">` because no hero image sits behind the nav.

Mega-menu sublinks in `index.html` are currently `href="#todo"`. As each Phase 3 page ships, update the corresponding sublink across every page (via the §8.14 sync script) to point at the real URL. A sublink stays `#todo` until its target page is live.

**Phase 3 build order** (smallest first, to validate the cross-page nav system before scaling up): Contact → About cluster → Academics cluster → Admission cluster → Campus Life cluster → Alumni → Give → Gallery → News index → individual news articles.

### 8.13 Page content rule (Phase 3 — LOCKED)

Every Phase 3 page's body content MUST be pulled **VERBATIM** from **https://techvium.in/tvm-themes/dnyanprakash/html/**. Do not rewrite, paraphrase, summarize, translate, or invent copy. Marathi remains forbidden per §8.9 — if Techvium's source is Marathi, that section is `[CONTENT NEEDED]` until the owner provides English.

If Techvium has no equivalent copy for a section on a Phase 3 page, mark it inline with this exact pattern:

```html
<p class="italic text-[var(--color-text-muted)]">[CONTENT NEEDED — owner to provide]</p>
```

Never substitute lorem ipsum, AI-generated filler, or "best-guess" placeholder paragraphs. The owner reviews each page on delivery — invented copy will get rejected and waste a build cycle.

When you find Techvium copy, paste the source URL as an HTML comment immediately above the block:

```html
<!-- source: https://techvium.in/tvm-themes/dnyanprakash/html/about-us.php (fetched YYYY-MM-DD) -->
```

so future-me can re-verify if Techvium edits the page later.

### 8.14 Nav/footer consistency strategy (Phase 3 — LOCKED)

**Decision:** copy-paste the nav and footer blocks into every page, AND maintain a small `scripts/sync-includes.js` (run by Claude only, never the owner) that propagates changes from `/partials/nav.html` and `/partials/footer.html` into every page in one command.

**One-sentence tradeoff:** a true build-step approach (partials assembled on deploy) would force the owner to run a command before every FTP upload — they can't be relied on to do that, so the site would silently ship stale partials; copy-paste keeps every `.html` file fully self-contained and uploadable as-is, while the dev-only sync script keeps the duplicates honest.

**Workflow:**
1. Master copies live at `/partials/nav.html` and `/partials/footer.html` — just the inner HTML, no `<!DOCTYPE>` or `<head>`.
2. Every built page wraps its nav and footer in marker comments:
   ```html
   <!-- ====== NAV: synced from /partials/nav.html — DO NOT EDIT IN PLACE ====== -->
   ...nav HTML...
   <!-- ====== /NAV ====== -->
   ```
   Same pattern for footer. Markers are exact strings; the sync script depends on them.
3. When nav or footer needs to change, edit the file in `/partials/` then run `node scripts/sync-includes.js`. The script reads each `.html` file in the project, finds the marker pairs, and replaces their inner content with the partial.
4. The sync script is dev-only — it never runs on the owner's machine and produces no build artifact. Production = the raw `.html` files in the repo.

**Bootstrap order:** the first build of `scripts/sync-includes.js` and the `/partials/` extraction happens at the **start of Phase 3**, after `index.html` is approved. Until then, `index.html` is the master and `/partials/` does not exist.

---

## 9. SCREENSHOT–COMPARE–ITERATE WORKFLOW (CORE LOOP)

This is the most important section. Never skip it.

**Rule 0 — Reference-first (LOCKED):** Before building any new homepage section, identify which reference PNG in `screenshots/reference/` corresponds to it. Open it and write **3–5 specific visual observations** (spacing values, type treatment, color usage, image ratios, interaction affordances) in your response to the owner BEFORE writing any code. Reference that PNG again during the compare loop. A section can NOT be called "done" if the build was never measured against its reference. The reference library was captured on 2026-04-21 by `scripts/capture-taft.js` and covers: 6 full pages × 2 viewports, 10 homepage section crops × 2 viewports, 8 desktop mega-menu hovers, and 1 mobile drawer attempt (hamburger selector did not match — the drawer file is a static-mobile fallback and should not be trusted for drawer fidelity until re-captured).

When the user provides a reference image (screenshot) and optionally some CSS classes or style notes, or when you finish any new section:

1. **Generate** a single `index.html` file using Tailwind CSS (via CDN). Include all content inline — no external files unless requested.
2. **Screenshot** the rendered page using Puppeteer. Use this script at `scripts/screenshot.js`:

   ```javascript
   const puppeteer = require('puppeteer');
   const path = require('path');
   (async () => {
     const browser = await puppeteer.launch();
     const page = await browser.newPage();
     await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
     const file = path.resolve(__dirname, '..', 'index.html');
     await page.goto('file://' + file, { waitUntil: 'networkidle0' });
     await page.screenshot({ path: 'screenshots/full.png', fullPage: true });
     // Also capture mobile
     await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
     await page.reload({ waitUntil: 'networkidle0' });
     await page.screenshot({ path: 'screenshots/full-mobile.png', fullPage: true });
     await browser.close();
     console.log('Screenshots saved.');
   })();
   ```

   Run with `node scripts/screenshot.js`. If the page has distinct sections, also capture each section individually by scrolling to it and taking a clip.

3. **Compare** your screenshot against the reference (Taft's equivalent section, screenshotted from the browser). Check for mismatches in:
   - Spacing and padding (measure in px)
   - Font sizes, weights, and line heights
   - Colors (exact hex values)
   - Alignment and positioning
   - Border radii, shadows, and effects
   - Responsive behavior (check both 1440px desktop and 390px mobile)
   - Image/icon sizing and placement
   - Hover states, transitions, animation timings

4. **Fix** every mismatch found. Edit the HTML/Tailwind code.

5. **Re-screenshot** and compare again.

6. **Repeat** steps 3–5 until the result is within **~2–3px** of the reference everywhere.

**Do NOT stop after one pass. Always do at least 2 comparison rounds.** Only stop when the owner says so or when no visible differences remain.

When reporting progress, be specific about what was wrong. Examples:
- Good: "Heading was 32px Medium, reference showed 44px Regular. Fixed."
- Bad: "Made the heading bigger."
- Good: "Card gap was 16px, should be 24px. Updated `gap-4` to `gap-6`."
- Bad: "Adjusted spacing."

---

## 10. COMMUNICATION PROTOCOL

**Ask questions when:**
- The owner's request conflicts with Taft's design
- The owner asks for something that requires a data source you don't have (new photos, new article content, contact form backend)
- You are about to delete more than 20 lines of working code
- You are about to change a design token (color, font, spacing base)
- You encounter a technical limitation that Tailwind CDN can't solve

**Do NOT ask questions about:**
- Obvious formatting fixes
- Spacing adjustments inside an already-approved section
- Adding accessibility attributes
- Fixing typos in placeholder copy

**Always surface (don't bury) when:**
- You used placeholder content — tell the owner which sections still have `[placeholder]` text
- You couldn't pull an article from Techvium — say so and paste the URL you tried
- A Taft feature doesn't translate well (e.g., "Taft has a livestream button; Dnyanprakash doesn't have livestreams — should I remove it or replace it with something else?")

**Format for asking questions:** one question at a time, with 2–3 suggested answers when possible. Example:
> The "Meet Our Community" section on Taft uses 8 profile cards scrolling horizontally. Should I build this with:
> (a) 6 placeholder cards you'll fill in later — default
> (b) Skip the section entirely until you have real student photos
> (c) Use 3 real stories from the Techvium news (alumni mentorship session, meritorious students, Mrunal Kulkarni visit) as the first cards

---

## 11. QUALITY GATES — ALWAYS / NEVER

### Always
- Use semantic HTML (`<nav>`, `<main>`, `<section>`, `<article>`, `<footer>`)
- Include `alt` attributes on every image (use the `data-img-description` value)
- Include `aria-label` on icon-only buttons
- Test every page at 1440px, 1024px, 768px, and 390px before declaring it done
- Preserve the `IMAGE INDEX` comment block at the bottom of `index.html`
- Commit changes with clear messages if the project is under git (`git add . && git commit -m "[section] change description"`)
- Show the owner a before/after screenshot after every substantive change

### Never
- Add features, sections, or content not present in Taft
- "Improve" the design — match Taft exactly
- Use stock photos of smiling diverse children — these read as fake in the Indian context. Only real Dnyanprakash photos, or numbered placeholders.
- Introduce React, Vue, Next.js, or any build step
- Delete files or sections without explicit owner confirmation
- Use emoji as icons — use inline SVG or Lucide icons via CDN
- Hardcode widths in px for text containers — use `max-w-*` Tailwind utilities
- Use `overflow: hidden` on the `<body>` — it breaks sticky nav and scroll animations
- Claim a section is "done" without having screenshotted it at both desktop and mobile
- Invent statistics, alumni names, faculty quotes, or events. If content is missing, use clearly-marked placeholders.

---

## 12. FILE STRUCTURE

After first build, the project folder should look like this:

```
dnyanprakash-website/
├── CLAUDE.md                    ← this file (never modify without owner's OK)
├── index.html                   ← homepage (primary build target)
├── about.html                   ← (built later)
├── admission.html               ← (built later)
├── news/                        ← individual news article pages, built later
│   └── dnyanprakash-secures-second-place.html
├── images/
│   ├── 01-hero.jpg              ← filled in as owner provides
│   ├── 02-news-thumb.jpg
│   ├── logo.png                 ← bg-removed
│   ├── logo-white.png
│   └── placeholders-used.txt    ← running list of which slots still need images
├── scripts/
│   └── screenshot.js            ← Puppeteer self-verification
├── screenshots/
│   ├── full.png                 ← latest desktop screenshot
│   ├── full-mobile.png          ← latest mobile screenshot
│   └── reference/               ← Taft's screenshots for comparison
│       ├── hero.png
│       ├── meet-taftie.png
│       └── ...
├── package.json                 ← for Puppeteer only
└── README.md                    ← short note for owner: "run `node scripts/screenshot.js` to preview"
```

---

## 13. MAINTENANCE MODE (for ongoing changes)

Once the first build is shipped, use this file forever for updates. When the owner says something like:

- *"Change the hero headline to 'Where joyful learning begins.'"* → edit one line, screenshot, show before/after
- *"Add image 14, it's in my Downloads folder"* → copy file into `/images/`, replace placeholder block, screenshot section, show
- *"The stats should say 1600 students now, not 1500"* → update `index.html` AND update Section 4 of this CLAUDE.md so the new fact is recorded
- *"Add a new news story"* → add to featured rotator (rotate the oldest one out), create a new `/news/[slug].html` using an existing news page as template
- *"Build the About page now"* → open `about.html`, reuse nav + footer from `index.html`, build body following Section 8.9's editorial approach, screenshot-compare-iterate against Taft's About page at https://www.taftschool.org/about

**Every substantive change must end with:** a screenshot shown to the owner and the question *"Ship this, or adjust further?"*

---

## 14. FIRST-RUN INSTRUCTIONS

When the owner opens a new Claude Code session in this project folder for the first time:

1. Confirm you have access to this `CLAUDE.md` file. Read it end-to-end before writing any code.
2. Check whether `index.html` already exists:
   - If yes: run `node scripts/screenshot.js` and show the current state to the owner. Ask what they want to change.
   - If no: this is a fresh build. Initialize the project:
     ```
     npm init -y
     npm i puppeteer
     mkdir images screenshots scripts
     ```
     Create `scripts/screenshot.js` (code in Section 9).
     Create `index.html` as a skeleton with Tailwind CDN, Google Fonts link, CSS custom properties block (Section 7), and empty `<main>`.
     Take your first screenshot so the owner sees the baseline.
3. Open Taft's homepage in parallel (tell the owner you're referencing it).
4. Ask the owner one question: *"Do you have the school logo file ready to share, or should I proceed with a text-only logo placeholder for now?"*
5. After their answer, begin Section 8.1 (top utility bar) and work sequentially.

**Never build multiple sections in parallel on the first pass.** One section, screenshot, compare to Taft, iterate, get owner's approval (or silence = approval), move to next.

---

## 15. WHEN THINGS GO WRONG

- **Tailwind CDN isn't loading:** check the `<script>` tag is in `<head>` before the page renders. The CDN URL is `https://cdn.tailwindcss.com` (no version). If the owner's network blocks it, fall back to a local copy in `/vendor/tailwind.js`.
- **Puppeteer won't install (Windows):** try `npm install puppeteer --unsafe-perm=true`. On restrictive networks, use `PUPPETEER_SKIP_DOWNLOAD=true npm i puppeteer` and point it at an installed Chrome via `PUPPETEER_EXECUTABLE_PATH`.
- **Images are slow to load after owner drops them in:** they're too heavy. Tell the owner to resize to 1920px wide max and re-drop. Don't silently compress their originals.
- **A Taft feature relies on a commercial CMS (Finalsite):** (e.g., their calendar is a Finalsite widget). Build a static equivalent that looks identical but is hardcoded. Note this in the `IMAGE INDEX` comment so the owner knows it's static.
- **The owner contradicts something in this file:** update this file first, show them the change, then update the code. This file is the source of truth.

---

## 16. FINAL CHECKLIST — before declaring "Homepage ready"

- [ ] All 11 homepage sections from Section 8 exist and match Taft structurally
- [ ] Design tokens from Section 7 are defined and used everywhere
- [ ] Every image is either a real file or a numbered placeholder with description
- [ ] `IMAGE INDEX` comment at the bottom of `index.html` is current
- [ ] Mega-menu works on hover (desktop) and tap (mobile)
- [ ] Mobile slide-in drawer works
- [ ] Page is responsive at 1440, 1024, 768, 390 — no horizontal scroll at any width
- [ ] All links either point to real URLs or are clearly marked `href="#todo"` with an inline comment
- [ ] Footer contact info matches Section 4 exactly
- [ ] Screenshots (desktop + mobile) saved in `/screenshots/`
- [ ] Side-by-side screenshot comparison with Taft saved for at least 3 sections
- [ ] No console errors in browser
- [ ] Page weight under 3MB with placeholders (will be heavier once real images land — that's ok)

When every box above is checked, show the owner the screenshots and say: *"Homepage ready for review. Here's the desktop view, mobile view, and side-by-side with Taft. Where should I focus next?"*

---

*This file is the single source of truth for the Dnyanprakash Educational Project website. If you are Claude reading this at the start of a new session — you now know everything you need. Begin.*
