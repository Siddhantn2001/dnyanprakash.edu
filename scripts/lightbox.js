/* =========================================================================
   LIGHTBOX — shared full-screen photo viewer.

   Extracted verbatim in behaviour from the inline script that used to live in
   gallery.html, so both /gallery.html and the homepage strip run one
   implementation instead of two copies that drift apart.

   Usage: mark any container that holds photos with data-lightbox-group.
   Every `.gallery-img img` inside it becomes clickable, and prev/next walk
   that group only. /gallery.html now has ONE group around every photo, so the
   counter reads "n / 153" and navigation runs the whole set; the homepage
   strip is a separate group.

     <div class="gallery-all" data-lightbox-group> ... </div>

   The overlay markup is injected on first use, so no page needs to carry it.
   Styles live in scripts/gallery.css.

   Controls: click backdrop / X / Esc to close, arrows + swipe to navigate.
   ========================================================================= */
(function () {
  'use strict';

  var groups = document.querySelectorAll('[data-lightbox-group]');
  if (!groups.length) return;

  var lightbox = document.getElementById('lightbox');
  if (!lightbox) {
    lightbox = document.createElement('div');
    lightbox.className = 'lightbox';
    lightbox.id = 'lightbox';
    lightbox.setAttribute('aria-hidden', 'true');
    lightbox.setAttribute('role', 'dialog');
    lightbox.setAttribute('aria-modal', 'true');
    lightbox.setAttribute('aria-label', 'Photo viewer');
    lightbox.innerHTML =
      '<div class="lightbox-stage">' +
        '<img class="lightbox-img" alt="" />' +
        '<div class="lightbox-caption"></div>' +
        '<div class="lightbox-counter"></div>' +
      '</div>' +
      '<button type="button" class="lightbox-btn lightbox-close" aria-label="Close">&times;</button>' +
      '<button type="button" class="lightbox-btn lightbox-prev" aria-label="Previous photo">&#8249;</button>' +
      '<button type="button" class="lightbox-btn lightbox-next" aria-label="Next photo">&#8250;</button>';
    document.body.appendChild(lightbox);
  }

  var lbImg = lightbox.querySelector('.lightbox-img');
  var lbCap = lightbox.querySelector('.lightbox-caption');
  var lbCtr = lightbox.querySelector('.lightbox-counter');
  var btnClose = lightbox.querySelector('.lightbox-close');
  var btnPrev = lightbox.querySelector('.lightbox-prev');
  var btnNext = lightbox.querySelector('.lightbox-next');

  var list = [];
  var current = 0;
  var lastFocus = null;

  function render() {
    if (!list.length) return;
    current = ((current % list.length) + list.length) % list.length;
    var node = list[current];
    lbImg.src = node.src;
    lbImg.alt = node.alt || '';
    lbCap.textContent = node.alt || '';
    lbCtr.textContent = (current + 1) + ' / ' + list.length;
  }
  function open(imgs, idx) {
    list = imgs;
    current = idx;
    lastFocus = document.activeElement;
    render();
    lightbox.classList.add('is-open');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.classList.add('lightbox-open');
    btnClose.focus();
  }
  function close() {
    lightbox.classList.remove('is-open');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('lightbox-open');
    lbImg.src = '';
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  function prev() { current--; render(); }
  function next() { current++; render(); }

  Array.prototype.forEach.call(groups, function (group) {
    group.addEventListener('click', function (e) {
      var img = e.target.closest('.gallery-img img');
      if (!img) return;
      /* Rebuilt at click time, so tiles rendered later are included. */
      var imgs = Array.prototype.slice.call(group.querySelectorAll('.gallery-img img'));
      /* Masonry fills its columns round-robin, so DOM order is not reading
         order. When the renderer has stamped data-lb-index, sort on it so
         next/prev walk the photos in the order they appear on screen. */
      if (imgs.length && imgs[0].hasAttribute('data-lb-index')) {
        imgs.sort(function (a, b) {
          return (+a.getAttribute('data-lb-index')) - (+b.getAttribute('data-lb-index'));
        });
      }
      var idx = imgs.indexOf(img);
      if (idx < 0) return;
      open(imgs, idx);
    });
  });

  btnClose.addEventListener('click', close);
  btnPrev.addEventListener('click', prev);
  btnNext.addEventListener('click', next);
  lightbox.addEventListener('click', function (e) {
    if (e.target === lightbox || e.target.classList.contains('lightbox-stage')) close();
  });
  document.addEventListener('keydown', function (e) {
    if (!lightbox.classList.contains('is-open')) return;
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowLeft') prev();
    else if (e.key === 'ArrowRight') next();
  });

  var touchX = null;
  lightbox.addEventListener('touchstart', function (e) {
    if (e.touches.length === 1) touchX = e.touches[0].clientX;
  }, { passive: true });
  lightbox.addEventListener('touchend', function (e) {
    if (touchX == null) return;
    var dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 50) { if (dx > 0) prev(); else next(); }
    touchX = null;
  });
})();
