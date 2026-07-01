// lib/content.ts — typed access to content.json. src/demo/generate.ts writes this file per lead
// from real Places data; nothing here is invented. Shape mirrors DemoContent in src/demo/generate.ts.

import data from "../content.json";

export interface DemoReview {
  author: string;
  rating: number;
  text: string;
}

export interface DemoContent {
  placeId: string;
  businessName: string;
  city: string;
  state: string;
  phone: string | null;
  primaryService: string;
  services: string[];
  reviews: DemoReview[];
  photos: { src: string; alt: string }[];
  address: string;
  mapQuery: string;
  rating: number | null;
  reviewCount: number | null;
  brandColor: string;
  needs: string[];
}

export const site = data as DemoContent;

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
