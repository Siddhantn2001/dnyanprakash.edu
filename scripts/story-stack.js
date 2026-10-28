/* =========================================================================
   STORY FRAME — one fixed window per section with the photographs
   travelling upward inside it. Built from window.DP_STORY_STACKS
   (scripts/story-stacks.js).

   ONE MECHANISM AT EVERY WIDTH, 320 up. No carousel, no arrows, no
   breakpoint switch: the same pinned frame and the same scroll-linked track
   run on a phone and on a desktop. Only the arrangement differs — text
   beside the frame from 1024px, heading above it below that.

     section
       .story-scroll     tall; its height IS the scroll distance
         .story-pin      position: sticky — nothing inside it moves
           .story-text     .story-head  headline
                           .story-body  paragraph + named link
           .story-media    .story-frame  fixed 4:3 window, clips
                             .story-track  the photographs, translated here

   WHY THE PARAGRAPH LEAVES THE PIN BELOW 1024px
   A pinned area only works if it fits the screen, and on a phone the
   paragraph alone runs 450-600px. Below the side-by-side width the
   paragraph and its link move to just after the scroll container; the
   heading stays pinned above the frame. Reading order: headline, the
   photographs, then the prose.

   PACE
   Each photograph gets PACE x the frame height of scroll, so the photos
   move a little faster than the page (1 / PACE) and the pace is the same
   proportionally on every screen. The section's extra height is exactly
   that travel: nothing pinned waits on an empty screen.

   WHERE IT HOLDS
   The pin is centred in the room left below the header: the sticky phone
   header (88px) on narrow screens, the full viewport on desktop where the
   header scrolls away. It is never taller than that room — the frame width
   is capped by --story-chrome in the CSS — so it can always hold.

   Reduced motion, or no script: nothing pins and the frame shows the first
   photograph. Scroll is read once per frame (rAF); every layout read is
   cached on resize, load and when the page height changes, so the scroll
   path only reads window.scrollY and writes one transform per section.
   ========================================================================= */
(function () {
  'use strict';

  var DIR = 'images/story/';
  var SIDE_BY_SIDE = 1024;     // matches @media (min-width: 1024px) in index.html
  var PACE = 0.7;              // scroll per photograph, in frame heights
  var mounts = document.querySelectorAll('[data-story-stack]');
  if (!mounts.length) return;

  var data = window.DP_STORY_STACKS;
  if (!data) {
    console.warn('[story-frame] window.DP_STORY_STACKS missing — is scripts/story-stacks.js loaded first?');
    return;
  }

  var reduceMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Width descriptors, so each slide ships at the size the frame paints:
     the full phone width, or the 548px desktop column. */
  var SIZES = '(max-width: 1023px) 100vw, 548px';
  function picture(photo) {
    var stem = DIR + photo.base;
    var WS = (window.DP_STORY_WIDTHS || {})[photo.base] || [];
    var set = function (ext) {
      return WS.length
        ? WS.map(function (w) { return stem + '-' + w + ext + ' ' + w + 'w'; }).join(', ')
        : stem + ext;
    };

    var fig = document.createElement('figure');
    fig.className = 'story-slide';
    var pic = document.createElement('picture');
    [['image/avif', '.avif'], ['image/webp', '.webp']].forEach(function (t) {
      var s = document.createElement('source');
      s.type = t[0]; s.sizes = SIZES; s.srcset = set(t[1]);
      pic.appendChild(s);
    });
    var img = document.createElement('img');
    img.src = WS.length ? stem + '-' + WS[WS.length - 1] + '.jpg' : stem + '.jpg';
    img.sizes = SIZES;
    img.srcset = set('.jpg');
    img.alt = photo.alt || '';
    img.decoding = 'async';
    /* Every section sits well below the first screen. The script switches a
       section's photographs to eager as it approaches (see update), because
       a slide clipped by the frame never counts as near the viewport and
       would otherwise only start loading as it travelled into view. */
    img.loading = 'lazy';
    if (photo.w && photo.h) { img.width = photo.w; img.height = photo.h; }
    /* Optional focal point: cover crops around the centre, which is wrong
       when the subject sits off-centre (all the portrait photographs). */
    if (photo.pos) img.style.objectPosition = photo.pos;
    pic.appendChild(img);
    fig.appendChild(pic);
    return fig;
  }

  var tracks = [];
  Array.prototype.forEach.call(mounts, function (mount) {
    var key = mount.getAttribute('data-story-stack');
    var list = data[key];
    if (!list || !list.length) { console.warn('[story-frame] no slots for "' + key + '"'); return; }

    var frame = document.createElement('div');
    frame.className = 'story-frame';
    var track = document.createElement('div');
    track.className = 'story-track';
    list.forEach(function (p) { track.appendChild(picture(p)); });
    frame.appendChild(track);
    mount.textContent = '';
    mount.appendChild(frame);

    var scroll = mount.closest('[data-story-scroll]');
    if (!scroll) return;
    var pin = scroll.querySelector('.story-pin');
    var body = scroll.querySelector('.story-body');
    var tail = document.createElement('div');
    tail.className = 'container-main story-tail';
    scroll.parentNode.insertBefore(tail, scroll.nextSibling);

    tracks.push({ scroll: scroll, pin: pin, frame: frame, track: track, n: list.length,
                  head: scroll.querySelector('.story-head'),
                  body: body, home: body ? body.parentNode : null, tail: tail });
  });
  if (!tracks.length) return;

  /* ---------- arrangement: paragraph in or out of the pin ---------- */
  var stacked = null;
  function layout() {
    var now = window.innerWidth < SIDE_BY_SIDE;
    if (now === stacked) return;
    stacked = now;
    tracks.forEach(function (t) {
      if (!t.body) return;
      if (now) t.tail.appendChild(t.body);
      else t.home.appendChild(t.body);
    });
  }

  /* The sticky phone header covers the top of the screen; on desktop the
     header scrolls away with the hero. */
  function headerRoom() {
    var h = document.querySelector('.site-header');
    if (!h) return 0;
    var pos = getComputedStyle(h).position;
    return (pos === 'sticky' || pos === 'fixed') ? h.offsetHeight : 0;
  }

  /* ---------- sizing: where each pin holds and how long ---------- */
  var vh = window.innerHeight;
  function measure() {
    layout();
    vh = window.innerHeight;
    var room = headerRoom();
    var i, t;
    if (reduceMotion) { cache(); return; }

    /* Write phase 1: the frame's height cap needs the header and heading. */
    for (i = 0; i < tracks.length; i++) {
      t = tracks[i];
      t.scroll.classList.add('is-live');
      var headH = stacked && t.head ? t.head.offsetHeight : 0;
      t.pin.style.setProperty('--story-chrome', (room + headH + 20 + 32) + 'px');
    }
    /* Read, then write: centre the pin in the room below the header and
       give the section exactly the scroll its photographs need. */
    var m = tracks.map(function (t) {
      return { pinH: t.pin.offsetHeight, fh: t.frame.offsetHeight };
    });
    for (i = 0; i < tracks.length; i++) {
      t = tracks[i];
      var top = room + Math.max(stacked ? 12 : 24, (vh - room - m[i].pinH) / 2);
      t.pin.style.top = Math.round(top) + 'px';
      t.scroll.style.height = Math.round(m[i].pinH + (t.n - 1) * m[i].fh * PACE) + 'px';
    }
    cache();
    update();
  }

  /* ---------- cached geometry (document space) ---------- */
  function cache() {
    var y = window.scrollY;
    for (var i = 0; i < tracks.length; i++) {
      var t = tracks[i];
      t.pinTop = parseFloat(t.pin.style.top) || 0;
      t.pinH   = t.pin.offsetHeight;
      t.top    = t.scroll.getBoundingClientRect().top + y;
      t.h      = t.scroll.offsetHeight;
      t.max    = t.track.scrollHeight - t.frame.clientHeight;
      t.travel = t.h - t.pinH;
      t.last   = null;
    }
  }

  /* ---------- scroll driver: reads scrollY, writes one transform ---------- */
  var ticking = false;
  function update() {
    ticking = false;
    var y = window.scrollY;
    for (var i = 0; i < tracks.length; i++) {
      var t = tracks[i];
      var top = t.top - y;
      var bottom = top + t.h;

      if (!t.eager && top < vh * 2.5 && bottom > -vh) {
        Array.prototype.forEach.call(t.track.querySelectorAll('img'), function (img) { img.loading = 'eager'; });
        t.eager = true;
      }
      if (t.travel <= 0 || t.max <= 0) continue;

      if (bottom < -vh || top > vh * 2) {
        if (t.lifted) { t.track.style.willChange = 'auto'; t.lifted = false; }
        continue;
      }
      if (!t.lifted) { t.track.style.willChange = 'transform'; t.lifted = true; }

      var p = (t.pinTop - top) / t.travel;
      p = p < 0 ? 0 : (p > 1 ? 1 : p);
      var ny = -(p * t.max);
      if (ny !== t.last) {
        t.track.style.transform = 'translate3d(0,' + ny.toFixed(2) + 'px,0)';
        t.last = ny;
      }
    }
  }
  function onScroll() {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }

  if (reduceMotion) { measure(); return; }

  /* A phone's address bar resizes the viewport by 50-100px as it hides and
     shows; re-centring a held pin then would make it jump mid-scroll. */
  var lastW = window.innerWidth, lastH = window.innerHeight;
  function onResize() {
    if (window.innerWidth === lastW && Math.abs(window.innerHeight - lastH) < 160) return;
    lastW = window.innerWidth; lastH = window.innerHeight;
    measure();
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onResize);
  window.addEventListener('orientationchange', measure);
  window.addEventListener('load', measure);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);

  /* Lazy photographs settling elsewhere move every section below them:
     re-read the cache, coalesced into one frame. */
  if (window.ResizeObserver) {
    var pending = false;
    var ro = new ResizeObserver(function () {
      if (pending) return;
      pending = true;
      requestAnimationFrame(function () { pending = false; cache(); update(); });
    });
    ro.observe(document.documentElement);
  }

  measure();
})();
