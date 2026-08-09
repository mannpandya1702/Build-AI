/**
 * Gallery items.
 *
 * There is no real photography yet. Every entry renders as a labelled
 * placeholder box at the stated aspect ratio — see components/media/ImageSlot.
 * When the client supplies photos, drop each file into /public/photography and
 * set `src` on the matching item; ImageSlot switches to next/image on its own.
 *
 * `alt` is written now, on purpose, so it does not get skipped later.
 */

export type GalleryCategory =
  | "Weddings"
  | "Mehndi & Haldi"
  | "Sangeet"
  | "Engagements"
  | "Corporate"
  | "Destination";

export type GalleryItem = {
  id: string;
  /** Slot name the client matches their file to. Rendered as data-slot. */
  slot: string;
  category: GalleryCategory;
  caption: string;
  /** CSS aspect-ratio string. Drives layout before any image exists. */
  aspect: string;
  alt: string;
  /** Optional — set once a real file lands in /public/photography. */
  src?: string;
  /** Home page editorial grid: how many columns this item spans at lg. */
  span?: 4 | 5 | 6 | 7 | 8;
  /** Home page editorial grid: nudges the item down for an asymmetric rhythm. */
  offset?: boolean;
  /** Home page editorial grid: include in the 8-image signature selection. */
  signature?: boolean;
};

export const galleryItems: GalleryItem[] = [
  {
    id: "g-01",
    slot: "signature-01-mandap-morning",
    category: "Weddings",
    caption: "Mandap, first light",
    aspect: "4 / 5",
    alt: "Mandap set for a morning wedding ceremony, photographed before guests arrive.",
    span: 5,
    signature: true,
  },
  {
    id: "g-02",
    slot: "signature-02-haldi-courtyard",
    category: "Mehndi & Haldi",
    caption: "Haldi in the courtyard",
    aspect: "3 / 2",
    alt: "Family applying haldi to the bride in a sunlit home courtyard.",
    span: 7,
    offset: true,
    signature: true,
  },
  {
    id: "g-03",
    slot: "signature-03-mehndi-hands",
    category: "Mehndi & Haldi",
    caption: "Mehndi, second hand",
    aspect: "1 / 1",
    alt: "Close view of mehndi being applied to the bride's second hand.",
    span: 4,
    signature: true,
  },
  {
    id: "g-04",
    slot: "signature-04-sangeet-stage",
    category: "Sangeet",
    caption: "Sangeet, before the doors",
    aspect: "16 / 10",
    alt: "Sangeet stage and seating lit and empty, half an hour before guests are let in.",
    span: 8,
    signature: true,
  },
  {
    id: "g-05",
    slot: "signature-05-taak-niche",
    category: "Weddings",
    caption: "Taak, lit for the evening",
    aspect: "3 / 4",
    alt: "A row of pointed taak niches in a wall, each holding a lit diya.",
    span: 4,
    offset: true,
    signature: true,
  },
  {
    id: "g-06",
    slot: "signature-06-engagement-table",
    category: "Engagements",
    caption: "Two families, one table",
    aspect: "3 / 2",
    alt: "Long dinner table laid for an engagement, both families seated together.",
    span: 6,
    signature: true,
  },
  {
    id: "g-07",
    slot: "signature-07-udaipur-arrival",
    category: "Destination",
    caption: "Arrival, Udaipur",
    aspect: "16 / 10",
    alt: "Guests arriving by boat at a lakeside property in Udaipur.",
    span: 6,
    offset: true,
    signature: true,
  },
  {
    id: "g-08",
    slot: "signature-08-vidaai",
    category: "Weddings",
    caption: "Vidaai",
    aspect: "4 / 5",
    alt: "The bride leaving with her family gathered at the car during vidaai.",
    span: 5,
    signature: true,
  },
  {
    id: "g-09",
    slot: "gallery-09-baraat-street",
    category: "Weddings",
    caption: "Baraat, on the street",
    aspect: "3 / 2",
    alt: "Baraat procession moving down a narrow street with dhol players ahead.",
  },
  {
    id: "g-10",
    slot: "gallery-10-mehndi-seating",
    category: "Mehndi & Haldi",
    caption: "Floor seating, mehndi",
    aspect: "4 / 5",
    alt: "Low floor seating with bolsters arranged for a mehndi function.",
  },
  {
    id: "g-11",
    slot: "gallery-11-sangeet-rehearsal",
    category: "Sangeet",
    caption: "Rehearsal, the afternoon before",
    aspect: "3 / 2",
    alt: "Cousins rehearsing a sangeet performance on an empty stage in daylight.",
  },
  {
    id: "g-12",
    slot: "gallery-12-corporate-stage",
    category: "Corporate",
    caption: "Annual day, stage set",
    aspect: "16 / 9",
    alt: "Corporate annual day stage with branded backdrop and seating in rows.",
  },
  {
    id: "g-13",
    slot: "gallery-13-goa-dinner",
    category: "Destination",
    caption: "Dinner by the water, Goa",
    aspect: "3 / 2",
    alt: "Long dinner tables set beside the water at dusk in Goa.",
  },
  {
    id: "g-14",
    slot: "gallery-14-ring-ceremony",
    category: "Engagements",
    caption: "Rings",
    aspect: "1 / 1",
    alt: "Ring exchange photographed close, with both families standing behind.",
  },
  {
    id: "g-15",
    slot: "gallery-15-jaipur-courtyard",
    category: "Destination",
    caption: "Courtyard, Jaipur",
    aspect: "4 / 5",
    alt: "Haveli courtyard in Jaipur dressed for an evening function.",
  },
  {
    id: "g-16",
    slot: "gallery-16-corporate-launch",
    category: "Corporate",
    caption: "Product launch, floor plan",
    aspect: "16 / 10",
    alt: "Product launch floor with demo stations and guests moving between them.",
  },
  {
    id: "g-17",
    slot: "gallery-17-pheras",
    category: "Weddings",
    caption: "Pheras",
    aspect: "3 / 2",
    alt: "Couple taking pheras around the fire with the priest and close family seated.",
  },
  {
    id: "g-18",
    slot: "gallery-18-haldi-hands",
    category: "Mehndi & Haldi",
    caption: "Turmeric, everywhere",
    aspect: "1 / 1",
    alt: "Hands covered in turmeric paste during a haldi ceremony.",
  },
];

export const galleryCategories: GalleryCategory[] = [
  "Weddings",
  "Mehndi & Haldi",
  "Sangeet",
  "Engagements",
  "Corporate",
  "Destination",
];

/** The 8 images used by the home page editorial grid, in order. */
export const signatureWork = galleryItems.filter((item) => item.signature);
