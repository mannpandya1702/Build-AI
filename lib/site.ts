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
  /**
   * Other names the studio is searched by. Fed to JSON-LD alternateName —
   * "riwaaya" sits close to "riwaayat" and "riwaaz", so handing Google the
   * entity's alternate names consistently is what stops it autocorrecting the
   * brand (SEO plan, 15 Aug 2026).
   */
  alternateNames: ["Riwaaya by Bhumi Sandhu", "Riwaaya Weddings"],
  /** Used for canonical URLs, OG tags, sitemap and JSON-LD. */
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://riwaaya.in",
  /** The deck's line. Kept verbatim. */
  tagline: "Weddings held in the old way, made new",
  positioning:
    "Riwaaya plans a small number of weddings each year for families who want the rituals taken seriously — and who would rather their celebration feel quietly theirs than loudly grand.",
  category: "Full-service wedding planning & hospitality",
  description:
    "Luxury and destination wedding planner in Chandigarh, working across India. Eleven contracted lines of work, and the founder beside you throughout.",
  /**
   * The two search phrases the studio asked to rank for (13 Aug 2026). They are
   * composed into page titles and descriptions rather than repeated verbatim in
   * body copy — the deck's voice stays as written.
   */
  keyphrases: {
    destination: "destination wedding planner",
    luxury: "luxury wedding planner",
  },
  /** Confirmed by the studio, 13 Aug 2026. */
  address: {
    street: "D-231, 3rd & 4th Floor, Phase 8B (Sector 91)",
    locality: "Mohali",
    region: "Punjab",
    /**
     * UNCONFIRMED. Phase 8B / Sector 91 Mohali spans more than one PIN and the
     * studio did not send it, so it is left empty rather than guessed — the
     * JSON-LD omits the field when empty instead of publishing a wrong one.
     */
    postalCode: "",
    country: "IN",
  },
  /**
   * APPROXIMATE — Phase 8B, Mohali, to about 300m. Good enough for the contact
   * map to land on the right block; replace with the exact pin when the studio
   * sends a Google Maps link.
   */
  geo: { lat: 30.7046, lng: 76.6928 },
  email: "hello@riwaaya.in",
  /**
   * The studio works pan-India from a Chandigarh base (confirmed 13 Aug 2026).
   * Chandigarh leads because it is the home city and the one to rank locally
   * for; the rest are the destinations asked for most. Feeds JSON-LD areaServed.
   */
  baseCity: "Chandigarh",
  cities: [
    "Chandigarh",
    "Mohali",
    "Delhi NCR",
    "Udaipur",
    "Jaipur",
    "Jodhpur",
    "Jaisalmer",
    "Kasauli",
    "Shimla",
    "Mussoorie",
    "Dehradun",
    "Rishikesh",
    "Goa",
    "Mumbai",
    "Kerala",
  ],
  /** Confirmed handles, supplied by the studio 12 Aug 2026. */
  socials: [
    { label: "Instagram", href: "https://www.instagram.com/bhumisandhupvt" },
    { label: "Pinterest", href: "https://www.pinterest.com/bhumisandhu" },
  ],
} as const;

/**
 * WhatsApp business line, digits only, country code included.
 *
 * Updated 12 Aug 2026 on the studio's instruction. The site previously used
 * 918352813340, which came from the original brief; it is recorded here rather
 * than deleted in case both lines are live and the older one should be kept as
 * a second contact. Nothing renders it today.
 */
export const WHATSAPP_NUMBER = "919915909996";
export const PREVIOUS_ENQUIRY_NUMBER = "918352813340";

/** Human-readable form for display next to the link. */
export const WHATSAPP_DISPLAY = "+91 99159 09996";

export const DEFAULT_WHATSAPP_MESSAGE = "Hi Riwaaya, I'd like to plan a wedding.";

/**
 * Builds a wa.me link with a URL-encoded prefill.
 * Service pages pass their own message so the first line names the service.
 */
export function whatsappHref(message: string = DEFAULT_WHATSAPP_MESSAGE): string {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

/**
 * Labels follow the deck's own website draft, plus Venues — added 13 Aug 2026
 * when the studio asked for a venue page linked from the destinations page.
 */
export const nav = [
  { label: "Approach", href: "/about" },
  { label: "Services", href: "/#services" },
  { label: "Destinations", href: "/destination-weddings" },
  { label: "Venues", href: "/wedding-venues" },
  { label: "Weddings", href: "/gallery" },
  { label: "Enquire", href: "/contact" },
] as const;
