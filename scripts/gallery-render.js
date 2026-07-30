/* =========================================================================
   GALLERY RENDER — builds photo tiles from window.DP_GALLERY_PHOTOS.

   One list, two layouts. Drop a target element on the page and this fills it:

     <div data-gallery-render="grid"></div>
        Uniform 4:3 grid — what /gallery.html's Activities panel uses. Every
        tile the same shape, matching the other tabs on that page.

     <div data-gallery-render="masonry" data-count="12"></div>
        True-aspect-ratio masonry — what the homepage strip uses. Columns are
        real elements filled round-robin, so the newest photos land across the
        TOP row (CSS `columns` would fill the first column top-to-bottom and
        bury the newest photo mid-page).

   Optional attributes
     data-count="12"    how many photos, from the top of the list. Default: all
     data-columns="3"   desktop column count for masonry. Default: 3

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
    /* Masonry fills columns round-robin, so DOM order is 1,4,7 | 2,5,8 | ...
       The lightbox sorts on this so next/prev still walk the photos in the
       order they are actually read on screen. */
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

  function columnsFor(el) {
    var max = parseInt(el.getAttribute('data-columns'), 10) || 3;
    var w = window.innerWidth;
    /* Two columns hold down to 360px: inside a bounded band, one column
       shows barely two photos and reads thin, while two still form a mosaic.
       Below 360 the tiles get too small to read, so drop to one. */
    if (w < 360) return 1;
    if (w < 900) return 2;
    return max;
  }

  function renderGrid(el, list) {
    el.textContent = '';
    var frag = document.createDocumentFragment();
    list.forEach(function (p) { frag.appendChild(tile(p, false)); });
    el.appendChild(frag);
  }

  function renderMasonry(el, list) {
    var n = columnsFor(el);
    if (el.__dpColumns === n && el.childElementCount) return; /* nothing to redo */
    el.__dpColumns = n;
    el.textContent = '';

    var cols = [];
    for (var i = 0; i < n; i++) {
      var c = document.createElement('div');
      c.className = 'gallery-masonry-col';
      cols.push(c);
      el.appendChild(c);
    }
    /* Round-robin so the newest photos sit across the top row. */
    list.forEach(function (p, i) { cols[i % n].appendChild(tile(p, true)); });
  }

  /* Tile fade-in. Deliberately NOT the site's .reveal system: that one slides
     elements in horizontally from whichever side of the viewport they sit on,
     which reads as noise on a dense photo grid. Tiles get a quiet fade + 10px
     upward drift instead, each fired once. */
  var reduced = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var io = (!reduced && 'IntersectionObserver' in window)
    ? new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          e.target.classList.add('is-in');
          io.unobserve(e.target);
        });
      }, { threshold: 0.08, rootMargin: '0px 0px -6% 0px' })
    : null;

  function observeTiles(el) {
    var tiles = el.querySelectorAll('.gallery-img');
    for (var i = 0; i < tiles.length; i++) {
      if (!io) { tiles[i].classList.add('is-in'); continue; }
      /* Short stagger within a flush, capped so late tiles never feel stalled. */
      tiles[i].style.setProperty('--gal-delay', Math.min(i, 8) * 60 + 'ms');
      io.observe(tiles[i]);
    }
  }

  function run(isInitial) {
    targets.forEach(function (el) {
      var mode = el.getAttribute('data-gallery-render');
      /* The uniform grid is width-independent — build it once. Re-rendering it
         on resize would replace every tile with a fresh un-observed node and
         strip the .is-in they had already earned, leaving them invisible. */
      if (mode !== 'masonry' && !isInitial) return;

      var count = parseInt(el.getAttribute('data-count'), 10);
      var list = (count > 0 ? photos.slice(0, count) : photos.slice())
        .map(function (p, i) {
          if (p.__i === i) return p;
          var c = Object.create(p); c.__i = i; return c;
        });
      var cols = el.__dpColumns;

      if (mode === 'masonry') renderMasonry(el, list);
      else renderGrid(el, list);

      /* Re-observe only when tiles were actually rebuilt. */
      if (isInitial || el.__dpColumns !== cols) observeTiles(el);
    });
  }

  run(true);

  /* Masonry column count is width-dependent — re-flow on resize, debounced. */
  var t;
  window.addEventListener('resize', function () {
    clearTimeout(t);
    t = setTimeout(function () { run(false); }, 150);
  }, { passive: true });
})();
