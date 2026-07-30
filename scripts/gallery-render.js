/* =========================================================================
   GALLERY RENDER — builds photo tiles from window.DP_GALLERY_PHOTOS.

   One list, two layouts. Drop a target element on the page and this fills it:

     <div data-gallery-render="grid"></div>
        Uniform 4:3 grid — what /gallery.html's Activities panel uses. Every
        tile the same shape, matching the other tabs on that page.

     <div data-gallery-render="masonry" data-count="15"></div>
        True-aspect-ratio masonry in CSS columns — what the homepage strip
        uses. Photos are chosen by selectMixed() so tall and wide tiles
        alternate and the columns interlock instead of reading as loose rows.

   Optional attributes
     data-count="15"    how many photos. Masonry picks a mixed set of this
                        size from the newest; grid takes the newest N.
                        Default: all. Column count is pure CSS (gallery.css).

   Tiles carry .gallery-img, so scripts/lightbox.js picks them up and the
   existing gallery page styling applies unchanged.
   ========================================================================= */
(function () {
  'use strict';

  var targets = document.querySelectorAll('[data-gallery-render]');
  if (!targets.length) return;

  var photos = window.DP_GALLERY_PHOTOS;
  if (!photos || !photos.length) {
    console.warn('[gallery-render] window.DP_GALLERY_PHOTOS is missing — is scripts/gallery-photos.js loaded first?');
    return;
  }
  var DIR = window.DP_GALLERY_DIR || 'images/gallery/upkram/';

  /* One tile. `ratio` false → caller sets the shape (uniform grid). */
  function tile(photo, useTrueRatio) {
    var d = document.createElement('div');
    d.className = 'gallery-img';
    d.style.aspectRatio = useTrueRatio && photo.w && photo.h
      ? photo.w + ' / ' + photo.h
      : '4 / 3';

    var stem = DIR + photo.base;
    var pic = document.createElement('picture');

    var source = document.createElement('source');
    source.type = 'image/webp';
    source.srcset = stem + '.webp 1x, ' + stem + '@2x.webp 2x';
    pic.appendChild(source);

    var img = document.createElement('img');
    /* Reading order for the lightbox. CSS columns fill top-to-bottom in DOM
       order, so this matches what the eye follows; it is stamped explicitly
       so the lightbox never has to infer order from layout. */
    if (typeof photo.__i === 'number') img.setAttribute('data-lb-index', photo.__i);
    img.src = stem + '.jpg';
    img.srcset = stem + '.jpg 1x, ' + stem + '@2x.jpg 2x';
    img.alt = photo.alt || '';
    img.loading = 'lazy';
    img.decoding = 'async';
    img.className = 'w-full h-full object-cover';
    if (photo.w && photo.h) { img.width = photo.w; img.height = photo.h; }
    pic.appendChild(img);

    d.appendChild(pic);
    return d;
  }

  /* Height class of a photo at a fixed column width. This — not the
     "portrait"/"landscape" label — is what decides how tiles interlock.
     tall ~0.75 (4:3), mid ~0.56 (16:9), wide ~0.45 (panorama), and a true
     portrait lands at 2.2. */
  function bucket(p) {
    var r = (p.h && p.w) ? p.h / p.w : 0.75;
    if (r >= 1) return 'portrait';
    if (r >= 0.7) return 'tall';
    if (r >= 0.5) return 'mid';
    return 'wide';
  }

  /* Pick n photos that interlock, staying as new as possible.

     Taking the newest n outright gives runs of identical 4:3 tiles, which is
     what made the strip read as loose rows. Instead: walk newest-first and
     prefer the newest candidate whose height class differs from the one just
     placed, so tall tiles alternate with wide ones and the columns mesh.
     Any portrait in the window is placed early — there is currently exactly
     one portrait in the whole library, so it is the single most valuable tile
     for breaking up the rhythm. */
  function selectMixed(all, n) {
    var pool = all.slice(0, Math.min(all.length, Math.max(n * 3, n)));
    var used = [], out = [], last = null;

    var portrait = -1;
    for (var i = 0; i < pool.length; i++) {
      if (bucket(pool[i]) === 'portrait') { portrait = i; break; }
    }
    if (portrait > -1 && n > 1) { out.push(pool[portrait]); used[portrait] = 1; last = 'portrait'; }

    while (out.length < n) {
      var pick = -1, fallback = -1;
      for (var j = 0; j < pool.length; j++) {
        if (used[j]) continue;
        if (fallback < 0) fallback = j;
        if (bucket(pool[j]) !== last) { pick = j; break; }
      }
      if (pick < 0) pick = fallback;
      if (pick < 0) break;
      used[pick] = 1;
      out.push(pool[pick]);
      last = bucket(pool[pick]);
    }
    /* The portrait was pushed first to guarantee inclusion; slot it back a
       little so the strip does not open on the one odd-shaped tile. */
    if (portrait > -1 && out.length > 2) out.splice(2, 0, out.shift());
    return out;
  }

  function renderGrid(el, list) {
    el.textContent = '';
    var frag = document.createDocumentFragment();
    list.forEach(function (p) { frag.appendChild(tile(p, false)); });
    el.appendChild(frag);
  }

  /* Masonry is CSS `columns` — the browser balances the column heights, which
     packs tighter than hand-built flex columns ever did. It also fills column
     one top-to-bottom in DOM order, so DOM order IS reading order here and
     the lightbox's index needs no remapping. */
  function renderMasonry(el, list) {
    el.textContent = '';
    var frag = document.createDocumentFragment();
    list.forEach(function (p) { frag.appendChild(tile(p, true)); });
    el.appendChild(frag);
  }

  /* Tiles rise in. Deliberately NOT the site's .reveal system: that one slides
     elements in horizontally from whichever side of the viewport they sit on,
     which reads as noise on a dense photo grid. Tiles fade up 24px instead,
     each fired once, staggered 70ms so the mosaic cascades. */
  var reduced = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var canObserve = !reduced && 'IntersectionObserver' in window;

  /* Tiles inside a scrolling window MUST be observed against that window — a
     page-viewport observer fires once when the box scrolls into the page and
     then never again, so every tile below the fold of the box would stay
     stuck at opacity 0. Passing root makes the reveal follow the INTERNAL
     scroll, which is the whole point of the window. */
  function observeTiles(el) {
    var tiles = el.querySelectorAll('.gallery-img');
    /* The nearest scrolling ancestor, if any, becomes the observer root. */
    var root = el.closest('[data-gallery-scroll]');

    if (!canObserve) {
      for (var k = 0; k < tiles.length; k++) tiles[k].classList.add('is-in');
      return;
    }

    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-in');
        obs.unobserve(e.target);
      });
    }, {
      root: root || null,
      threshold: 0.08,
      rootMargin: root ? '0px 0px -4% 0px' : '0px 0px -6% 0px'
    });

    for (var i = 0; i < tiles.length; i++) {
      /* Stagger only the first screenful. Tiles reached by scrolling should
         rise the moment they appear, not wait out a queue. */
      tiles[i].style.setProperty('--gal-delay', (i < 6 ? i * 70 : 0) + 'ms');
      obs.observe(tiles[i]);
    }
  }

  /* Both layouts are now width-independent — CSS handles the reflow — so
     everything is built exactly once. No resize re-render, which also means
     no risk of replacing revealed tiles with fresh invisible ones. */
  targets.forEach(function (el) {
    var mode = el.getAttribute('data-gallery-render');
    var count = parseInt(el.getAttribute('data-count'), 10);

    var list;
    if (mode === 'masonry') {
      list = count > 0 ? selectMixed(photos, count) : photos.slice();
    } else {
      list = count > 0 ? photos.slice(0, count) : photos.slice();
    }
    list = list.map(function (p, i) {
      var c = Object.create(p); c.__i = i; return c;
    });

    if (mode === 'masonry') renderMasonry(el, list);
    else renderGrid(el, list);
    observeTiles(el);
  });
})();
