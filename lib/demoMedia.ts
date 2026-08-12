/**
 * TEMPORARY DEMO MEDIA — delete this file to remove it all.
 *
 * The client's photography has not been shot yet. To let the layout be
 * reviewed with something in it, these slots point at freely-licensed
 * photographs in /public/demo (sources and licences in
 * /public/demo/CREDITS.json).
 *
 * These are NOT Riwaaya's work and must not survive to launch.
 *
 * To remove: set DEMO_MEDIA to false. Every ImageSlot falls straight back to
 * its labelled placeholder — no layout changes, because the aspect ratios are
 * unchanged either way. Then delete /public/demo and this file.
 */
export const DEMO_MEDIA = true;

/**
 * There are fewer usable photographs than there are slots, so some repeat.
 * That is fine for a demo and deliberately obvious on close reading.
 */
const MAP: Record<string, string> = {
  // Hero — daylight, architecture, mid-distance, per the deck's photo direction.
  "hero-backdrop": "gallery-15-jaipur-courtyard",

  // Home signature grid
  "signature-01-mandap-morning": "service-onsite-hero",
  "signature-02-haldi-courtyard": "gallery-18-haldi-hands",
  "signature-03-mehndi-hands": "signature-03-mehndi-hands",
  "signature-04-sangeet-stage": "gallery-11-sangeet-rehearsal",
  "signature-05-taak-niche": "signature-05-taak-niche",
  "signature-06-engagement-table": "gallery-14-ring-ceremony",
  "signature-07-udaipur-arrival": "gallery-15-jaipur-courtyard",
  "signature-08-vidaai": "about-studio-portrait",

  // Gallery
  "gallery-09-baraat-street": "gallery-09-baraat-street",
  "gallery-10-mehndi-seating": "gallery-10-mehndi-seating",
  "gallery-11-sangeet-rehearsal": "gallery-11-sangeet-rehearsal",
  "gallery-12-hospitality-desk": "gallery-12-hospitality-desk",
  "gallery-13-goa-dinner": "service-food-hero",
  "gallery-14-ring-ceremony": "gallery-14-ring-ceremony",
  "gallery-15-jaipur-courtyard": "gallery-15-jaipur-courtyard",
  "gallery-16-rooming-check-in": "gallery-12-hospitality-desk",
  "gallery-17-pheras": "gallery-17-pheras",
  "gallery-18-haldi-hands": "gallery-18-haldi-hands",

  // Destination weddings. These six are the only demo images that were chosen
  // to depict a specific named place, so they are the ones most likely to be
  // mistaken for the studio's own work — swap them first.
  "destination-hero": "destination-udaipur",
  "destination-udaipur": "destination-udaipur",
  "destination-jaipur": "destination-jaipur",
  "destination-jodhpur": "destination-jodhpur",
  "destination-kasauli": "destination-kasauli",
  "destination-rishikesh": "destination-rishikesh",
  "destination-goa": "destination-goa",

  // About
  "about-studio-portrait": "about-studio-portrait",

  // Service page heroes
  "service-planning-hero": "service-planning-hero",
  "service-budget-hero": "service-planning-hero",
  "service-timeline-hero": "service-planning-hero",
  "service-venue-hero": "gallery-15-jaipur-courtyard",
  "service-vendors-hero": "service-vendors-hero",
  "service-payments-hero": "service-planning-hero",
  "service-guests-hero": "gallery-12-hospitality-desk",
  "service-food-hero": "service-food-hero",
  "service-personnel-hero": "gallery-09-baraat-street",
  "service-onsite-hero": "service-onsite-hero",
  "service-post-event-hero": "about-studio-portrait",
};

/** Returns the demo image for a slot, or undefined when demo media is off. */
export function demoSrc(slot: string): string | undefined {
  if (!DEMO_MEDIA) return undefined;
  const file = MAP[slot];
  return file ? `/demo/${file}.jpg` : undefined;
}

/** Looping hero video, generated from the hero still. */
export const DEMO_HERO_VIDEO = DEMO_MEDIA ? "/demo/hero-loop.webm" : undefined;
export const DEMO_HERO_POSTER = DEMO_MEDIA ? "/demo/gallery-15-jaipur-courtyard.jpg" : undefined;
