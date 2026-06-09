# Design Refinement Audit — Dnyanprakash.org
**Date:** June 10, 2026  
**Baseline:** R/GA Move 1-5 framework + mobile polish pass (sticky nav, view transitions, scroll progress)  
**Goal:** Elevation to world-class institution aesthetic — depth, intention, aliveness

---

## CURRENT STATE ANALYSIS

### What's Working Well
- **Warm color palette** — The brand red (#9E1B32) is restrained and purposeful; neutrals feel human, not cold
- **Typography system** — Playfair Display + Libre Franklin is editorial and elegant; Google Fonts substitutes are solid
- **Mobile polish** — Sticky nav with scrolled state, view transitions, scroll progress bar, drawer stagger all feel intentional
- **Motion language** — Carousel transitions (450ms cubic-bezier) and hover reveals respect restraint
- **Newsletter carousel** — This section is a reference point; depth + shadow + opacity layering is nailed (lettered background, subtle lift, purposeful shadow on arrow button)

### Where Refinement Has Runway

1. **Typography Hierarchy feels flattened**
   - h1 (46px / 54px line-height) → h2 (34px / 44px) → h3 (24px / 30px) exists on paper, but the visual distance between levels reads as incremental, not intentional
   - h2 especially could tighten: at 34px, it reads closer to h3 territory; bumping to 38-40px with 1.1 line-height creates air between levels
   - Body prose (16px / 1.7 line-height) is generous and readable, but lede paragraphs don't visually announce themselves — they read as same-weight body text
   - Eyebrows (h5, 16px uppercase / 0.05em tracking) are there but undersell the section beneath them; bumping tracking to 0.12em + subtle color shift would give them presence

2. **Depth language is inconsistent**
   - Hero text overlay (tagline + buttons) sits on the image with a text-shadow (2px 12px / 0.45 opacity); it works but feels like a fallback, not a designed moment
   - Mission section (text-heavy, ~700px max-width prose) is pure typography on white — no depth, no frame, no breathing room treatment
   - Cards/tiles (news, explore academics, upcoming events) have hover lift but no ground shadow at rest; they float, then lift more
   - Text-over-image sections (teaser blocks, about intro, etc.) don't use opacity/backdrop-filter consistently; some have semi-transparent overlays, others don't

3. **Color hierarchy in body text is binary**
   - Primary text: #2b2724 (warm dark) — good
   - Muted text: #818386 (grey) — good for captions, metadata
   - But secondary body text (subheadings, intro paragraphs, article abstracts) uses the same #2b2724 as primary body, so visual weight doesn't differentiate
   - No subtle warm-shift for tertiary text or emphasis; opportunities to layer warmth are missed

4. **Spacing feels functional, not rhythmic**
   - Section margins are even (60px / 80px depending on context), which is safe but reads as uniform
   - Internal card padding (12-20px) is proportional to content, but doesn't relate visually to nearby headline sizes
   - Whitespace around major blocks (hero, mission, featured news) could be more generous on some sections, tighter on others, to create a sense of breath and pacing
   - Section transitions lack a sense of "musical movement" — each feels equally important instead of some breathing more

5. **Micro-interactions are present but minimal**
   - Buttons ("Learn More," "Apply," etc.) change color on hover but lack shadow/scale lift; they feel responsive but not delightful
   - Links in body text have an animated underline (slides in from left) — good, but similar treatment missing on CTA buttons and nav links
   - Carousel controls (dots, arrows) lack state feedback; the active dot should pulse or glow subtly
   - Form fields, toggles, dropdown menus are functional but don't feel "alive"

6. **Component language has seams**
   - Buttons across the site are inconsistent: filled vs. outlined, with/without hover effects, varying padding/border-radius
   - Dividers (hairline rules under eyebrows, section breaks) exist but aren't systematized; some sections have them, others don't, with no clear logic
   - Icons (social, nav toggles, carousel arrows) are Lucide, which is clean, but sizing/weight varies slightly
   - Link styling in nav vs. body prose vs. buttons read as different languages, not cousins

7. **Image treatment is functional, not designed**
   - Hero image sits full-bleed with a gradient overlay, which works, but the text positioning feels like the overlay came first (it did — the R/GA polish pass)
   - Section opener images (about, academics, campus life) have no border-radius or shadow; they sit sharp-cornered and flat
   - Gallery grid (on upcoming gallery page) would have no visual framing; images would be bare tiles
   - News carousel clippings are letterboxed with a dark background (good), but the framing could feel more intentional with subtle rounded corners or a border

---

## THREE QUICK WINS (HIGH IMPACT, LOW RISK)

### Quick Win 1: Strengthen Typography Hierarchy
**Where:** All section headlines (h2, h3) + eyebrows + lede paragraphs  
**Why:** The current scale is correct on paper but reads flat visually. Tightening the relationships creates clear air and signals visual importance without adding new typefaces or colors.

**Specific changes:**
- **h2:** Increase from 34px to **40px**, tighten line-height from 44px to **48px**, add `-0.02em` letter-spacing (subtle, earned air)
- **h3:** Stays 24px but add **1.15 line-height** (currently 30px / 1.25 implied)
- **Eyebrows (h5):** Increase letter-spacing from `0.05em` to **`0.12em`**, change color from current text-primary to a *slightly warmer tone at 65% opacity* — use `rgba(43, 39, 36, 0.65)` instead of solid `#2b2724`
- **Lede paragraphs** (`p.lede`): Add `font-size: 18px` (1px larger than body) + `line-height: 1.75` + `font-weight: 500` — they announce themselves without italics (which reads as apology in this context)

**Visual effect:** h1 → h2 → h3 → body now has distinct visual weight. Section eyebrows feel like they belong *with* the section, not just above it. Lede paragraphs feel like an invitation before the body prose starts.

**Implementation:** ~15 lines of CSS in the `<style>` block. No HTML changes.

---

### Quick Win 2: Consistent Depth + Shadow Language
**Where:** All cards, overlays, text-over-image sections, and component states  
**Why:** The site has depth in isolated spots (carousel shadow on arrow button, newsletter letterbox). Systematizing this creates a coherent "things sit on planes" language.

**Specific changes:**
- **Establish a shadow hierarchy:**
  - `shadow-ground`: `0 1px 3px rgba(0,0,0,0.08)` — subtle, cards at rest sit on the page
  - `shadow-lift`: `0 4px 12px rgba(0,0,0,0.12)` — hover/interactive state, things respond
  - `shadow-float`: `0 12px 24px rgba(0,0,0,0.16)` — reserved for modals, overlays, special moments
  
- **Apply shadow-ground to all card-like elements:**
  - News cards (featured news carousel)
  - Explore Academics tiles
  - Upcoming events row items
  - Gallery grid tiles (once built)
  - "Meet Our Community" cards (if/when implemented)
  
- **Apply shadow-lift on hover** to above elements (already partly done on some; systematize it)

- **Hero text overlay:** Instead of just text-shadow, add a subtle `backdrop-filter: blur(2px)` + a ground shadow beneath the text block itself. The text sits in its own micro-plane above the image.

- **Text-over-image sections (teasers, about intro):** Where an image meets text, add a semi-transparent gradient from the image edge → `rgba(255,255,255,0.92)` backdrop, with no harsh edge. This creates depth without a color box.

**Visual effect:** The page develops visual planes. Cards sit *on* the page. Hover states feel responsive. Text over images feels layered, not just contrast-hacked.

**Implementation:** 
- Add 3 shadow utility classes to Tailwind config (or as custom Tailwind classes in `<style>`)
- Apply to ~20 existing card/tile elements (no structural change, just class additions)
- ~20 lines of CSS

---

### Quick Win 3: Color Hierarchy in Body Text + Accent Restraint
**Where:** Article bodies, sidebars, captions, metadata  
**Why:** Currently, secondary text (intro paragraphs, article abstracts, pullquotes) uses the same color weight as primary body. Adding subtle warm tone shifts creates visual rhythm without introducing new colors.

**Specific changes:**
- **Primary body text:** Keep current `#2b2724` (warm dark)
- **Secondary body text** (article abstracts, intro paragraphs, pullquotes): Change to `#47423c` — slightly lighter, *warmer* tone (more brown, less black). Creates hierarchy while staying in the warm family.
- **Tertiary text** (captions, bylines, dates, metadata labels): Keep `#818386` (grey) for now, but add `font-size: 13px` + `line-height: 1.6` for consistency
- **Links in body prose:** Keep the animated underline (it's good), ensure color is `var(--color-primary)` consistently
- **Accent restraint:** The brand red (#9E1B32) should only appear on: eyebrows, CTA buttons, link underlines in specific contexts, and hover states. Audit every page for "red creep" — if red is used for anything other than these, remove it.

**Visual effect:** When you scan a section, your eye naturally reads: h2 (dark) → eyebrow (warm, muted) → lede (medium dark) → body (dark) → secondary (lighter). No jarring color jumps.

**Implementation:**
- Add a new CSS variable: `--color-text-secondary: #47423c`
- Apply to `p.abstract`, `article p:first-of-type`, `.sidebar-pullquote`, etc.
- ~10 lines of CSS

---

### Quick Win 4: Hover States on Buttons + Links (Micro-interactions)
**Where:** All CTA buttons, nav links, carousel controls  
**Why:** Current button hovers are color-only. Adding subtle shadow + scale creates aliveness and signals responsiveness without distraction.

**Specific changes:**
- **Primary buttons** (Apply, Learn More, Read More):
  - At rest: `box-shadow: 0 1px 3px rgba(158,27,50,0.12)`
  - On hover: `box-shadow: 0 6px 16px rgba(158,27,50,0.18)` + `transform: translateY(-2px)` + color shift (already exists)
  - Transition: `var(--transition-fast)` (0.22s cubic-bezier)

- **Outlined buttons** (Take a Virtual Tour, secondary CTAs):
  - At rest: `box-shadow: none`
  - On hover: `box-shadow: 0 2px 8px rgba(158,27,50,0.14)` + `transform: translateY(-1px)` + border color shift
  
- **Nav links** (main nav, mega-menu items, footer links):
  - Add subtle `transition: color var(--transition-fast), text-decoration-thickness var(--transition-fast)`
  - On hover: Existing underline works; add a tiny `text-decoration-thickness: 2px` (from 1px default)
  
- **Carousel controls** (dots, arrows):
  - Carousel dot (inactive): `opacity: 0.4`
  - Carousel dot (active): `box-shadow: 0 0 0 2px rgba(158,27,50,0.3)` (a soft glow around the dot)
  - Arrow buttons: Already have shadow; ensure it's consistent with the button shadow hierarchy

**Visual effect:** Every interaction feels like the page is listening. Motion is restrained but present. No element feels inert.

**Implementation:**
- Audit existing button/link CSS; enhance with shadow + transform
- Add 4-6 new hover state rules
- ~25 lines of CSS
- No HTML changes

---

### Quick Win 5: Eyebrow + Section Introduction Ritual
**Where:** All section openings (hero tagline, featured news intro, mission intro, academics grid intro, etc.)  
**Why:** Creates a consistent "moment before content" ritual. Every section feels like it's been designed to be entered, not just scrolled past.

**Specific changes:**
- Every major section opening should have:
  1. **Eyebrow** (small caps, uppercase, muted color, high tracking) — signals the section category
  2. **Headline** (h2, strengthened via Quick Win 1) — signals the section purpose
  3. **Lede paragraph** (18px, medium weight, via Quick Win 1) — invites you into the content
  4. **Visual break** (a 1px hairline divider in `rgba(158,27,50,0.2)`, or subtle breathing room) — signals "content starts below"

- **Where to apply:**
  - Hero section: "Know & Inspire" tagline (already exists) + subline (already exists) + CTA buttons (already exists) ✓ This is already good.
  - "Happening at Dnyanprakash" section: add eyebrow "Featured News" + keep headline + ensure lede color shift (via Quick Win 3)
  - Mission section: add eyebrow "Our Vision" + headline "Our Mission" + ensure the opening paragraph is lede-styled (larger, medium weight)
  - Explore Academics: add eyebrow "Learning Experiences" + headline + short intro line
  - At a Glance stats: add eyebrow "Who We Are" + headline
  - Upcoming Events: add eyebrow "Calendar" + headline
  - Footer: no eyebrow needed (footer is a contained zone)

**Visual effect:** The page feels like it's been deliberately composed. Each section has a "moment of breath" at the top. Scrolling feels less like scrolling, more like moving through deliberate rooms.

**Implementation:**
- Add eyebrow HTML to ~8 sections (one `<h5>` per section)
- No new CSS needed (h5 already defined)
- ~20 lines of HTML additions

---

## AREAS ALREADY NAILED (Keep as Reference)
- **Newsletter carousel** — Lettered background, shadow on arrow, subtle lift on hover, intentional motion. This is the standard for refined depth on the site.
- **Mobile sticky nav + scrolled state** — Backdrop blur, color flip, scroll progress bar. The UX is responsive and feels alive.
- **Hero typography (tagline + subline)** — Short, impactful, editorial. The text treatment is intentional.
- **Link underline animation** — Slides in from left; it's a small detail that rewards attention. Keep this language for other interactive elements.
- **Reduced motion respect** — The site honors `prefers-reduced-motion`. Don't break this.

---

## AREAS WITH MOST RUNWAY (Post-Quick-Wins Future Work)
1. **Replace hero image** (slot 01) — current building shot is functional but doesn't anchor editorial treatment of the text. Premium school sites lead with student/faculty portrait or architectural detail.
2. **Consolidate middle teaser sections** — three similar 50/50 text+image blocks feel repetitive. Consider one combined editorial moment + small grid of related articles.
3. **Implement "Meet Our Community" section** — CSS is there, HTML structure isn't. Once real student/staff portraits are available, this becomes a showcase section with portrait-quality photography.
4. **Compress heavy PNG heroes** — six pages ship 3.3–7.6 MB images (slots 13, 14, 17, 19, 25, 47). TinyPNG or ImageMagick to ~500 KB each.
5. **Gallery lightbox + framing** — Photography-driven page needs world-class presentation (rounded corners, subtle shadows, lightbox transitions).

---

## RECOMMENDATION: IMPLEMENTATION ORDER

**Phase 1 (this session):** Implement Quick Wins 1-5 in this order:
1. Quick Win 1 (Typography) — foundation; everything else builds on it
2. Quick Win 3 (Color hierarchy) — pairs with Typography to strengthen hierarchy
3. Quick Win 2 (Depth + shadows) — now the page has room to sit in
4. Quick Win 4 (Hover states) — brings micro-interactions alive
5. Quick Win 5 (Eyebrow ritual) — systematizes section introductions

**Phase 2 (future session):** Address runway areas (hero image, teaser consolidation, compression, etc.)

---

## SUCCESS CRITERIA

- [ ] h1 → h2 → h3 → body feels like a clear visual scale
- [ ] Every card/tile casts a subtle shadow at rest, lifts on hover
- [ ] Body text feels like it has secondary/tertiary hierarchy (not just primary + muted)
- [ ] Buttons/links respond with shadow + scale, not just color
- [ ] Every major section has an eyebrow + headline + lede ritual
- [ ] No horizontal scroll at any breakpoint
- [ ] Desktop: 1440px / Tablet: 1024px / Mobile: 390px all look intentional
- [ ] Reduced motion still respected everywhere
- [ ] Page feels like it's been designed by people who care about every millimeter

---

**Next step:** Sid reviews this audit, approves the direction, and we implement the five quick wins one at a time with screenshots after each.
