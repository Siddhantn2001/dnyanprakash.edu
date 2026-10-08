/* =========================================================================
   STORY FRAME — one fixed window per section, five images travelling
   upward behind it. Built from window.DP_STORY_STACKS.

   THE MECHANISM (desktop, >= 1024px)

     section
       .story-scroll     tall; its height IS the scroll distance
         .story-pin      position: sticky — text and frame pinned together
           .story-text   does not move
           .story-frame  fixed size, clips
             .story-track   five slides in one column, translated by JS

   Only ONE frame is ever visible. The five images are a continuous track
   behind it, like a filmstrip passing a window. Scroll position through
   .story-scroll maps to the track's translateY; the text never moves.

   WHY JS AND NOT animation-timeline
   Scroll-driven CSS animations would express this in a few lines, but
   Safari only shipped them recently and this audience is largely on older
   phones and iPads. So: a scroll listener, rAF-throttled, writing a single
   transform. will-change is raised when a section is near the viewport and
   dropped again when it leaves, so the compositor is not holding layers for
   three tracks the whole page long.

   HEIGHT
   Because the frame is a fixed size, section height no longer depends on
   how many images there are or how tall they are — it is purely the scroll
   distance we choose to map the travel onto (SCROLL_TRAVEL). Adding a sixth
   image makes the filmstrip move faster; it does not make the page longer.

   MOBILE (< 1024px) and prefers-reduced-motion
   Both fall back to the carousel (scripts/news-carousel.js). Below 1024px
   the grid is already one column, so there is nothing to pin beside. Under
   reduced-motion there must be no scroll-linked translation at all, and the
   carousel keeps all five reachable without any — its own transition is
   disabled in that mode, so paging is instant.
   ========================================================================= */
(function () {
  'use strict';

  var DIR = 'images/story/';
  var BP = 1024;                 // matches where .mission-stats-grid collapses
  var mounts = document.querySelectorAll('[data-story-stack]');
  if (!mounts.length) return;

  var data = window.DP_STORY_STACKS;
  if (!data) {
    console.warn('[story-frame] window.DP_STORY_STACKS missing — is scripts/story-stacks.js loaded first?');
    return;
  }

  var reduceMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function picture(photo, index, cover) {
    var stem = DIR + photo.base;
    var fig = document.createElement('figure');
    fig.className = 'story-slide';

    var pic = document.createElement('picture');
    var src = document.createElement('source');
    src.type = 'image/webp';
    src.srcset = stem + '.webp 1x, ' + stem + '@2x.webp 2x';
    pic.appendChild(src);

    var img = document.createElement('img');
    img.src = stem + '.jpg';
    img.srcset = stem + '.jpg 1x, ' + stem + '@2x.jpg 2x';
    img.alt = photo.alt || '';
    img.decoding = 'async';
    if (index > 0) img.loading = 'lazy';     // only slot 1 is eager
    if (photo.w && photo.h) { img.width = photo.w; img.height = photo.h; }
    if (cover) img.className = 'is-cover';
    /* Optional focal point. Cover crops around the centre by default, which
       is wrong when the subject sits at one edge — a tall photo of children
       under trees keeps the canopy and loses the children. `pos` in the list
       moves the crop; it applies to the desktop frame and the mobile carousel
       alike, since both use cover. */
    if (photo.pos) img.style.objectPosition = photo.pos;
    pic.appendChild(img);

    fig.appendChild(pic);
    return fig;
  }

  function buildFrame(list) {
    var frame = document.createElement('div');
    frame.className = 'story-frame';
    var track = document.createElement('div');
    track.className = 'story-track';
    list.forEach(function (p, i) { track.appendChild(picture(p, i, true)); });
    frame.appendChild(track);
    return frame;
  }

  function buildCarousel(list, label) {
    var car = document.createElement('div');
    car.className = 'news-carousel story-carousel';
    car.setAttribute('data-news-carousel', '');
    car.setAttribute('data-carousel-autoplay', 'false');
    car.setAttribute('aria-roledescription', 'carousel');
    car.setAttribute('aria-label', label);

    var vp = document.createElement('div');
    vp.className = 'news-carousel-viewport';
    var track = document.createElement('div');
    track.className = 'news-carousel-track';
    track.setAttribute('data-carousel-track', '');
    list.forEach(function (p, i) {
      var slide = document.createElement('div');
      slide.className = 'news-carousel-slide';
      slide.setAttribute('role', 'group');
      slide.setAttribute('aria-roledescription', 'slide');
      slide.setAttribute('aria-label', (i + 1) + ' of ' + list.length);
      slide.appendChild(picture(p, i, false));
      track.appendChild(slide);
    });
    vp.appendChild(track);
    car.appendChild(vp);

    ['prev', 'next'].forEach(function (dir) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'news-carousel-arrow ' + dir;
      b.setAttribute('data-carousel-' + dir, '');
      b.setAttribute('aria-label', dir === 'prev' ? 'Previous image' : 'Next image');
      b.innerHTML = dir === 'prev' ? '&#8249;' : '&#8250;';
      car.appendChild(b);
    });

    var dots = document.createElement('div');
    dots.className = 'news-carousel-dots';
    dots.setAttribute('data-carousel-dots', '');
    list.forEach(function (p, i) {
      var d = document.createElement('button');
      d.type = 'button';
      d.className = 'news-carousel-dot' + (i === 0 ? ' is-active' : '');
      d.setAttribute('data-slide-index', i);
      d.setAttribute('aria-label', 'Go to image ' + (i + 1));
      dots.appendChild(d);
    });
    car.appendChild(dots);
    return car;
  }

  /* ---------------- build ---------------- */
  var tracks = [];                              // {scroll, frame, track}
  Array.prototype.forEach.call(mounts, function (mount) {
    var key = mount.getAttribute('data-story-stack');
    var list = data[key];
    if (!list || !list.length) { console.warn('[story-frame] no slots for "' + key + '"'); return; }
    var label = mount.getAttribute('data-story-label') || key;

    mount.textContent = '';
    var frame = buildFrame(list);
    mount.appendChild(frame);
    var car = buildCarousel(list, label);
    mount.appendChild(car);
    if (window.DPCarousel) window.DPCarousel.init(car);

    var scroll = mount.closest('[data-story-scroll]');
    if (scroll) {
      /* Pace is per-image, not per-section: the CSS multiplies this by the
         scroll-per-image figure, so a section with six photos simply gets one
         more image's worth of scroll instead of moving 25% faster. */
      scroll.style.setProperty('--slides', list.length);
      tracks.push({ scroll: scroll, frame: frame,
                    track: frame.querySelector('.story-track') });
    }
  });

  if (!tracks.length || reduceMotion) return;   // carousel handles both cases

  /* ---------------- scroll driver ---------------- */
  var ticking = false;

  function update() {
    ticking = false;
    var vh = window.innerHeight;
    if (window.innerWidth < BP) return;          // carousel is in charge

    for (var i = 0; i < tracks.length; i++) {
      var t = tracks[i];
      var r = t.scroll.getBoundingClientRect();

      // Outside the neighbourhood: drop the layer and skip.
      if (r.bottom < -vh || r.top > vh * 2) {
        if (t.lifted) { t.track.style.willChange = 'auto'; t.lifted = false; }
        continue;
      }
      if (!t.lifted) { t.track.style.willChange = 'transform'; t.lifted = true; }

      /* Progress 0 -> 1 across exactly the window where the pin is engaged:
         from the moment the scroll container's top reaches the pin offset to
         the moment its bottom does. Clamped, so the track is parked at either
         end outside that window and nothing bleeds into the next section. */
      var travel = t.scroll.offsetHeight - t.frame.offsetHeight - t.pinTop;
      if (travel <= 0) continue;
      var p = (t.pinTop - r.top) / travel;
      p = p < 0 ? 0 : (p > 1 ? 1 : p);

      var max = t.track.scrollHeight - t.frame.clientHeight;
      var y = -(p * max);
      if (y !== t.last) {
        t.track.style.transform = 'translate3d(0,' + y.toFixed(2) + 'px,0)';
        t.last = y;
      }
    }
  }

  function onScroll() {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }

  function measure() {
    for (var i = 0; i < tracks.length; i++) {
      var cs = getComputedStyle(tracks[i].frame.closest('.story-pin'));
      tracks[i].pinTop = parseFloat(cs.top) || 0;
      tracks[i].last = null;
    }
    update();
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', measure);
  if (document.readyState === 'complete') measure();
  else window.addEventListener('load', measure);
  measure();
})();
