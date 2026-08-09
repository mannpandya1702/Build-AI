/**
 * Google Form enquiry embed.
 *
 * The embed URL is read from NEXT_PUBLIC_GOOGLE_FORM_EMBED_URL. Ship the
 * placeholder below until the client sends the real form; see README §Env.
 *
 * To find the entry IDs: open the live form, right-click → Inspect on a field,
 * and read the `name="entry.XXXXXXXXX"` attribute off the input. Paste them
 * into FORM_ENTRY_IDS. Until then the pre-qualifier still deep-links to the
 * form, it just does not carry the answers across.
 */

export const FALLBACK_FORM_URL =
  "https://docs.google.com/forms/d/e/1FAIpQLSf_RIWAAYA_PLACEHOLDER_REPLACE_ME/viewform";

/** PLACEHOLDER — replace with the field IDs from the real Riwaaya form. */
export const FORM_ENTRY_IDS = {
  eventType: "entry.1000001",
  eventDate: "entry.1000002",
} as const;

export function getFormEmbedUrl(): string {
  return process.env.NEXT_PUBLIC_GOOGLE_FORM_EMBED_URL?.trim() || FALLBACK_FORM_URL;
}

/** True while the placeholder is still in place — used to warn in dev only. */
export function isFormConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_GOOGLE_FORM_EMBED_URL?.trim();
  return Boolean(url) && !url!.includes("PLACEHOLDER");
}

function toEmbed(url: string): string {
  // Google accepts ?embedded=true on /viewform; normalise whatever we are given.
  const base = url.replace(/\/(edit|viewform).*$/, "/viewform");
  return `${base}?embedded=true`;
}

/**
 * Build the iframe src, optionally carrying the pre-qualifier answers.
 * Values are URL-encoded; empty answers are omitted rather than sent blank.
 */
export function buildFormUrl(
  prefill?: { eventType?: string; eventDate?: string },
  { embedded = true }: { embedded?: boolean } = {},
): string {
  const raw = getFormEmbedUrl();
  const url = embedded ? toEmbed(raw) : raw.replace(/\/(edit)$/, "/viewform");
  const params = new URLSearchParams();

  if (prefill?.eventType) params.set(FORM_ENTRY_IDS.eventType, prefill.eventType);
  if (prefill?.eventDate) params.set(FORM_ENTRY_IDS.eventDate, prefill.eventDate);

  if (![...params.keys()].length) return url;
  return `${url}${url.includes("?") ? "&" : "?"}${params.toString()}`;
}
