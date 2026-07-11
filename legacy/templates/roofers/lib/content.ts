// lib/content.ts — typed access to content.json. src/demo/generate.ts writes this file per lead
// from real Places data; nothing here is invented. Shape mirrors DemoContent in src/demo/generate.ts.

import data from "../content.json";

export interface DemoReview {
  author: string;
  rating: number;
  text: string;
}

export interface DemoFaq {
  q: string;
  a: string;
}

export interface DemoTheme {
  id: string;
  // RGB channel triplets ("r g b") so Tailwind alpha modifiers work (see globals.css).
  palette: { brand: string; brandInk: string; ink: string; paper: string; paper2: string };
  fontPair: "bricolage" | "archivo" | "grotesk";
  // Skill-grounded looks name their exact fonts; layout resolves these by name and only falls back
  // to fontPair when absent (older content.json).
  displayFont?: string;
  bodyFont?: string;
  heroVariant: "photo" | "split" | "bold" | "frame" | "paper";
}

export interface DemoContent {
  placeId: string;
  businessName: string;
  city: string;
  state: string;
  phone: string | null;
  primaryService: string;
  heroSubline?: string | null;
  services: { name: string; blurb: string }[];
  reviews: DemoReview[];
  photos: { src: string; alt: string }[];
  heroPhoto: string | null;
  address: string;
  mapQuery: string;
  rating: number | null;
  reviewCount: number | null;
  brandColor: string;
  theme: DemoTheme;
  // Niche-need band (CLAUDE.md §5b): shown only when flagged on. For roofers this is the
  // storm-damage/insurance moment. The claim itself stays [NEEDS]-flagged for owner confirmation.
  stormBand: boolean;
  faq: DemoFaq[];
  needs: string[];
  // Demo-vs-final controls (spec §6.7). Absent on a legacy/final build => normal public page.
  // A demo build sets demo=true (watermark bar) and noindex=true (keep the preview out of search).
  demo?: boolean;
  watermark?: string | null;
  noindex?: boolean;
}

export const site = data as DemoContent;

/** True when this build is a watermarked demo preview (spec §6.7), not a final client site. */
export const isDemo = (): boolean => Boolean(site.demo);
/** The watermark line, or null. Only rendered when isDemo(). */
export const watermarkText = (): string | null => (site.demo ? site.watermark ?? null : null);
/** True when the build should carry a noindex robots directive (demos always do). */
export const isNoindex = (): boolean => Boolean(site.noindex);

/** Build a safe tel: href from a display phone number, or null if there is no number. */
export function telHref(phone: string | null): string | null {
  if (!phone) return null;
  const digits = phone.replace(/[^0-9+]/g, "");
  return digits.length >= 7 ? `tel:${digits}` : null;
}

/** Google Maps embed URL for a query string (name + address). No API key needed for the public embed. */
export function mapEmbedUrl(query: string): string {
  return `https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed`;
}
