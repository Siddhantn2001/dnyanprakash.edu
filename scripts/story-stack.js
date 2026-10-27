/* =========================================================================
   STORY PHOTOS — builds the photographs of the three homepage story
   sections from window.DP_STORY_STACKS (scripts/story-stacks.js).

     .story-grid
       .story-text     headline, paragraph, named link
       .story-media    (display: contents — its children join the grid)
         .story-lead   the slot marked lead: true, large
         .story-row    every other slot

   Phones: lead photo full width, then the text, then the row as a sideways
   swipe (scroll-snap, the next photo peeking in). Desktop: text and lead
   photo side by side, the row beneath across both columns. All of the
   arrangement is CSS (index.html, "Story sections").

   Nothing is pinned and nothing listens to scroll. The earlier version held
   the heading in a sticky frame while the photos travelled behind it; on a
   phone that took 7 screens and left the photos as slivers under the header
   (targeted upgrade, B3). Without this script the text still reads; only
   the photographs are missing.
   ========================================================================= */
(function () {
  'use strict';

  var DIR = 'images/story/';
  var mounts = document.querySelectorAll('[data-story-stack]');
  if (!mounts.length) return;

  var data = window.DP_STORY_STACKS;
  if (!data) {
    console.warn('[story] window.DP_STORY_STACKS missing — is scripts/story-stacks.js loaded first?');
    return;
  }

  /* Width descriptors, so each photo ships at the size it paints: the lead
     is the full phone width or half the 1200px column; row photos are 80% of
     a phone or a quarter of the column. */
  function picture(photo, cls, sizes) {
    var stem = DIR + photo.base;
    var WS = (window.DP_STORY_WIDTHS || {})[photo.base] || [];
    var set = function (ext) {
      return WS.length
        ? WS.map(function (w) { return stem + '-' + w + ext + ' ' + w + 'w'; }).join(', ')
        : stem + ext;
    };

    var fig = document.createElement('figure');
    fig.className = cls;
    var pic = document.createElement('picture');
    [['image/avif', '.avif'], ['image/webp', '.webp']].forEach(function (t) {
      var s = document.createElement('source');
      s.type = t[0]; s.sizes = sizes; s.srcset = set(t[1]);
      pic.appendChild(s);
    });
    var img = document.createElement('img');
    img.src = WS.length ? stem + '-' + WS[WS.length - 1] + '.jpg' : stem + '.jpg';
    img.sizes = sizes;
    img.srcset = set('.jpg');
    img.alt = photo.alt || '';
    img.decoding = 'async';
    img.loading = 'lazy';
    if (photo.w && photo.h) { img.width = photo.w; img.height = photo.h; }
    /* Optional focal point: cover crops around the centre. */
    if (photo.pos) img.style.objectPosition = photo.pos;
    pic.appendChild(img);
    fig.appendChild(pic);
    return fig;
  }

  Array.prototype.forEach.call(mounts, function (mount) {
    var key = mount.getAttribute('data-story-stack');
    var list = data[key];
    if (!list || !list.length) { console.warn('[story] no slots for "' + key + '"'); return; }

    var lead = list.filter(function (p) { return p.lead; })[0] || list[0];
    var rest = list.filter(function (p) { return p !== lead; });

    mount.textContent = '';
    mount.appendChild(picture(lead, 'story-lead', '(max-width: 1023px) 100vw, 580px'));

    if (rest.length) {
      var row = document.createElement('div');
      row.className = 'story-row';
      row.style.setProperty('--n', rest.length);
      /* A scrollable region must be reachable by keyboard and named. */
      row.setAttribute('role', 'region');
      row.setAttribute('tabindex', '0');
      row.setAttribute('aria-label', 'More photos: ' + (mount.getAttribute('data-story-label') || key));
      rest.forEach(function (p) { row.appendChild(picture(p, 'story-slide', '(max-width: 1023px) 80vw, 300px')); });
      mount.appendChild(row);
    }
  });
})();
