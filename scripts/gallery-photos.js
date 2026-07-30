/* =========================================================================
   GALLERY PHOTOS — the single source of truth for school photos.

   Newest photos first. To add photos: PREPEND new entries at the top of the
   list. Both the homepage gallery strip and /gallery.html read from this
   file, so a photo added here appears at the top of BOTH automatically and
   pushes older ones down. Never hardcode gallery tiles anywhere else.

   Full workflow: see "Adding gallery photos" in CLAUDE.md.

   Fields
     base         filename stem in images/gallery/upkram/ — the renderer
                  derives .jpg/.webp and the @2x variants from it
     alt          alt text for the tile and the lightbox caption
     orientation  "landscape" | "portrait"
     w, h         true pixel size of the 1x file. The homepage masonry uses
                  these for exact aspect-ratio, which is what gives the grid
                  its organic rhythm (these photos run 4:3, 16:9 and 2.2:1
                  panoramas — not a uniform crop).
   ========================================================================= */
window.DP_GALLERY_PHOTOS = [
  { base: "upkram-079", alt: "Dnyanprakash school activity", orientation: "landscape", w: 900, h: 415 },
  { base: "upkram-078", alt: "Dnyanprakash school activity", orientation: "landscape", w: 900, h: 415 },
  { base: "upkram-077", alt: "Dnyanprakash school activity", orientation: "landscape", w: 900, h: 415 },
  { base: "upkram-076", alt: "Dnyanprakash school activity", orientation: "landscape", w: 900, h: 415 },
  { base: "upkram-075", alt: "Dnyanprakash school activity", orientation: "landscape", w: 900, h: 415 },
  { base: "upkram-074", alt: "Dnyanprakash school activity", orientation: "portrait", w: 405, h: 900 },
  { base: "upkram-073", alt: "Dnyanprakash school activity", orientation: "landscape", w: 900, h: 405 },
  { base: "upkram-072", alt: "Dnyanprakash school activity", orientation: "landscape", w: 900, h: 404 },
  { base: "upkram-071", alt: "Dnyanprakash school activity", orientation: "landscape", w: 900, h: 404 },
  { base: "upkram-070", alt: "Dnyanprakash school activity", orientation: "landscape", w: 900, h: 403 },
  { base: "upkram-069", alt: "Dnyanprakash school activity", orientation: "landscape", w: 900, h: 405 },
  { base: "upkram-068", alt: "Dnyanprakash school activity", orientation: "landscape", w: 900, h: 405 },
  { base: "upkram-067", alt: "Dnyanprakash school activity", orientation: "landscape", w: 900, h: 405 },
  { base: "upkram-066", alt: "Dnyanprakash school activity", orientation: "landscape", w: 900, h: 405 },
  { base: "upkram-065", alt: "Dnyanprakash school activity", orientation: "landscape", w: 900, h: 675 },
  { base: "upkram-064", alt: "Dnyanprakash school activity", orientation: "landscape", w: 900, h: 506 },
  { base: "upkram-063", alt: "Dnyanprakash school activity", orientation: "landscape", w: 900, h: 506 },
  { base: "upkram-062", alt: "Dnyanprakash school activity", orientation: "landscape", w: 900, h: 675 },
  { base: "upkram-061", alt: "Dnyanprakash school activity", orientation: "landscape", w: 900, h: 675 },
  { base: "upkram-060", alt: "Dnyanprakash school activity", orientation: "landscape", w: 900, h: 675 },
  { base: "upkram-059", alt: "Dnyanprakash school activity", orientation: "landscape", w: 900, h: 675 },
  { base: "upkram-058", alt: "Dnyanprakash school activity", orientation: "landscape", w: 900, h: 675 },
  { base: "upkram-057", alt: "Dnyanprakash school activity", orientation: "landscape", w: 900, h: 675 },
  { base: "upkram-056", alt: "Dnyanprakash school activity", orientation: "landscape", w: 900, h: 675 },
  { base: "upkram-055", alt: "Dnyanprakash school activity", orientation: "landscape", w: 900, h: 675 },
  { base: "upkram-054", alt: "Dnyanprakash school activity", orientation: "landscape", w: 900, h: 675 },
  { base: "upkram-053", alt: "Dnyanprakash school activity", orientation: "landscape", w: 900, h: 675 },
  { base: "upkram-052", alt: "Dnyanprakash school activity", orientation: "landscape", w: 900, h: 675 },
  { base: "upkram-051", alt: "Dnyanprakash school activity", orientation: "landscape", w: 900, h: 675 },
  { base: "upkram-050", alt: "Dnyanprakash school activity", orientation: "landscape", w: 900, h: 506 },
  { base: "upkram-049", alt: "Dnyanprakash school activity", orientation: "landscape", w: 900, h: 675 },
  { base: "upkram-048", alt: "Dnyanprakash school activity", orientation: "landscape", w: 900, h: 506 },
  { base: "upkram-047", alt: "Dnyanprakash school activity", orientation: "landscape", w: 900, h: 675 },
  { base: "upkram-046", alt: "Dnyanprakash school activity", orientation: "landscape", w: 900, h: 675 },
  { base: "upkram-045", alt: "Dnyanprakash school activity", orientation: "landscape", w: 900, h: 675 },
  { base: "upkram-044", alt: "Dnyanprakash school activity", orientation: "landscape", w: 900, h: 675 },
  { base: "upkram-043", alt: "Dnyanprakash school activity", orientation: "landscape", w: 900, h: 675 },
  { base: "upkram-042", alt: "Dnyanprakash school activity", orientation: "landscape", w: 900, h: 675 },
  { base: "upkram-041", alt: "Dnyanprakash school activity", orientation: "landscape", w: 900, h: 405 },
  { base: "upkram-040", alt: "Dnyanprakash school activity", orientation: "landscape", w: 900, h: 405 },
  { base: "upkram-039", alt: "Dnyanprakash school activity", orientation: "landscape", w: 900, h: 675 },
  { base: "upkram-038", alt: "Dnyanprakash school activity", orientation: "landscape", w: 900, h: 506 },
  { base: "upkram-037", alt: "Dnyanprakash school activity", orientation: "landscape", w: 900, h: 506 },
  { base: "upkram-036", alt: "Dnyanprakash school activity", orientation: "landscape", w: 900, h: 506 },
  { base: "upkram-035", alt: "Dnyanprakash school activity", orientation: "landscape", w: 900, h: 675 },
  { base: "upkram-034", alt: "Dnyanprakash school activity", orientation: "landscape", w: 900, h: 675 },
  { base: "upkram-033", alt: "Dnyanprakash school activity", orientation: "landscape", w: 900, h: 675 },
  { base: "upkram-032", alt: "Dnyanprakash school activity", orientation: "landscape", w: 900, h: 675 },
  { base: "upkram-031", alt: "Dnyanprakash school activity", orientation: "landscape", w: 900, h: 675 },
  { base: "upkram-030", alt: "Dnyanprakash school activity", orientation: "landscape", w: 900, h: 675 },
  { base: "upkram-029", alt: "Dnyanprakash school activity", orientation: "landscape", w: 900, h: 675 },
  { base: "upkram-028", alt: "Dnyanprakash school activity", orientation: "landscape", w: 900, h: 675 },
  { base: "upkram-027", alt: "Dnyanprakash school activity", orientation: "landscape", w: 900, h: 675 },
  { base: "upkram-026", alt: "Dnyanprakash school activity", orientation: "landscape", w: 900, h: 678 },
  { base: "upkram-025", alt: "Dnyanprakash school activity", orientation: "landscape", w: 900, h: 773 },
  { base: "upkram-024", alt: "Dnyanprakash school activity", orientation: "landscape", w: 900, h: 675 },
  { base: "upkram-023", alt: "Dnyanprakash school activity", orientation: "landscape", w: 900, h: 506 },
  { base: "upkram-022", alt: "Dnyanprakash school activity", orientation: "landscape", w: 900, h: 506 },
  { base: "upkram-021", alt: "Dnyanprakash school activity", orientation: "landscape", w: 900, h: 675 },
  { base: "upkram-020", alt: "Dnyanprakash school activity", orientation: "landscape", w: 900, h: 506 },
  { base: "upkram-019", alt: "Dnyanprakash school activity", orientation: "landscape", w: 900, h: 675 },
  { base: "upkram-018", alt: "Dnyanprakash school activity", orientation: "landscape", w: 900, h: 405 },
  { base: "upkram-017", alt: "Dnyanprakash school activity", orientation: "landscape", w: 900, h: 405 },
  { base: "upkram-016", alt: "Dnyanprakash school activity", orientation: "landscape", w: 900, h: 506 },
  { base: "upkram-015", alt: "Dnyanprakash school activity", orientation: "landscape", w: 900, h: 405 },
  { base: "upkram-014", alt: "Dnyanprakash school activity", orientation: "landscape", w: 900, h: 675 },
  { base: "upkram-013", alt: "Dnyanprakash school activity", orientation: "landscape", w: 900, h: 675 },
  { base: "upkram-012", alt: "Dnyanprakash school activity", orientation: "landscape", w: 900, h: 675 },
  { base: "upkram-011", alt: "Dnyanprakash school activity", orientation: "landscape", w: 900, h: 675 },
  { base: "upkram-010", alt: "Dnyanprakash school activity", orientation: "landscape", w: 900, h: 675 },
  { base: "upkram-009", alt: "Dnyanprakash school activity", orientation: "landscape", w: 900, h: 675 },
  { base: "upkram-008", alt: "Dnyanprakash school activity", orientation: "landscape", w: 900, h: 675 },
  { base: "upkram-007", alt: "Dnyanprakash school activity", orientation: "landscape", w: 900, h: 675 },
  { base: "upkram-006", alt: "Dnyanprakash school activity", orientation: "landscape", w: 900, h: 675 },
  { base: "upkram-005", alt: "Dnyanprakash school activity", orientation: "landscape", w: 900, h: 675 },
  { base: "upkram-004", alt: "Dnyanprakash school activity", orientation: "landscape", w: 900, h: 675 },
  { base: "upkram-003", alt: "Dnyanprakash school activity", orientation: "landscape", w: 900, h: 675 },
  { base: "upkram-002", alt: "Dnyanprakash school activity", orientation: "landscape", w: 900, h: 675 },
  { base: "upkram-001", alt: "Dnyanprakash school activity", orientation: "landscape", w: 900, h: 675 },
];

/* Folder every `base` above resolves against, relative to a root-level page. */
window.DP_GALLERY_DIR = "images/gallery/upkram/";
