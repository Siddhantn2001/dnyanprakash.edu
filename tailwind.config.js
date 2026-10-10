/* Dev-only. Generates styles/tailwind.css, which replaces the
   cdn.tailwindcss.com script. The CDN compiled CSS in the browser on every
   page view; this is the same output, precompiled. No build step is required
   to DEPLOY the site -- the generated .css is committed like any other asset.
   Regenerate with:  npx tailwindcss -i styles/tailwind.src.css -o styles/tailwind.css --minify
*/
module.exports = {
  content: ['./**/*.html', './scripts/**/*.js', '!./node_modules/**', '!./screenshots/**'],
  theme: { extend: {} },
  plugins: [],
};
