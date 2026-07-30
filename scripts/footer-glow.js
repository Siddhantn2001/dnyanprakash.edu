/* =========================================================================
   FOOTER GLOW — builds the blurred gradient band inside <footer class="site-footer">
   and drives its reveal off scroll position.

   Behaviour: the band is pinned to the bottom of the viewport at a resting
   sliver of its height. Once the remaining scroll distance drops below the
   band's own height, it stretches up from the floor, hitting full height
   exactly when the visitor reaches the end of the page.

   Vanilla port (see scripts/footer-glow.css header). Colours are theme-only —
   CLAUDE.md §7 locked tokens plus two derived tints. Do not reintroduce the
   reference component's rainbow stops.
   ========================================================================= */
(function () {
  'use strict';

  var footer = document.querySelector('footer.site-footer');
  if (!footer || footer.querySelector('.footer-glow')) return;

  /* viewBox of the band — matches the reference geometry so the bar rhythm
     and blur radius read the same. */
  var VBW = 1271;
  var VBH = 599;

  var BARS = 9;      /* number of blurred columns */
  var BLUR = 32;     /* feGaussianBlur stdDeviation, in viewBox units */
  var PEAK = 0.98;   /* tallest column, as a fraction of the viewBox height */
  var VALLEY = 0.55; /* edge column height, as a fraction of the peak */

  /* Resting height of the band before the reveal starts — read from
     --footer-glow-rest so the CSS stays the single source of truth (it is also
     the pre-JS fallback for the scaleY). */
  var REST = parseFloat(
    getComputedStyle(document.documentElement).getPropertyValue('--footer-glow-rest')
  );
  if (!(REST >= 0 && REST <= 1)) REST = 0.045;

  /* Gradient stops, floor (0) → top (1). Dnyanprakash palette:
     deep ember → navy accent → burgundy-dark → burgundy → light burgundy →
     pale burgundy → transparent.
     #010155, #6B0F1A and #9E1B32 are locked tokens (CLAUDE.md §7); #2A0509,
     #C43A52 and #E9A3AE are shades/tints derived from the burgundy.

     NOTE — the reference component put a near-white stop mid-ramp, which works
     on its dark demo page but not here: our footer is #ffffff, so a near-white
     band reads as a HOLE and splits the glow into two disconnected stripes (a
     red bar hovering over a navy bar). On a white ground the ramp has to fall
     monotonically from saturated at the floor to transparent at the top, so
     the glow reads as one continuous body of colour. Do not reinstate a
     light stop mid-ramp. */
  var STOPS = [
    { offset: 0,      color: '#2A0509' },
    { offset: 0.1600, color: '#010155' },
    { offset: 0.3400, color: '#6B0F1A' },
    { offset: 0.5200, color: '#9E1B32' },
    { offset: 0.7000, color: '#C43A52' },
    { offset: 0.8700, color: '#E9A3AE' },
    { offset: 1,      color: '#E9A3AE00' }
  ];

  /* Height curve: gentle power falloff — short edge columns, tallest middle,
     giving the flat pyramid-like rise rather than a hard bell. */
  function bellHeights(n, peak, valley) {
    var out = [];
    var mid = (n - 1) / 2;
    for (var i = 0; i < n; i++) {
      var t = mid === 0 ? 0 : Math.abs(i - mid) / mid; /* 0 centre → 1 edge */
      var eased = 1 - Math.pow(t, 1.24);
      out.push(peak * VBH * (valley + (1 - valley) * eased));
    }
    return out;
  }

  function clamp01(v) {
    return Math.max(0, Math.min(1, v));
  }

  /* ---- build the SVG ---------------------------------------------------- */
  var uid = 'dpfg';
  var colW = VBW / BARS;
  var heights = bellHeights(BARS, PEAK, VALLEY);

  var svg = '';
  svg += '<svg viewBox="0 0 ' + VBW + ' ' + VBH + '" preserveAspectRatio="none"';
  svg += ' fill="none" xmlns="http://www.w3.org/2000/svg" focusable="false">';
  svg += '<defs>';
  svg += '<linearGradient id="grad-' + uid + '" x1="0" y1="1" x2="0" y2="0">';
  for (var s = 0; s < STOPS.length; s++) {
    svg += '<stop offset="' + STOPS[s].offset + '" stop-color="' + STOPS[s].color + '" />';
  }
  svg += '</linearGradient>';
  svg += '<filter id="blur-' + uid + '" x="-50%" y="-50%" width="200%" height="200%">';
  svg += '<feGaussianBlur stdDeviation="' + BLUR + '" />';
  svg += '</filter>';
  svg += '</defs>';
  for (var i = 0; i < heights.length; i++) {
    var barH = heights[i];
    svg += '<g filter="url(#blur-' + uid + ')">';
    svg += '<rect x="' + (i * colW) + '" y="' + (VBH - barH) + '"';
    svg += ' width="' + (colW * 1.23) + '" height="' + barH + '"';
    svg += ' fill="url(#grad-' + uid + ')" />';
    svg += '</g>';
  }
  svg += '</svg>';

  var band = document.createElement('div');
  band.className = 'footer-glow';
  band.setAttribute('aria-hidden', 'true');
  band.innerHTML = svg;
  footer.appendChild(band);

  /* ---- reveal ----------------------------------------------------------- */
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) {
    band.classList.add('footer-glow--static');
    return;
  }

  var last = -1;
  var raf = 0;

  function measure() {
    raf = 0;
    /* offsetHeight ignores the transform, so the band can measure itself. */
    var h = band.offsetHeight || 1;
    /* Scroll left before the end of the page. The glow starts rising once
       that is within its own height, and is full at the bottom. */
    var left = document.documentElement.scrollHeight - window.innerHeight - window.scrollY;
    var p = REST + (1 - REST) * clamp01((h - left) / h);
    if (Math.abs(p - last) < 0.001) return;
    last = p;
    band.style.setProperty('--footer-glow-progress', p.toFixed(4));
  }

  function onScroll() {
    if (!raf) raf = window.requestAnimationFrame(measure);
  }

  measure();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  window.addEventListener('load', onScroll);
})();
