(function () {
  'use strict';

  // Order: NEWEST FIRST. Index 0 is the active issue on first load.
  // Dates for 80 and 81 marked TBD — patch once owner confirms publication months.
  const NEWSLETTER_ISSUES = [
    {
      number: '८२',
      numberEn: '82',
      dateMr: 'मे २०२६',
      dateEn: 'May 2026',
      coverWebp: 'images/newsletters/issue-82-cover.webp',
      coverWebp2x: 'images/newsletters/issue-82-cover@2x.webp',
      coverJpg: 'images/newsletters/issue-82-cover.jpg',
      pdfPath: 'pdfs/newsletters/issue-82.pdf',
      originalPath: 'pdfs/newsletters/issue-82-original.pdf',
      originalSizeMb: 40
    },
    {
      number: '८१',
      numberEn: '81',
      dateMr: 'दिवाळी विशेषांक · नोव्हेंबर २०२५',
      dateEn: 'Diwali Special · November 2025',
      coverWebp: 'images/newsletters/issue-81-cover.webp',
      coverWebp2x: 'images/newsletters/issue-81-cover@2x.webp',
      coverJpg: 'images/newsletters/issue-81-cover.jpg',
      pdfPath: 'pdfs/newsletters/issue-81.pdf',
      originalPath: 'pdfs/newsletters/issue-81-original.pdf',
      originalSizeMb: 10
    },
    {
      number: '८०',
      numberEn: '80',
      dateMr: 'मे २०२५',
      dateEn: 'May 2025',
      coverWebp: 'images/newsletters/issue-80-cover.webp',
      coverWebp2x: 'images/newsletters/issue-80-cover@2x.webp',
      coverJpg: 'images/newsletters/issue-80-cover.jpg',
      pdfPath: 'pdfs/newsletters/issue-80.pdf',
      originalPath: 'pdfs/newsletters/issue-80-original.pdf',
      originalSizeMb: 6
    }
  ];

  const root = document.querySelector('.coverflow');
  if (!root) return;

  const track = root.querySelector('[data-track]');
  const dotsContainer = root.querySelector('[data-dots]');
  const prevBtn = root.querySelector('[data-nav-prev]');
  const nextBtn = root.querySelector('[data-nav-next]');
  const metaTarget = document.querySelector('[data-meta-target]');
  const pdfTarget = document.querySelector('[data-pdf-target]');
  const originalTarget = document.querySelector('[data-original-target]');

  let activeIndex = 0;
  const totalIssues = NEWSLETTER_ISSUES.length;

  NEWSLETTER_ISSUES.forEach(function (issue, i) {
    const item = document.createElement('a');
    item.className = 'cf-item';
    item.href = issue.pdfPath;
    item.target = '_blank';
    item.rel = 'noopener';
    item.setAttribute('data-index', i);
    item.setAttribute('aria-label',
      'Issue ' + issue.numberEn + ', ' + issue.dateEn + ' — open PDF');

    const picture = document.createElement('picture');
    const source = document.createElement('source');
    source.type = 'image/webp';
    source.srcset = issue.coverWebp + ' 1x, ' + issue.coverWebp2x + ' 2x';
    const img = document.createElement('img');
    img.src = issue.coverJpg;
    img.alt = 'Kishor Dnyanprakash Issue ' + issue.numberEn + ' cover, ' + issue.dateEn;
    img.loading = 'lazy';
    img.draggable = false;
    picture.appendChild(source);
    picture.appendChild(img);
    item.appendChild(picture);

    item.addEventListener('click', function (e) {
      const idx = parseInt(item.getAttribute('data-index'), 10);
      if (idx !== activeIndex) {
        e.preventDefault();
        setActive(idx);
      }
    });

    track.appendChild(item);
  });

  NEWSLETTER_ISSUES.forEach(function (issue, i) {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'coverflow-dot';
    dot.setAttribute('aria-label', 'Go to issue ' + issue.numberEn);
    dot.addEventListener('click', function () { setActive(i); });
    dotsContainer.appendChild(dot);
  });

  function setActive(newIndex) {
    // Modulo wrap — handles negative correctly (JS % preserves sign)
    activeIndex = ((newIndex % totalIssues) + totalIssues) % totalIssues;
    render();
  }

  function render() {
    const prevActiveIndex = parseInt(track.dataset.lastActive || '0', 10);
    const isWrap = Math.abs(activeIndex - prevActiveIndex) > 1;
    if (isWrap) {
      track.classList.add('is-wrap-snap');
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          track.classList.remove('is-wrap-snap');
        });
      });
    }
    track.dataset.lastActive = String(activeIndex);

    const items = track.querySelectorAll('.cf-item');
    items.forEach(function (item) {
      item.classList.remove('is-settled');
    });
    items.forEach(function (item, i) {
      item.setAttribute('data-delta', String(i - activeIndex));
    });

    const dots = dotsContainer.querySelectorAll('.coverflow-dot');
    dots.forEach(function (dot, i) {
      dot.classList.toggle('is-active', i === activeIndex);
    });

    const issue = NEWSLETTER_ISSUES[activeIndex];
    if (metaTarget) {
      metaTarget.innerHTML =
        'अंक ' + issue.number + '&nbsp;&nbsp;·&nbsp;&nbsp;' + issue.dateMr;
    }
    if (pdfTarget) {
      pdfTarget.href = issue.pdfPath;
    }
    if (originalTarget) {
      originalTarget.href = issue.originalPath;
      originalTarget.textContent =
        'Download print-quality original (' + issue.originalSizeMb + 'MB) ↓';
    }

    // Hairline cue under active fades in after settling (after the
    // longest transition: transform 720ms). setTimeout instead of
    // transitionend so it works on wrap-snap (transitions disabled).
    const newActive = track.querySelector('.cf-item[data-delta="0"]');
    if (newActive) {
      clearTimeout(window._cfSettleTimer);
      window._cfSettleTimer = setTimeout(function () {
        newActive.classList.add('is-settled');
      }, 750);
    }
  }

  // Older issues stack to the RIGHT of active. Conventions:
  // - LEFT arrow / ArrowLeft → newer (-1) [array prev]
  // - RIGHT arrow / ArrowRight → older (+1) [array next]
  // - swipe LEFT (dx<0) → older (+1) [physical: content moves left, next from right comes in]
  // - swipe RIGHT (dx>0) → newer (-1)
  prevBtn.addEventListener('click', function () { setActive(activeIndex - 1); });
  nextBtn.addEventListener('click', function () { setActive(activeIndex + 1); });

  root.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      setActive(activeIndex - 1);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      setActive(activeIndex + 1);
    }
  });

  let touchStartX = 0;
  let touchStartY = 0;
  let touchActive = false;

  root.addEventListener('touchstart', function (e) {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    touchActive = true;
  }, { passive: true });

  root.addEventListener('touchmove', function (e) {
    if (!touchActive) return;
    const dx = e.touches[0].clientX - touchStartX;
    const dy = e.touches[0].clientY - touchStartY;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 10) {
      e.preventDefault();
    }
  }, { passive: false });

  root.addEventListener('touchend', function (e) {
    if (!touchActive) return;
    const dx = e.changedTouches[0].clientX - touchStartX;
    const threshold = 50;
    if (Math.abs(dx) > threshold) {
      if (dx < 0) {
        setActive(activeIndex + 1);
      } else {
        setActive(activeIndex - 1);
      }
    }
    touchActive = false;
  });

  render();
})();
