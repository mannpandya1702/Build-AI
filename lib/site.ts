/**
 * Single source of truth for contact details, URLs and the WhatsApp deep link.
 * Everything a client would want to change without touching a component.
 */

export const site = {
  name: "Riwaaya",
  /** Used for canonical URLs, OG tags, sitemap and JSON-LD. */
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://riwaaya.in",
  tagline: "We design the small rituals, not just the big day.",
  description:
    "Riwaaya is a wedding and events studio in India. We plan weddings, mehndi and haldi, sangeet, engagements and private events around the rituals a family already keeps.",
  /** PLACEHOLDER — client to confirm the registered trading address. */
  address: {
    street: "Studio address to be confirmed",
    locality: "Bengaluru",
    region: "Karnataka",
    postalCode: "560001",
    country: "IN",
  },
  /** PLACEHOLDER — client to confirm coordinates for the contact map. */
  geo: { lat: 12.9716, lng: 77.5946 },
  email: "hello@riwaaya.in",
  cities: ["Bengaluru", "Jaipur", "Udaipur", "Goa", "Delhi NCR"],
  socials: [
    // PLACEHOLDER — swap in the real handles before launch.
    { label: "Instagram", href: "https://instagram.com/riwaaya" },
    { label: "Pinterest", href: "https://pinterest.com/riwaaya" },
    { label: "YouTube", href: "https://youtube.com/@riwaaya" },
  ],
} as const;

/** WhatsApp business line, digits only, country code included. */
export const WHATSAPP_NUMBER = "918352813340";

/** Human-readable form for display next to the link. */
export const WHATSAPP_DISPLAY = "+91 83528 13340";

export const DEFAULT_WHATSAPP_MESSAGE = "Hi Riwaaya, I'd like to plan an event.";

/**
 * Builds a wa.me link with a URL-encoded prefill.
 * Service pages pass their own message so the first line names the service.
 */
export function whatsappHref(message: string = DEFAULT_WHATSAPP_MESSAGE): string {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

export const nav = [
  { label: "Services", href: "/#services" },
  { label: "Work", href: "/gallery" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
] as const;
