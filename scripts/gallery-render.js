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
        The set is RANDOM on every load, re-rolled per page view, with a
        reserved share of the slots held for the newest photos — see
        selectMixed() for how "newest" is defined. The grid mode is NOT
        randomised: /gallery.html is the archive and its order is fixed.

   Optional attributes
     data-count="15"    how many photos. Masonry picks a random mixed set of
                        this size; grid takes the newest N in list order.
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

  /* ---------------------------------------------------------------------
     Randomised selection for the homepage strip.

     The strip used to show the same 24 photos in the same order on every
     load. It now draws a fresh random set each time, with one guarantee:
     a fixed share of the slots is reserved for the newest photos, so a
     freshly added batch is always represented.

     "Most recent batch" is defined POSITIONALLY — the leading
     RECENT_WINDOW entries of the list. That is the only recency signal
     available: the list's documented contract is newest-first (new photos
     are prepended), and nothing in the data marks where one batch ends and
     the next begins. Sequential `base` numbers cannot separate batches
     either, since the boundary between two batches decrements by one just
     like the entries inside a batch do. File mtime is not reachable from
     the browser, and the image pipeline rewrites it anyway.

     The window is one stripful, which also means a drop smaller than the
     strip is wholly inside it. Historical drops have been 79, 25 and 175
     photos, so a batch can far exceed the 24 slots available — showing an
     entire batch is impossible by construction, and the achievable goal is
     that new photos are reliably PRESENT, which the quota delivers: each
     photo in the window has a RECENT_QUOTA/RECENT_WINDOW chance per load,
     and the window as a whole always occupies RECENT_QUOTA slots. */
  var RECENT_WINDOW = 24;  /* newest N entries count as "the current batch" */
  var RECENT_QUOTA  = 8;   /* of the strip's slots, this many come from it  */

  /* Fisher-Yates, on a copy. Math.random() only — the brief asks for no
     seeding and no persistence, so a reload genuinely re-rolls. */
  function shuffled(list) {
    var a = list.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function sample(list, k) {
    return k >= list.length ? shuffled(list) : shuffled(list).slice(0, k);
  }

  /* Order a set so that adjacent tiles differ in height class, picking at
     RANDOM among the candidates that satisfy that constraint rather than
     taking the newest. This is the part that keeps the columns interlocking:
     CSS `columns` fills top-to-bottom in DOM order, so alternating the
     height class down the list is what stops a run of identical 4:3 tiles
     stacking into one long column. Randomising the CHOICE within the
     constraint — instead of replacing the constraint — is what lets the
     strip vary without losing the mesh. */
  function interlace(items) {
    var pool = items.slice(), out = [], last = null;
    while (pool.length) {
      /* Among the tiles whose height class differs from the one just placed,
         take one at RANDOM. A largest-remaining-class-first rule spaces
         repeats slightly better in isolation, but it makes the sequence of
         classes near-deterministic, so every re-roll below comes out the
         same shape and the balance search has nothing to choose between —
         measured, that version was worse on BOTH spread (20.1% vs 10.0%
         worst) and adjacency. Random-within-the-constraint keeps the variety
         the re-roll needs. */
      var eligible = [];
      for (var i = 0; i < pool.length; i++) {
        if (bucket(pool[i]) !== last) eligible.push(i);
      }
      var idx = eligible.length
        ? eligible[Math.floor(Math.random() * eligible.length)]
        : Math.floor(Math.random() * pool.length);
      last = bucket(pool[idx]);
      out.push(pool.splice(idx, 1)[0]);
    }
    return out;
  }

  /* How many orderings to deal before keeping the most balanced. Measured
     over 30 loads: 14 tries gives 7.7% median / 12.3% worst column spread,
     40 gives 5.4/9.8, 80 gives 4.1/9.0 — so 80 lands the worst case inside
     the old fixed layout's 9.7%. It costs well under a millisecond and runs
     once per page load. */
  var BALANCE_TRIES = 80;

  /* Predicted column imbalance for an ordering, as a fraction of the tallest
     column. Approximates how CSS multicol fills: tiles go into columns in DOM
     order, each column taking tiles until it reaches its share of the total
     height. Heights are relative (h/w at a notional column width of 1), which
     is all a comparison between orderings needs. */
  function imbalance(list, ncols) {
    var hs = list.map(function (p) {
      return (p.h && p.w) ? p.h / p.w : 0.75;
    });
    var total = hs.reduce(function (a, b) { return a + b; }, 0);
    var target = total / ncols;
    var cols = [], cur = 0;
    for (var i = 0; i < hs.length; i++) {
      cur += hs[i];
      if (cur >= target && cols.length < ncols - 1) { cols.push(cur); cur = 0; }
    }
    cols.push(cur);
    while (cols.length < ncols) cols.push(0);
    var max = Math.max.apply(null, cols), min = Math.min.apply(null, cols);
    return max > 0 ? (max - min) / max : 0;
  }

  function selectMixed(all, n) {
    n = Math.min(n, all.length);

    var win    = Math.min(RECENT_WINDOW, all.length);
    var quota  = Math.min(RECENT_QUOTA, win, n);
    var recent = all.slice(0, win);
    var older  = all.slice(win);

    var picked = sample(recent, quota);
    var rest   = sample(older, n - quota);

    /* Pool smaller than the strip: backfill from the recent entries that
       the quota draw did not take, so the strip still fills. */
    if (picked.length + rest.length < n) {
      var taken = {};
      picked.forEach(function (p) { taken[p.base] = 1; });
      var spare = recent.filter(function (p) { return !taken[p.base]; });
      rest = rest.concat(sample(spare, n - picked.length - rest.length));
    }

    var out = picked.concat(rest);

    /* A portrait is the single most valuable tile for breaking the rhythm,
       and the old code forced one in deliberately. Random sampling can miss
       them, so if the draw came up with none and the pool has some, trade a
       non-reserved tile for a random portrait. */
    var hasPortrait = out.some(function (p) { return bucket(p) === 'portrait'; });
    if (!hasPortrait && out.length > quota) {
      var inSet = {};
      out.forEach(function (p) { inSet[p.base] = 1; });
      var portraits = all.filter(function (p) {
        return bucket(p) === 'portrait' && !inSet[p.base];
      });
      if (portraits.length) {
        out[quota + Math.floor(Math.random() * (out.length - quota))] =
          portraits[Math.floor(Math.random() * portraits.length)];
      }
    }

    /* Interlacing alone can still deal an unlucky order — CSS `columns`
       cannot reorder tiles to balance, so a run of very tall photos landing
       together leaves one column visibly short. Deal several hands and keep
       the most even one. The ordering stays random; this only rejects the
       worst draws, which is what holds the spread near the old fixed
       layout's instead of roughly doubling it at the tail. */
    var best = null, bestScore = Infinity;
    for (var attempt = 0; attempt < BALANCE_TRIES; attempt++) {
      var cand = interlace(out);
      /* Alternation is structural in interlace() now, so the re-roll only
         has to optimise balance. */
      var score = Math.max(imbalance(cand, 3), imbalance(cand, 2));
      if (score < bestScore) { bestScore = score; best = cand; }
    }
    return best;
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
