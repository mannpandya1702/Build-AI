/**
 * Single source of truth for identity, contact details and the WhatsApp link.
 * Everything a client would want to change without touching a component.
 *
 * Positioning and voice come from the Riwaaya Brand Identity Deck (2026).
 */

export const site = {
  /** Short form, used in the wordmark and most copy. */
  name: "Riwaaya",
  /** Full signature lockup, per the deck. Used in the footer and JSON-LD. */
  legalName: "Riwaaya by Bhumi Sandhu",
  founder: "Bhumi Sandhu",
  /** Used for canonical URLs, OG tags, sitemap and JSON-LD. */
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://riwaaya.in",
  /** The deck's line. Kept verbatim. */
  tagline: "Weddings held in the old way, made new",
  positioning:
    "Riwaaya plans a small number of weddings each year for families who want the rituals taken seriously — and who would rather their celebration feel quietly theirs than loudly grand.",
  category: "Full-service wedding planning & hospitality",
  description:
    "Riwaaya by Bhumi Sandhu plans a small number of weddings each year — eleven lines of work, from the first roadmap to the final payment sheet, with a named person beside you the whole way.",
  /** PLACEHOLDER — the deck's social lockup reads Chandigarh; confirm the studio address. */
  address: {
    street: "Studio address to be confirmed",
    locality: "Chandigarh",
    region: "Chandigarh",
    postalCode: "160001",
    country: "IN",
  },
  /** PLACEHOLDER — Chandigarh city centre; confirm coordinates for the map. */
  geo: { lat: 30.7333, lng: 76.7794 },
  email: "hello@riwaaya.in",
  /** PLACEHOLDER — confirm the list of cities worked in. */
  cities: ["Chandigarh", "Kasauli", "Delhi NCR", "Jaipur", "Udaipur"],
  socials: [
    // PLACEHOLDER — the deck names @riwaaya; confirm before launch.
    { label: "Instagram", href: "https://instagram.com/riwaaya" },
    { label: "Pinterest", href: "https://pinterest.com/riwaaya" },
  ],
} as const;

/** WhatsApp business line, digits only, country code included. */
export const WHATSAPP_NUMBER = "918352813340";

/** Human-readable form for display next to the link. */
export const WHATSAPP_DISPLAY = "+91 83528 13340";

export const DEFAULT_WHATSAPP_MESSAGE = "Hi Riwaaya, I'd like to plan a wedding.";

/**
 * Builds a wa.me link with a URL-encoded prefill.
 * Service pages pass their own message so the first line names the service.
 */
export function whatsappHref(message: string = DEFAULT_WHATSAPP_MESSAGE): string {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

/** Labels follow the deck's own website draft. */
export const nav = [
  { label: "Approach", href: "/about" },
  { label: "Services", href: "/#services" },
  { label: "Weddings", href: "/gallery" },
  { label: "Enquire", href: "/contact" },
] as const;
