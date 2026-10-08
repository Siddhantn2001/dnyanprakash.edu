/* =========================================================================
   STORY STACK — builds the image column for the homepage sticky-text
   sections from window.DP_STORY_STACKS.

   TWO LAYOUTS, ONE LIST.

   Desktop (>= 900px): a plain vertical stack. No JS drives it. The section
   is simply tall enough that the five images scroll past while the text
   column, which is position: sticky, stays pinned. There is no scroll
   listener, no fade and no auto-advance — the pin is pure CSS.

   Mobile (< 900px): a side-by-side sticky column does not exist at phone
   width, so the same five images become the site's existing swipeable
   carousel (scripts/news-carousel.js) — arrows visible without hover, dots
   tracking position, swipe. Same images, same order.

   The breakpoint is 900px because that is where .mission-stats-grid stops
   being two columns; below it the grid is already stacked, so a sticky
   text column would have nothing to sit beside.

   Both layouts are built once, at load. Which one is visible is decided by
   CSS, so a resize across the breakpoint needs no re-render and the
   carousel keeps its state.

   Slot 1 loads eagerly; every other slide is lazy. These three sections add
   12 images to a homepage that is already long, so the rest must not block.
   ========================================================================= */
(function () {
  'use strict';

  var DIR = 'images/story/';
  var mounts = document.querySelectorAll('[data-story-stack]');
  if (!mounts.length) return;

  var data = window.DP_STORY_STACKS;
  if (!data) {
    console.warn('[story-stack] window.DP_STORY_STACKS missing — is scripts/story-stacks.js loaded first?');
    return;
  }

  /* One <picture>. ratio drives the box so the column's rhythm comes from
     the real files, not a uniform crop. */
  function picture(photo, index, contained) {
    var stem = DIR + photo.base;
    var fig = document.createElement('figure');
    fig.className = 'story-slide';
    if (contained && photo.w && photo.h) {
      /* --ar drives BOTH the width and the aspect-ratio in CSS. Width must be
         definite, not auto: with width:auto the box reserves no space until the
         image decodes, so every lazy slide below the fold had zero height and
         the section collapsed — which left the sticky column nothing to travel
         against. A definite width makes the height reserve immediately. */
      fig.style.setProperty('--ar', (photo.w / photo.h).toFixed(4));
    }

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
    if (index > 0) img.loading = 'lazy';   // only the first slide is eager
    if (photo.w && photo.h) { img.width = photo.w; img.height = photo.h; }
    pic.appendChild(img);

    fig.appendChild(pic);
    return fig;
  }

  function buildStack(list) {
    var wrap = document.createElement('div');
    wrap.className = 'story-stack';
    list.forEach(function (p, i) { wrap.appendChild(picture(p, i, true)); });
    return wrap;
  }

  function buildCarousel(list, key, label) {
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
    /* Dots live INSIDE this carousel, unlike news/index.html where they are a
       sibling. The shared script looks inside first, so both work. */
    car.appendChild(dots);
    return car;
  }

  Array.prototype.forEach.call(mounts, function (mount) {
    var key = mount.getAttribute('data-story-stack');
    var list = data[key];
    if (!list || !list.length) {
      console.warn('[story-stack] no slots for "' + key + '"');
      return;
    }
    var label = mount.getAttribute('data-story-label') || key;
    mount.textContent = '';
    mount.appendChild(buildStack(list));
    var car = buildCarousel(list, key, label);
    mount.appendChild(car);
    if (window.DPCarousel) window.DPCarousel.init(car);
  });
})();
