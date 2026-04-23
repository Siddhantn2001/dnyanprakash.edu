/**
 * Translation manifest — single source of truth for Marathi page availability.
 *
 * HOW TO ADD A NEW MARATHI PAGE:
 *   1. Create the Marathi HTML file at /mr/<same-path-as-english>
 *   2. Add an entry to the object below:
 *        "<path-relative-to-site-root>": true
 *      e.g. "about/index.html": true, or "index.html": true.
 *   3. That's it — the language toggle reads this map at runtime.
 *
 * When a key is missing (or set to anything other than true), clicking
 * मराठी on that English page keeps the user on the English page and
 * appends ?fallback=true, which surfaces the fallback banner.
 */
window.MR_TRANSLATIONS_AVAILABLE = {
  // Populated as Marathi pages are added. Empty for now.
};
