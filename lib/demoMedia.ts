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
/*
 * REMOVED 13 Aug 2026 — service-onsite-hero.jpg.
 *
 * The file carried another wedding company's watermark burnt into the image
 * (a logo, the name "Ayga Events" and a phone number) in the lower third. It
 * was small and dark and went unnoticed when the set was assembled, and it had
 * been live on the home signature grid and the on-site coordination service
 * page. Deleted from /public/demo and from CREDITS.json; the three slots that
 * pointed at it are remapped below.
 *
 * Every other file in the set was checked for burnt-in text, top and bottom
 * bands, at the same time. They are clean.
 */
const MAP: Record<string, string> = {
  // Hero — daylight, architecture, mid-distance, per the deck's photo direction.
  "hero-backdrop": "gallery-15-jaipur-courtyard",

  // Home signature grid
  "signature-01-mandap-morning": "gallery-17-pheras",
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

  // Wedding venues. Reused from the destination set — same caveat as above,
  // and these sit under a region heading rather than a single place name.
  // Picked for *spaces*, not people or food — on a venue page a close-up of
  // mehndi hands or a thali reads as the wrong business entirely — and all
  // five distinct, because they sit in one list on one page.
  //
  // The set has no Punjab or Chandigarh venue photograph. Commons was searched
  // for one; the candidates were a check-in queue of identifiable faces and a
  // named hotel's illuminated signage, neither of which belongs on a
  // commercial site. Chandigarh therefore gets the place-neutral hotel
  // interior rather than a wrong or unusable picture of the right city.
  "venue-hero": "destination-jaipur",
  "venue-chandigarh": "gallery-12-hospitality-desk",
  "venue-delhi-ncr": "about-studio-portrait",
  "venue-rajasthan": "gallery-15-jaipur-courtyard",
  "venue-hills": "destination-kasauli",
  "venue-coast": "destination-goa",

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
  "service-onsite-hero": "gallery-11-sangeet-rehearsal",
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
