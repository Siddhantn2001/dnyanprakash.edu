/* =========================================================================
   STORY STACKS — the slot list for the homepage sticky-text sections.

   Three sections on index.html pair a pinned text column with a scrolling
   column of images. This file is the only place those images are declared.
   Adding, removing or reordering a slide is a one-line edit here — never
   touch the markup in index.html.

   TO FILL A SLOT
     1. Drop the photo in  images/story/  named exactly after its slot:
          experiment-02.jpg   vision-04.jpg   action-05.jpg   ...
        (any format; the pipeline converts). The numbered placeholder
        currently sitting there shows which slot is which.
     2. Run the pipeline so it emits .jpg/.webp at 1x and 2x.
     3. Update that line's alt, w and h below. w/h are the TRUE pixel size
        of the 1x file — the stack sets each slide's aspect-ratio from them,
        and the varying ratios are what give the column its rhythm.

   Order is top to bottom down the page. Slot 1 shows first and is the only
   one that loads eagerly; everything below it lazy-loads.

   Keys match data-story-stack="..." in index.html.
   ========================================================================= */
window.DP_STORY_STACKS = {

  experiment: [
    { base: "experiment-01", alt: "An Experiment in Education — a moment from the Dnyanprakash community", w: 560, h: 995 },
    { base: "experiment-02", alt: "Children sitting on the classroom floor building words from picture and letter cards", w: 629, h: 540 },
    { base: "experiment-03", alt: "Students weighing guavas on a balance scale during a hands-on measurement lesson", w: 960, h: 540 },
    { base: "experiment-04", alt: "Students and teachers with a wheelbarrow of seed balls prepared for a tree-planting drive", w: 960, h: 540 },
    { base: "experiment-05", alt: "Students working the soil with hoes in the school vegetable plot", w: 720, h: 540 },
  ],

  vision: [
    { base: "vision-01", alt: "Dnyanprakash — a school moment from the campus", w: 304, h: 540 },
    { base: "vision-02", alt: "Slot 2 — awaiting photo", w: 560, h: 374 },
    { base: "vision-03", alt: "Slot 3 — awaiting photo", w: 432, h: 540 },
    { base: "vision-04", alt: "Slot 4 — awaiting photo", w: 560, h: 315 },
    { base: "vision-05", alt: "Slot 5 — awaiting photo", w: 540, h: 540 },
  ],

  action: [
    { base: "action-01", alt: "Learning through action — students engaged in a hands-on classroom activity", w: 560, h: 420 },
    { base: "action-02", alt: "Slot 2 — awaiting photo", w: 432, h: 540 },
    { base: "action-03", alt: "Slot 3 — awaiting photo", w: 560, h: 374 },
    { base: "action-04", alt: "Slot 4 — awaiting photo", w: 540, h: 540 },
    { base: "action-05", alt: "Slot 5 — awaiting photo", w: 560, h: 315 },
  ],

};
