/* =========================================================================
   STORY FRAME — one fixed window per section with the photographs
   travelling upward behind it. Built from window.DP_STORY_STACKS.

   ONE MECHANISM AT EVERY WIDTH, 320 up. There is no carousel and no
   breakpoint switch: the same pinned frame and the same scroll-linked track
   run on a phone and on a desktop. Only the arrangement differs — side by
   side when there is room, stacked when there is not.

     section
       .story-scroll     tall; its height IS the scroll distance
         .story-pin      position: sticky — nothing inside it moves
           .story-text     .story-head  eyebrow + headline
                           .story-body  paragraph + Read More
           .story-media    .story-frame  fixed window, clips
                             .story-track  the photographs, translated here

   WHY THE BODY COPY LEAVES THE PIN ON NARROW SCREENS
   A pinned area only works if it fits the viewport. Measured, the text
   column runs 636-802px on phones — at 320x640 the paragraph alone is
   taller than the screen — so pinning all of it plus a frame is not
   geometrically possible. Below the side-by-side width the paragraph and
   its link are therefore moved out of the pin, to just after the scroll
   container, and the heading stays pinned above the frame. The reader gets
   headline, then the filmstrip, then the prose.

   WHY JS AND NOT animation-timeline
   Scroll-driven CSS animations would say this in a few lines, but Safari
   shipped them too recently for an audience largely on older phones and
   iPads. So: one passive scroll listener, rAF-throttled, writing a single
   transform. will-change is raised only while a section is near the fold.
   ========================================================================= */
(function () {
  'use strict';

  var DIR = 'images/story/';
  var STACK_AT = 1024;         // at or below this the layout stacks and the body moves out
  var mounts = document.querySelectorAll('[data-story-stack]');
  if (!mounts.length) return;

  var data = window.DP_STORY_STACKS;
  if (!data) {
    console.warn('[story-frame] window.DP_STORY_STACKS missing — is scripts/story-stacks.js loaded first?');
    return;
  }

  var reduceMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function picture(photo, index) {
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
    if (index > 0) img.loading = 'lazy';          // only slot 1 is eager
    if (photo.w && photo.h) { img.width = photo.w; img.height = photo.h; }
    /* Optional focal point: cover crops around the centre, which is wrong
       when the subject sits at one edge. */
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
    list.forEach(function (p, i) { track.appendChild(picture(p, i)); });
    frame.appendChild(track);

    mount.textContent = '';
    mount.appendChild(frame);

    var scroll = mount.closest('[data-story-scroll]');
    if (!scroll) return;
    /* Pace is per image, not per section: a section with six photographs gets
       one more image's worth of scroll rather than racing through them. */
    scroll.style.setProperty('--slides', list.length);

    /* Where the paragraph goes when the layout stacks. */
    var body = scroll.querySelector('.story-body');
    var tail = document.createElement('div');
    tail.className = 'container-main story-tail';
    scroll.parentNode.insertBefore(tail, scroll.nextSibling);

    tracks.push({ scroll: scroll, frame: frame, track: track, body: body, tail: tail,
                  home: body ? body.parentNode : null });
  });

  if (!tracks.length) return;

  /* ---------- layout: body copy in or out of the pin ---------- */
  var stacked = null;
  function layout() {
    var now = window.innerWidth <= STACK_AT;   // inclusive: the CSS uses max-width: 1024px
    if (now === stacked) return;
    stacked = now;
    tracks.forEach(function (t) {
      if (!t.body) return;
      if (now) t.tail.appendChild(t.body);
      else t.home.appendChild(t.body);
    });
  }

  /* ---------- scroll driver ---------- */
  var ticking = false;

  function update() {
    ticking = false;
    var vh = window.innerHeight;
    for (var i = 0; i < tracks.length; i++) {
      var t = tracks[i];
      var r = t.scroll.getBoundingClientRect();

      if (r.bottom < -vh || r.top > vh * 2) {
        if (t.lifted) { t.track.style.willChange = 'auto'; t.lifted = false; }
        continue;
      }
      if (!t.lifted) { t.track.style.willChange = 'transform'; t.lifted = true; }

      var travel = t.scroll.offsetHeight - t.pinH - t.pinTop;
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
    layout();
    for (var i = 0; i < tracks.length; i++) {
      var pin = tracks[i].frame.closest('.story-pin');
      tracks[i].pinTop = parseFloat(getComputedStyle(pin).top) || 0;
      tracks[i].pinH = pin.offsetHeight;        // the pin, not just the frame
      tracks[i].last = null;
      /* The stacked frame sizes to whatever the heading leaves. Publish the
         real heading height so the CSS min() has a true number instead of a
         guess — headlines wrap to two or three lines depending on width. */
      var head = pin.querySelector('.story-head');
      if (head) pin.style.setProperty('--story-head', head.offsetHeight + 'px');

      /* Scroll distance in terms of the frame itself, so the pace is the same
         proportionally everywhere: roughly nine tenths of a frame of scroll
         per photograph. A hardcoded figure would be right on a desktop and
         absurd on a phone, where the frame is less than two thirds the size. */
      var fh = tracks[i].frame.offsetHeight;
      var n = tracks[i].track.children.length;
      if (fh > 0 && n > 1) {
        tracks[i].scroll.style.height = Math.round(fh + (n - 1) * fh * 0.91) + 'px';
        tracks[i].pinH = pin.offsetHeight;
      }
    }
    if (!reduceMotion) update();
  }

  /* Reduced motion: lay the sections out, park every track at the first
     photograph, and never attach a scroll listener. No scroll-linked
     translation of any kind. */
  if (reduceMotion) { measure(); return; }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', measure);
  window.addEventListener('orientationchange', measure);
  /* Images settling changes the pin's height, so re-measure once loaded. */
  window.addEventListener('load', measure);
  measure();
})();
