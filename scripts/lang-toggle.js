/**
 * Language toggle (English ↔ Marathi) + fallback banner.
 *
 * Design:
 *  - Marathi twins live at /mr/<same-path-as-english>.
 *  - scripts/translations-manifest.js lists which Marathi pages exist.
 *  - Site root is derived from this script's own <script src>, so the code
 *    works both at domain root (/) and at a subpath (e.g. GitHub Pages:
 *    /dnyanprakash-website/) without hardcoded prefixes.
 *  - Graceful fallback: if JS fails, the toggle is a plain <a href="#">
 *    that does nothing; the rest of the site is unaffected.
 */
(function () {
  'use strict';

  // --- Locate this script's URL, infer site root ---
  var scripts = document.getElementsByTagName('script');
  var siteRootUrl = null;
  for (var i = 0; i < scripts.length; i++) {
    var s = scripts[i].src;
    if (s && s.indexOf('lang-toggle.js') !== -1) {
      siteRootUrl = s.replace(/scripts\/lang-toggle\.js(\?.*)?$/, '');
      break;
    }
  }
  if (!siteRootUrl) return;

  // --- Compute the page path relative to the site root ---
  var currentUrl = window.location.href.split('?')[0].split('#')[0];
  if (currentUrl.indexOf(siteRootUrl) !== 0) return;
  var pagePath = currentUrl.substring(siteRootUrl.length);
  if (pagePath === '' || pagePath.endsWith('/')) pagePath += 'index.html';

  var isMarathi = pagePath.indexOf('mr/') === 0;
  var logicalPath = isMarathi ? pagePath.substring(3) : pagePath;
  var marathiUrl = siteRootUrl + 'mr/' + logicalPath;
  var englishUrl = siteRootUrl + logicalPath;

  // --- Wire up the toggle button ---
  function setupToggle() {
    var toggle = document.getElementById('lang-toggle');
    if (!toggle) return;
    var label = toggle.querySelector('.lang-toggle-label');

    if (isMarathi) {
      toggle.setAttribute('href', englishUrl);
      toggle.setAttribute('aria-label', 'Switch to English');
      if (label) label.textContent = 'English';
      return;
    }

    var manifest = window.MR_TRANSLATIONS_AVAILABLE || {};
    var hasMarathi = manifest[logicalPath] === true;
    toggle.setAttribute('href', hasMarathi ? marathiUrl : '#');
    toggle.setAttribute('aria-label', 'Switch to Marathi');
    if (label) label.textContent = 'मराठी';

    toggle.addEventListener('click', function (e) {
      if (hasMarathi) return;
      e.preventDefault();
      var url = new URL(window.location.href);
      url.searchParams.set('fallback', 'true');
      window.location.href = url.toString();
    });
  }

  // --- Fallback banner (shown on English page when ?fallback=true) ---
  function showBannerIfNeeded() {
    var params = new URLSearchParams(window.location.search);
    if (params.get('fallback') !== 'true') return;
    if (sessionStorage.getItem('mr-fallback-dismissed') === '1') return;
    if (document.getElementById('mr-fallback-banner')) return;

    var banner = document.createElement('div');
    banner.id = 'mr-fallback-banner';
    banner.setAttribute('role', 'status');
    banner.style.cssText = [
      'background:#FAF5EC',
      'border-bottom:1px solid rgba(0,0,0,0.08)',
      'padding:10px 20px',
      'font-family:"Libre Franklin","Noto Sans Devanagari",system-ui,sans-serif',
      'font-size:13px',
      'line-height:1.5',
      'color:#292f36',
      'text-align:center',
      'position:relative',
      'z-index:100'
    ].join(';');

    banner.innerHTML =
      '<div style="max-width:1100px;margin:0 auto;padding-right:36px;position:relative;">' +
        '<span>हा लेख मराठीत अद्याप उपलब्ध नाही. इंग्रजी आवृत्ती दाखवली जात आहे. · ' +
        'This page is not yet available in Marathi. Showing English version.</span>' +
        '<button type="button" data-dismiss aria-label="Dismiss" ' +
        'style="position:absolute;right:0;top:50%;transform:translateY(-50%);' +
        'background:none;border:0;cursor:pointer;font-size:20px;line-height:1;' +
        'color:#818386;padding:4px 10px;">×</button>' +
      '</div>';

    document.body.insertBefore(banner, document.body.firstChild);
    banner.querySelector('[data-dismiss]').addEventListener('click', function () {
      try { sessionStorage.setItem('mr-fallback-dismissed', '1'); } catch (_) {}
      banner.remove();
    });
  }

  function init() {
    setupToggle();
    showBannerIfNeeded();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
