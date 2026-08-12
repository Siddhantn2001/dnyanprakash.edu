/* ============================================================================
   apple-design.js — runtime layer for the Apple-design pass.
   Pairs with scripts/apple-design.css. See .claude/skills/apple-design/SKILL.md.

   Loaded last (defer) on every page, so every other script has already built
   its DOM by the time this runs — the coverflow items, the gallery tiles and
   the lightbox overlay all exist and can simply be enhanced in place.

   No libraries, no build step: everything here is hand-rolled vanilla JS, per
   the project's locked stack (CLAUDE.md §3).

   Exposes window.DPMotion so later phases share one spring implementation and
   one set of accessibility signals instead of each re-deriving them.

     PHASE 1 — shared accessibility signals + material capability detection
   ============================================================================ */
(function (global) {
  'use strict';

  /* --------------------------------------------------------------------------
     Accessibility signals (§14). Three INDEPENDENT preferences, queried live
     rather than snapshotted, because a visitor can flip any of them mid-session
     and every phase after this one branches on them.
     -------------------------------------------------------------------------- */
  function mq(query) {
    if (!global.matchMedia) return { matches: false, addEventListener: function () {} };
    return global.matchMedia(query);
  }

  var reducedMotion = mq('(prefers-reduced-motion: reduce)');
  var reducedTransparency = mq('(prefers-reduced-transparency: reduce)');
  var moreContrast = mq('(prefers-contrast: more)');

  /* Capability probe for backdrop-filter. The CSS handles this with @supports;
     the flag is here so JS-driven material work in later phases can skip
     animating a blur the browser will never paint. */
  var supportsBackdrop =
    global.CSS &&
    global.CSS.supports &&
    (global.CSS.supports('backdrop-filter', 'blur(1px)') ||
      global.CSS.supports('-webkit-backdrop-filter', 'blur(1px)'));

  var DPMotion = {
    get reducedMotion() {
      return reducedMotion.matches;
    },
    get reducedTransparency() {
      return reducedTransparency.matches;
    },
    get moreContrast() {
      return moreContrast.matches;
    },
    supportsBackdrop: !!supportsBackdrop,
    // Populated in Phase 4 — exported so the spring, the projection function
    // and the rubber-band curve are available to any later work rather than
    // being re-derived.
    Spring: null,
    project: null,
    rubberband: null,
    lightboxGesture: false,
  };

  /* Reflect the signals onto <html> so CSS can branch on browsers that do not
     yet implement prefers-reduced-transparency / prefers-contrast natively
     (Firefox has neither at time of writing). Phase 6 consumes these hooks. */
  function reflect() {
    var root = document.documentElement;
    root.classList.toggle('dp-reduced-motion', DPMotion.reducedMotion);
    root.classList.toggle('dp-reduced-transparency', DPMotion.reducedTransparency);
    root.classList.toggle('dp-more-contrast', DPMotion.moreContrast);
    root.classList.toggle('dp-no-backdrop', !DPMotion.supportsBackdrop);
  }

  [reducedMotion, reducedTransparency, moreContrast].forEach(function (m) {
    if (m.addEventListener) m.addEventListener('change', reflect);
    else if (m.addListener) m.addListener(reflect);
  });

  reflect();

  /* --------------------------------------------------------------------------
     PHASE 1 FOLLOW-UP — relocate the मराठी toggle out of the retired mobile
     utility strip and into the nav row.

     The strip is hidden below 769px (apple-design.css §1.1b). Its only content
     with no other home was this toggle, so it MOVES rather than disappearing:
     the existing #lang-toggle node is appended into the nav row beside the
     hamburger, which keeps scripts/lang-toggle.js's click handler, its
     site-root detection and its ?fallback=true behaviour intact. Cloning would
     have produced two toggles to keep in sync; moving produces one.

     apple-design.js is injected last, so lang-toggle.js has already wired the
     node by the time this runs — listeners travel with it.

     Above 769px the node is put back exactly where it came from, so desktop is
     byte-for-byte the layout it was before.
     -------------------------------------------------------------------------- */
  function setupLangToggleRelocation() {
    var toggle = document.getElementById('lang-toggle');
    if (!toggle) return;

    /* Anchor on the hamburger, NOT on a wrapper class.
       index.html wraps its nav row in .main-nav-inner; the other 48 pages wrap
       theirs in .container-main. Selecting .main-nav-inner therefore found
       nothing on every inner page and the toggle stayed behind in the hidden
       strip — invisible. [data-mobile-open] is the one element both layouts
       have in the same place, so it is the anchor. */
    var burger = document.querySelector('.site-header .main-nav [data-mobile-open]') ||
                 document.querySelector('.site-header [data-mobile-open]');
    if (!burger || !burger.parentNode) return;

    // Remember the exact original slot so desktop can be restored precisely.
    var homeParent = toggle.parentNode;
    var homeNext = toggle.nextSibling;

    var mobile = mq('(max-width: 768px)');
    var relocated = false;

    function apply() {
      if (mobile.matches && !relocated) {
        toggle.classList.add('dp-lang-in-nav');
        burger.parentNode.insertBefore(toggle, burger);
        relocated = true;
      } else if (!mobile.matches && relocated) {
        toggle.classList.remove('dp-lang-in-nav');
        if (homeParent) homeParent.insertBefore(toggle, homeNext);
        relocated = false;
      }
    }

    if (mobile.addEventListener) mobile.addEventListener('change', apply);
    else if (mobile.addListener) mobile.addListener(apply);
    apply();
  }

  /* --------------------------------------------------------------------------
     PHASE 3 — Press feedback on pointer-DOWN (§1 Response, §10 Gesture details).

     §1: "Respond on pointer-down, not on release. Highlight a button the instant
     it's pressed. Waiting for click/touch-up to show feedback feels dead."
     §10: "Tap: highlight on touch-DOWN (instant), commit on touch-UP. Add ~10px
     of hysteresis/hit padding around the target, and allow cancel-by-dragging-
     away and back."

     One delegated listener on the document rather than a listener per element:
     the gallery, the coverflow and the news carousel all inject their targets
     after load, and delegation covers them without re-binding.

     Deliberately NOT using setPointerCapture here. Capture would redirect the
     event stream away from the element and can interfere with a link's native
     activation; nothing in this feature needs the pointer once it has left the
     target — it only needs to know that it did. Phase 4's drag gestures are a
     different matter and do capture.

     Every listener is passive, so none of this can block scrolling. A finger
     that starts on a card and then scrolls fires pointercancel, which clears the
     pressed state — the card must not sit there looking held down.
     -------------------------------------------------------------------------- */
  var PRESSABLE = [
    'a[href]', 'button', 'summary', '[role="button"]',
    '.news-card', '.academics-card', '.meet-card', '.event-row',
    '.cf-item', '.gallery-img', '.coverflow-dot', '.news-carousel-dot',
  ].join(',');

  var SLOP = 10; // §10's ~10px of hysteresis around the target

  function setupPressFeedback() {
    var pressed = null; // { el, rect, inside }

    function mark(el) { el.classList.add('dp-pressed'); }
    function unmark(el) { if (el) el.classList.remove('dp-pressed'); }

    function end() {
      if (pressed) unmark(pressed.el);
      pressed = null;
    }

    document.addEventListener('pointerdown', function (e) {
      // Primary button / any touch or pen contact only.
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      var el = e.target.closest && e.target.closest(PRESSABLE);
      if (!el) return;
      if (el.hasAttribute('disabled') || el.getAttribute('aria-disabled') === 'true') return;
      // Inert "coming soon" links are styled pointer-events:none, but a parent
      // could still match — check the computed value rather than trusting markup.
      if (getComputedStyle(el).pointerEvents === 'none') return;

      end();
      pressed = { el: el, rect: el.getBoundingClientRect(), inside: true };
      el.classList.add('dp-pressable');
      mark(el);
    }, { passive: true });

    document.addEventListener('pointermove', function (e) {
      if (!pressed) return;
      var r = pressed.rect;
      // Hysteresis measured against the TARGET's bounds, not radially from the
      // touch-down point: "dragging away from the target" is what the user
      // perceives, and on a 340px card a radial test would cancel while the
      // finger is still comfortably on it.
      var inside =
        e.clientX >= r.left - SLOP && e.clientX <= r.right + SLOP &&
        e.clientY >= r.top - SLOP && e.clientY <= r.bottom + SLOP;
      if (inside === pressed.inside) return;
      pressed.inside = inside;
      if (inside) mark(pressed.el);   // dragged back — re-arm (§10)
      else unmark(pressed.el);
    }, { passive: true });

    ['pointerup', 'pointercancel', 'contextmenu', 'dragstart'].forEach(function (ev) {
      document.addEventListener(ev, end, { passive: true });
    });
    window.addEventListener('blur', end);

    /* NOT bound to 'scroll'. An earlier cut was, as belt-and-braces for a touch
       turning into a scroll — and it made the press state fire-and-vanish:
       any scroll event cancelled it, including momentum still settling from a
       previous flick, so touching a card while the page was gliding killed the
       highlight instantly. Event trace: scroll@8910 -> pointerdown@8933 ->
       pressed -> cleared by the next settling scroll tick.

       pointercancel is the correct and sufficient signal — every engine fires
       it for a touch pointer the moment the browser takes the gesture over for
       scrolling — and the pointermove hysteresis above is the backstop. */
  }

  /* ==========================================================================
     PHASE 4 — A vanilla spring (§4 Behavior over animation).

     Apple deliberately replaced the physics triplet (mass/stiffness/damping)
     with two designer-facing parameters, and this uses the same two:

       response  seconds to reach the target. NOT a duration — a spring has no
                 fixed duration; its settle time emerges from the parameters.
       damping   damping ratio. 1.0 = critically damped, no overshoot.
                 < 1.0 overshoots and oscillates. Lower = bouncier.

     Integrated numerically (semi-implicit Euler) rather than solved in closed
     form, because that is what makes the two properties the skill cares most
     about fall out for free:

       §3 INTERRUPTIBLE — re-targeting mid-flight is just assigning .target;
          position and velocity carry straight through, so there is no jump and
          no velocity discontinuity ("brick wall") on a reversal.
       §5 VELOCITY HANDOFF — the gesture's release velocity is assigned
          directly as the spring's initial velocity, so there is no seam
          between dragging and animating.

     dt is clamped and sub-stepped: a backgrounded tab returns one enormous
     frame, and an unclamped explicit integrator diverges on it.
     ========================================================================== */
  function Spring(opts) {
    opts = opts || {};
    this.value = opts.from || 0;
    this.target = opts.from || 0;
    this.velocity = 0;
    this.response = opts.response || 0.4;
    this.damping = opts.damping == null ? 1 : opts.damping;
    this.onUpdate = opts.onUpdate || function () {};
    this.onRest = opts.onRest || function () {};
    this._raf = 0;
    this._last = 0;
    this._running = false;
  }

  Spring.prototype._tick = function (now) {
    var dt = Math.min((now - this._last) / 1000, 1 / 30); // clamp: tab-switch guard
    this._last = now;

    var omega = (2 * Math.PI) / this.response;
    var k = omega * omega;
    var c = 2 * this.damping * omega;

    // Sub-step for stability at high stiffness / low frame rate.
    var steps = Math.max(1, Math.ceil(dt / (1 / 240)));
    var h = dt / steps;
    for (var i = 0; i < steps; i++) {
      var a = -k * (this.value - this.target) - c * this.velocity;
      this.velocity += a * h;
      this.value += this.velocity * h;
    }

    this.onUpdate(this.value);

    // Rest test in both position and velocity — a spring that has reached the
    // target at speed has not settled.
    if (Math.abs(this.value - this.target) < 0.05 && Math.abs(this.velocity) < 0.5) {
      this.value = this.target;
      this.velocity = 0;
      this.onUpdate(this.value);
      this._running = false;
      this.onRest();
      return;
    }
    this._raf = global.requestAnimationFrame(this._tick.bind(this));
  };

  Spring.prototype.start = function () {
    if (this._running) return;
    this._running = true;
    this._last = global.performance ? performance.now() : Date.now();
    this._raf = global.requestAnimationFrame(this._tick.bind(this));
  };

  /* Re-target mid-flight. Velocity is NOT reset — that is the whole point
     (§3: "when a gesture reverses, blend velocity, don't hard-cut it"). */
  Spring.prototype.to = function (target, velocity, opts) {
    this.target = target;
    if (velocity != null) this.velocity = velocity;
    if (opts) {
      if (opts.response != null) this.response = opts.response;
      if (opts.damping != null) this.damping = opts.damping;
    }
    if (DPMotion.reducedMotion) {   // §14: no spring, no overshoot
      this.stop();
      this.value = target;
      this.velocity = 0;
      this.onUpdate(this.value);
      this.onRest();
      return;
    }
    this.start();
  };

  /* Stop where it is. The CURRENT value survives, which is what a new gesture
     needs to take over from (§3: "always animate from the presentation value,
     never the target value"). */
  Spring.prototype.stop = function () {
    if (this._raf) global.cancelAnimationFrame(this._raf);
    this._raf = 0;
    this._running = false;
    this.velocity = 0;
  };

  Spring.prototype.set = function (v) {
    this.value = v;
    this.onUpdate(v);
  };

  /* §6 Momentum projection — where a flick is GOING, not where it was released.
     Apple's exact function from the Designing Fluid Interfaces sample code.
     Note this is the exponential-decay form; the physics-textbook v²/(2·decel)
     is NOT what Apple ships. */
  function project(initialVelocity, decelerationRate) {
    var d = decelerationRate == null ? 0.998 : decelerationRate;
    return ((initialVelocity / 1000) * d) / (1 - d);
  }

  /* §9 Rubber-banding — progressive resistance, never a hard stop. */
  function rubberband(overshoot, dimension, constant) {
    var c = constant == null ? 0.55 : constant;
    return (overshoot * dimension * c) / (dimension + c * Math.abs(overshoot));
  }

  /* A short position/time history — §2 asks for velocity at release, and the
     single last pointermove is far too noisy to give it. */
  function VelocityTracker() {
    this.samples = [];
  }
  VelocityTracker.prototype.add = function (x, t) {
    this.samples.push({ x: x, t: t });
    if (this.samples.length > 6) this.samples.shift();
  };
  VelocityTracker.prototype.velocity = function () {
    var s = this.samples;
    if (s.length < 2) return 0;
    var last = s[s.length - 1];
    // Walk back to the newest sample at least 30ms old — long enough to be
    // stable, short enough to still be "the velocity at release".
    var ref = s[0];
    for (var i = s.length - 2; i >= 0; i--) {
      ref = s[i];
      if (last.t - s[i].t >= 30) break;
    }
    var dt = (last.t - ref.t) / 1000;
    if (dt <= 0) return 0;
    return (last.x - ref.x) / dt; // px/s
  };
  VelocityTracker.prototype.reset = function () {
    this.samples.length = 0;
  };

  var FLICK = 300; // px/s above which the gesture counts as a throw (§4)

  /* A drag that ends on a clickable element still synthesises a click. Both
     gesture surfaces here sit on top of click handlers that would then override
     the gesture entirely:

       .cf-item  is an <a href="…pdf" target="_blank"> AND carries a
                 tap-to-select handler calling setActive(itsOwnIndex) — so a
                 swipe committed to issue N was immediately overwritten by the
                 cover that happened to be under the finger, or opened a PDF.
       lightbox  closes on any click landing on the backdrop or the stage — so
                 swiping to the next photo CLOSED the viewer.

     Measured before the fix: a flick that correctly called setActive(4) (→ 1
     after the wrap) ended on index 2, because the synthetic click landed after
     it. So: after any gesture that actually moved, swallow exactly one click in
     the capture phase. The timeout clears the trap if no click follows (a
     release outside any clickable child). */
  function swallowNextClick(el) {
    function swallow(e) {
      e.preventDefault();
      e.stopPropagation();
      cleanup();
    }
    function cleanup() {
      el.removeEventListener('click', swallow, true);
      clearTimeout(timer);
    }
    var timer = setTimeout(cleanup, 400);
    el.addEventListener('click', swallow, true);
  }

  /* --------------------------------------------------------------------------
     4.1 — Newsletter coverflow: 1:1 drag, velocity handoff, momentum projection.

     Before: touchend compared total dx against a fixed 50px threshold and
     called setActive. The whole gesture was discarded — no tracking, no
     velocity, no interruption, and a 720ms fixed-duration CSS transition to
     land (§4: "a pre-scripted, fixed-duration animation can't respond to new
     input").
     -------------------------------------------------------------------------- */
  function setupCoverflowGesture() {
    var root = document.querySelector('.coverflow');
    if (!root || !root.dpCarousel) return;
    var track = root.querySelector('[data-track]');
    if (!track) return;

    var api = root.dpCarousel;
    // Tells newsletter-carousel.js to stand its legacy threshold swipe down.
    DPMotion.coverflowGesture = true;

    var drag = new Spring({
      response: 0.4,
      damping: 1,
      onUpdate: function (v) {
        track.style.setProperty('--cf-drag', v.toFixed(2) + 'px');
      },
    });

    /* Distance between adjacent cover centres: the CSS places delta ±1 at
       translateX(±85%) of the item's own width.

       offsetWidth, NOT getBoundingClientRect().width — the covers carry
       per-delta scale transforms (1.0 active, 0.84 adjacent, 0.68 distant) and
       a client rect includes them. Measuring the first item in DOM order
       therefore returned a different step depending on which issue happened to
       be active: 218px when it was centred, 151px when it had scaled down.
       offsetWidth is the untransformed layout width. */
    function step() {
      var item = track.querySelector('.cf-item');
      var w = item ? item.offsetWidth : root.offsetWidth * 0.78;
      return w * 0.85;
    }

    var tracker = new VelocityTracker();
    var active = false;
    var startX = 0;
    var startY = 0;
    var base = 0;
    var axisLocked = null; // null | 'x' | 'y'

    root.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      active = true;
      axisLocked = null;
      // §3: take over from the PRESENTATION value, not the target.
      drag.stop();
      base = drag.value;
      startX = e.clientX;
      startY = e.clientY;
      tracker.reset();
      tracker.add(e.clientX, e.timeStamp);
      track.classList.add('is-dragging');
    });

    root.addEventListener('pointermove', function (e) {
      if (!active) return;
      var dx = e.clientX - startX;
      var dy = e.clientY - startY;

      /* §10: detect the plausible gestures in parallel and commit once intent
         is clear. Below 10px nothing is decided; past it, a mostly-vertical
         move belongs to the page scroll and we bow out entirely. */
      if (axisLocked === null) {
        if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return;
        axisLocked = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
        if (axisLocked === 'y') {
          active = false;
          track.classList.remove('is-dragging');
          return;
        }
        root.setPointerCapture && root.setPointerCapture(e.pointerId);
      }

      tracker.add(e.clientX, e.timeStamp);

      /* §9 rubber-band: 1:1 within one cover of travel, progressive resistance
         past it. The carousel wraps, so there is no first/last edge to resist —
         what this resists is dragging further than one commit can consume,
         which is what keeps a long swipe from feeling unbounded. */
      var s = step();
      var raw = base + dx;
      var out = Math.abs(raw) - s;
      var val = raw;
      if (out > 0) {
        val = Math.sign(raw) * (s + rubberband(out, s));
      }
      drag.set(val);

      /* §8 HINT IN THE DIRECTION OF THE GESTURE. "Humans predict a final state
         from a trajectory — intermediate motion should telegraph where things
         are going." Control Center's modules "grow up and out toward your
         finger"; here the cover you are pulling toward brightens and sharpens
         in proportion to how far you have pulled, so the outcome is legible
         before you let go rather than only after. */
      var progress = Math.min(1, Math.abs(val) / s);
      track.style.setProperty('--cf-progress', progress.toFixed(3));
      track.classList.toggle('is-drag-left', val < 0);
      track.classList.toggle('is-drag-right', val > 0);

      if (e.cancelable) e.preventDefault();
    }, { passive: false });

    function release(e) {
      if (!active) return;
      active = false;
      track.classList.remove('is-dragging', 'is-drag-left', 'is-drag-right');
      track.style.setProperty('--cf-progress', '0');
      if (axisLocked !== 'x') return;

      // The gesture moved, so the click it is about to synthesise is not a tap.
      swallowNextClick(root);

      var v = tracker.velocity();
      var s = step();

      /* §6: land on the cover the flick is HEADED for, not the nearest one to
         the release point. A small fast flick therefore throws a full cover;
         a long slow drag that stops short springs back. */
      var projected = drag.value + project(v);

      /* Cap the throw at half the collection. This carousel wraps, so past
         count/2 steps the shorter route is the OTHER direction and the throw
         lands somewhere the gesture never pointed. With 3 issues a hard flick
         projects ~768px ≈ 3.5 covers; uncapped (or capped at a flat ±2) that
         resolved to index +2, which with the wrap is index −1 — the carousel
         visibly went BACKWARDS against the swipe. Measured: flick left,
         0 → 2. Half-collection is the largest cap for which direction stays
         unambiguous. */
      var maxSteps = Math.max(1, Math.floor((api.count - 1) / 2));
      var steps = Math.max(-maxSteps, Math.min(maxSteps, -Math.round(projected / s)));

      // Small permanent diagnostic — the release maths is the part of this
      // phase most likely to need retuning, and it is invisible from the DOM.
      DPMotion.lastGesture = {
        surface: 'coverflow', dx: Math.round(drag.value), v: Math.round(v),
        projected: Math.round(projected), step: Math.round(s), steps: steps,
        from: api.index,
      };

      if (steps !== 0) {
        api.setActive(api.index + steps);
        /* Absorb the index change into the drag offset in the same frame, so
           the newly-active cover keeps rendering exactly where the finger left
           it and springs home from there — §3's presentation value again. */
        drag.set(drag.value + steps * s);
      }

      /* §4: bounce ONLY because a flick preceded this. A cover released from a
         slow drag settles critically damped; one that was thrown overshoots
         very slightly, which is what makes the throw feel physical. */
      /* §11 will-change lifecycle: the hint stays up while the spring settles,
         then comes down. A permanent hint keeps a compositor layer alive for
         the life of the page, on exactly the devices least able to spare it. */
      track.classList.add('is-settling');
      drag.onRest = function () {
        track.classList.remove('is-settling');
      };

      var flicked = Math.abs(v) > FLICK;
      drag.to(0, v, {
        response: flicked ? 0.3 : 0.4,
        damping: flicked ? 0.8 : 1,
      });
    }

    root.addEventListener('pointerup', release);
    root.addEventListener('pointercancel', release);
  }

  /* --------------------------------------------------------------------------
     4.2 — Lightbox: the same treatment.

     Before: touchend compared dx against 50px and swapped the image with NO
     animation at all — the photo simply changed.
     -------------------------------------------------------------------------- */
  function setupLightboxGesture() {
    var lightbox = document.getElementById('lightbox');
    if (!lightbox || !lightbox.dpLightbox) return;
    var stage = lightbox.querySelector('.lightbox-stage');
    if (!stage) return;

    var api = lightbox.dpLightbox;
    DPMotion.lightboxGesture = true; // tells lightbox.js to stand its fallback down

    var drag = new Spring({
      response: 0.4,
      damping: 1,
      onUpdate: function (v) {
        stage.style.setProperty('--lb-drag', v.toFixed(2) + 'px');
      },
    });

    var tracker = new VelocityTracker();
    var active = false;
    var startX = 0;
    var startY = 0;
    var axisLocked = null;

    function width() {
      return lightbox.getBoundingClientRect().width || 375;
    }

    stage.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      // Let the close/prev/next chrome handle its own taps.
      if (e.target.closest('.lightbox-btn')) return;
      active = true;
      axisLocked = null;
      drag.stop();
      startX = e.clientX - drag.value;
      startY = e.clientY;
      tracker.reset();
      tracker.add(e.clientX, e.timeStamp);
    });

    stage.addEventListener('pointermove', function (e) {
      if (!active) return;
      var dx = e.clientX - startX;
      var dy = e.clientY - startY;
      if (axisLocked === null) {
        if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return;
        axisLocked = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
        if (axisLocked === 'y') { active = false; return; }
        stage.setPointerCapture && stage.setPointerCapture(e.pointerId);
      }
      tracker.add(e.clientX, e.timeStamp);
      drag.set(dx);
      if (e.cancelable) e.preventDefault();
    }, { passive: false });

    function release() {
      if (!active) return;
      active = false;
      if (axisLocked !== 'x') return;

      // Without this, the click synthesised at the end of a swipe lands on the
      // stage and lightbox.js closes the viewer mid-gesture.
      swallowNextClick(lightbox);

      var v = tracker.velocity();
      var w = width();
      var projected = drag.value + project(v);

      // Commit at a third of the viewport of PROJECTED travel — so a short
      // fast flick commits and a long slow drag that stalls does not.
      var dir = 0;
      if (projected <= -w * 0.32) dir = 1;       // swiped left  → next
      else if (projected >= w * 0.32) dir = -1;  // swiped right → prev

      if (dir !== 0) {
        if (dir === 1) api.next(); else api.prev();
        // Same presentation-value trick: the incoming photo starts where the
        // outgoing one was and springs into place.
        drag.set(drag.value + dir * w);
      }

      var flicked = Math.abs(v) > FLICK;
      drag.to(0, v, {
        response: flicked ? 0.3 : 0.4,
        damping: flicked ? 0.8 : 1,
      });
    }

    stage.addEventListener('pointerup', release);
    stage.addEventListener('pointercancel', release);
  }

  DPMotion.Spring = Spring;
  DPMotion.project = project;
  DPMotion.rubberband = rubberband;

  /* ==========================================================================
     PHASE 5 — Spatial consistency (§7 Symmetric paths / anchored origins,
     §8 Hint in the direction of the gesture).
     ========================================================================== */

  /* --------------------------------------------------------------------------
     5.1 — The lightbox opens FROM the tile that was tapped, and collapses back
     into it.

     §7: "If something disappears one way, we expect it to emerge from where it
     came" and "anchor interactions to their source — a menu, popover or sheet
     should originate from the element that triggered it."

     A FLIP: measure the thumbnail (first), measure the opened viewer (last),
     apply the inverse transform so the viewer starts sitting exactly on the
     thumbnail, then release it to identity. On close the same transform is
     re-applied, so the exit retraces the entry — the symmetric path §7 asks for
     rather than a generic fade to centre.

     Driven off a class MutationObserver rather than by patching lightbox.js's
     open/close: those are closure-scoped and reached from four different places
     (button, backdrop, Escape, and the group click handler), so watching the
     one piece of state they all agree on is both simpler and harder to break.
     -------------------------------------------------------------------------- */
  function setupLightboxOrigin() {
    var lightbox = document.getElementById('lightbox');
    if (!lightbox) return;
    var stage = lightbox.querySelector('.lightbox-stage');
    var img = lightbox.querySelector('.lightbox-img');
    if (!stage || !img) return;

    var sourceTile = null;

    // Capture phase, so the tile is recorded before lightbox.js opens on it.
    document.addEventListener('click', function (e) {
      var t = e.target.closest && e.target.closest('.gallery-img img');
      if (t) sourceTile = t;
    }, true);

    function transformFromTile(tile) {
      if (!tile) return null;
      var f = tile.getBoundingClientRect();
      var l = img.getBoundingClientRect();
      if (!l.width || !l.height || !f.width) return null;
      // Single scale factor — the thumbnail and the viewer show the SAME photo,
      // so their aspect ratios agree and scaling both axes independently would
      // only introduce a distortion the eye reads as a wobble.
      var s = f.width / l.width;
      var dx = f.left + f.width / 2 - (l.left + l.width / 2);
      var dy = f.top + f.height / 2 - (l.top + l.height / 2);
      return 'translate(' + dx.toFixed(1) + 'px,' + dy.toFixed(1) + 'px) scale(' + s.toFixed(4) + ')';
    }

    function flipOpen() {
      if (DPMotion.reducedMotion) return;            // §14 — no zoom, just the fade
      var from = transformFromTile(sourceTile);
      if (!from) return;
      stage.classList.add('dp-flip');                // suppresses the CSS transition
      stage.style.transform = from;
      stage.style.opacity = '0.4';
      // Two frames: paint the collapsed state, then release to identity.
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          stage.classList.remove('dp-flip');
          stage.classList.add('dp-flip-run');
          stage.style.transform = '';
          stage.style.opacity = '';
        });
      });
    }

    function flipClose() {
      if (DPMotion.reducedMotion) return;
      var to = transformFromTile(sourceTile);
      stage.classList.add('dp-flip-run', 'dp-flip-out');
      stage.style.transform = to || 'scale(0.92)';
      /* Deliberately NOT fading the stage on the way out. The exit runs the
         mirrored ease-IN curve (§7), which is back-loaded — most of the travel
         happens in the last third. Fading the photo at the same time as the
         backdrop meant the viewer was already invisible before it had moved
         much: sampled, the collapse only reached ~25% of the way to the
         thumbnail while still on screen. The backdrop fade alone carries the
         dismissal; the photo stays opaque and visibly returns to its tile. */

      /* Clean up on transitionend, NOT on a guessed timer. A fixed 340ms
         against a 300ms transition looks safe and is not: the collapse was
         still settling when the reset fired, so the viewer shrank to the
         thumbnail and then visibly REBOUNDED back to 203px before
         disappearing. Measured: w 232 -> 161 by +378ms, then back to 203 by
         +526ms. The timeout survives only as a fallback for the case where
         transitionend never fires (interrupted transition, reduced-motion
         flipped mid-flight). */
      var done = false;
      function cleanup() {
        if (done) return;
        done = true;
        stage.removeEventListener('transitionend', onEnd);
        clearTimeout(timer);
        /* Reset with the transition suppressed. Clearing the inline transform
           while a transition is live hands the element back to Phase 1's
           resting `transform: scale(0.94)`, which it then ANIMATES to — the
           viewer collapsed onto the thumbnail and then swelled back out to
           218px. (Invisible in practice, since the fade completes at 300ms,
           but only by luck.) dp-flip is transition:none, so this snaps. */
        stage.classList.add('dp-flip');
        stage.classList.remove('dp-flip-run', 'dp-flip-out');
        stage.style.transform = '';
        stage.style.opacity = '';
        /* Force a style flush WHILE transition:none is applied, then restore.
           Deferring the class removal to requestAnimationFrame is not enough:
           the callback can run before any style recalculation, so both changes
           coalesce into a single recalc in which dp-flip is already gone, the
           transition is live again, and the element animates from the
           thumbnail back out to Phase 1's resting scale(0.94) — a 58px
           rebound. Reading offsetWidth commits the suppressed state first. */
        void stage.offsetWidth;
        stage.classList.remove('dp-flip');
      }
      function onEnd(e) {
        if (e.target === stage && e.propertyName === 'transform') cleanup();
      }
      stage.addEventListener('transitionend', onEnd);
      var timer = setTimeout(cleanup, 600);
    }

    var wasOpen = lightbox.classList.contains('is-open');
    new MutationObserver(function () {
      var isOpen = lightbox.classList.contains('is-open');
      if (isOpen === wasOpen) return;
      wasOpen = isOpen;
      if (isOpen) flipOpen();
      else flipClose();
    }).observe(lightbox, { attributes: true, attributeFilter: ['class'] });
  }

  /* --------------------------------------------------------------------------
     5.2 — Desktop mega-panels originate from their nav item.

     §7: "Anchor interactions to their source — set transform-origin to the
     trigger, so the spatial relationship between button and content is
     obvious." The panel spans the full viewport width, so without this it grows
     from the centre of the screen regardless of which of the six items opened
     it, and all six openings look identical.
     -------------------------------------------------------------------------- */
  function setupMegaPanelOrigin() {
    var nav = document.querySelector('.site-header .main-nav');
    if (!nav) return;
    var items = nav.querySelectorAll('.nav-item');
    Array.prototype.forEach.call(items, function (item) {
      var link = item.querySelector('.nav-link');
      var panel = item.querySelector('.mega-panel');
      if (!link || !panel) return;
      function setOrigin() {
        var nr = nav.getBoundingClientRect();
        var lr = link.getBoundingClientRect();
        var x = lr.left + lr.width / 2 - nr.left;
        panel.style.setProperty('--mega-origin-x', x.toFixed(1) + 'px');
      }
      item.addEventListener('mouseenter', setOrigin);
      item.addEventListener('focusin', setOrigin);
    });
  }

  function init() {
    setupLangToggleRelocation();
    setupPressFeedback();
    setupCoverflowGesture();
    setupLightboxGesture();
    setupLightboxOrigin();
    setupMegaPanelOrigin();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  global.DPMotion = DPMotion;
})(window);
