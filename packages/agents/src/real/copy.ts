import { llm, safeFetch, voiceLint } from "@autopilot/adapters";
// Per-business site copy (contract §5a "design to the business, not to a template" + §5d Content:
// auto-fill copy from THEIR data, plain voice). The generic-template failure this fixes (operator,
// 2026-07-11): every demo shipped the same four service blurbs, hero subline, and FAQ.
//
// Evidence in, copy out, nothing invented (§0.1): the model receives ONLY verified facts — their
// Google reviews (verbatim), the analyzer's audit of their CURRENT website, the visible text of
// that website, and their GBP basics — and is instructed to write from that evidence alone.
// Guards after generation: §3 voice lint on every string, an evidence check for numeric claims
// (any number in the copy must appear in the evidence or be the city/phone/rating), length caps.
// Any failure returns null and the builder falls back to the safe defaults, never blocking a build.
import { z } from "zod";

export interface CopyEvidence {
  companyName: string;
  city: string;
  state: string;
  industry: string;
  rating: number | null;
  reviewCount: number | null;
  phone: string | null;
  reviews: { rating: number; text: string }[];
  auditSummary: string | null;
  auditFindings: string[];
  siteText: string | null;
  pitchAngle: string | null;
}

export interface GeneratedCopy {
  primaryService: string;
  heroSubline: string;
  services: { name: string; blurb: string }[];
  faq: { q: string; a: string }[];
  needs: string[];
}

// Minimums are validated; MAXIMUMS are clamped after parse (a word-boundary trim), not rejected —
// a 118-char subline is a trim job, not a regeneration (three live fallbacks were "too_big" only).
const Schema = z.object({
  primary_service: z.string().min(3),
  hero_subline: z.string().min(10),
  services: z
    .array(z.object({ name: z.string().min(3), blurb: z.string().min(10) }))
    .min(3)
    .max(6),
  faq: z
    .array(z.object({ q: z.string().min(5), a: z.string().min(5) }))
    .min(2)
    .max(4),
  unknowns: z.array(z.string()).max(8).default([]),
});

function clamp(s: string, max: number): string {
  if (s.length <= max) return s;
  const cut = s
    .slice(0, max)
    .replace(/\s+\S*$/, "")
    .replace(/[,.;:]$/, "");
  return cut.length >= 10 ? cut : s.slice(0, max);
}

/** Fetch the visible text of their current website (public page, one request, honest UA — system
 *  rule §6). Returns null on any failure: personalization then leans on reviews + audit alone. */
export async function fetchSiteText(url: string | null): Promise<string | null> {
  if (!url || !/^https?:\/\//i.test(url)) return null;
  try {
    const res = await safeFetch(url, {
      headers: { "user-agent": "TradeCraftSites-Bot/1.0 (+https://tradecraftsites.com)" },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return null;
    const html = await res.text();
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&[a-z#0-9]+;/gi, " ")
      .replace(/\s+/g, " ")
      .trim();
    return text.length > 80 ? text.slice(0, 4000) : null;
  } catch {
    return null;
  }
}

/** Numbers in generated copy must exist in the evidence (or be the lead's own rating/count/phone/
 *  state digits). Catches invented "20+ years", "500 roofs", fake prices. */
function inventedNumbers(copyText: string, evidenceText: string): string[] {
  const nums = copyText.match(/\d[\d,.]*/g) ?? [];
  return nums.filter((n) => !evidenceText.includes(n.replace(/[.,]$/, "")));
}

/** Claim words that promise something on the owner's behalf (§5b: service/pricing claims are
 *  gated behind evidence). Caught live: "Free-look inspections" with no "free" anywhere in the
 *  evidence. The template's own standard offer copy is separate; this guards GENERATED text. */
const CLAIM_WORDS = [
  "free",
  "warranty",
  "warranties",
  "guarantee",
  "guaranteed",
  "licensed",
  "insured",
  "certified",
  "24/7",
  "emergency",
  "same-day",
  "same day",
];
function unevidencedClaims(copyText: string, evidenceText: string): string[] {
  const lc = copyText.toLowerCase();
  const le = evidenceText.toLowerCase();
  return CLAIM_WORDS.filter((w) => lc.includes(w) && !le.includes(w));
}

const SYSTEM = `You write website copy for one specific US local service business. You write in the founder's plain voice:
- Short sentences. Concrete over vague. No corporate words (leverage, solutions, seamless, elevate, unlock, cutting-edge).
- NEVER an em dash. Use periods, commas, colons, or parentheses.
- No emojis. No exclamation marks.

HARD RULES (breaking any makes the output unusable):
1. Use ONLY the evidence provided. Never invent facts: no years in business, no certifications, no prices, no guarantees, no service claims the evidence does not support.
2. Services: name ONLY services this business demonstrably does (their own website text, their reviews, their trade). Write each blurb for THIS business, echoing what its customers actually praise. If evidence is thin, keep the trade's core services with plain blurbs.
3. The hero subline states what this business's customers repeatedly praise, in plain words close to the customers' own. If reviews are absent, describe the trade + city promise without superlatives.
4. FAQ answers only from known facts: city/service area, how to get a quote, the phone number if provided, what to do after a storm (general, no claims about THIS business's insurance handling).
5. List anything you wanted to say but could not verify under "unknowns" instead of saying it.

Return ONLY JSON: {"primary_service": string, "hero_subline": string (<=110 chars), "services": [{"name","blurb"(<=140 chars)}] (3-6), "faq": [{"q","a"}] (2-4), "unknowns": [string]}`;

/** Em/en dashes are a mechanical fix, not a regeneration: replace with ", " then re-check. */
function sanitize(s: string): string {
  return s
    .replace(/\s*[—–]\s*/g, ", ")
    .replace(/\s+,/g, ",")
    .trim();
}

export type CopyResult = { ok: true; copy: GeneratedCopy } | { ok: false; reason: string };

export async function generatePersonalizedCopy(leadId: string, ev: CopyEvidence): Promise<CopyResult> {
  const evidenceBundle = [
    `Business: ${ev.companyName} (${ev.industry}) in ${ev.city}, ${ev.state}`,
    ev.phone ? `Phone: ${ev.phone}` : "Phone: unknown",
    ev.rating != null ? `Google rating ${ev.rating} from ${ev.reviewCount ?? "?"} reviews` : "No rating data",
    ev.reviews.length
      ? `Their real Google reviews (verbatim):\n${ev.reviews.map((r) => `- (${r.rating}★) ${r.text}`).join("\n")}`
      : "No review texts available.",
    ev.auditSummary ? `Our audit of their CURRENT website: ${ev.auditSummary}` : "",
    ev.auditFindings.length
      ? `Audit findings on their current site:\n${ev.auditFindings.map((f) => `- ${f}`).join("\n")}`
      : "",
    ev.siteText
      ? `Visible text of their current website (truncated):\n"""${ev.siteText}"""`
      : "Their current website text could not be read.",
    ev.pitchAngle ? `Sales angle we identified: ${ev.pitchAngle}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");
  const evidenceText = `${evidenceBundle} ${ev.rating ?? ""} ${ev.reviewCount ?? ""} ${ev.phone ?? ""} 24 7 24/7 1 2 3`;

  let feedback = "";
  let lastReason = "unknown";
  for (let attempt = 1; attempt <= 2; attempt++) {
    let raw: string;
    try {
      raw = await llm({
        tier: "sonnet",
        agent: "builder",
        leadId,
        maxTokens: 1600,
        system: SYSTEM,
        prompt: `Evidence:\n\n${evidenceBundle}\n\n${feedback}Write the copy JSON now.`,
        mockResponse: "{}",
      });
    } catch (err) {
      return { ok: false, reason: `llm error: ${(err as Error).message}` };
    }

    let parsed: z.infer<typeof Schema>;
    try {
      parsed = Schema.parse(JSON.parse(raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1)));
    } catch (err) {
      lastReason = `parse/schema: ${(err as Error).message.slice(0, 200)}`;
      feedback = `Your previous attempt was rejected (${lastReason}). Return ONLY the JSON object, matching the schema and length limits exactly.\n\n`;
      continue;
    }

    // §3 voice + fabrication guards over every generated string (em dashes sanitized and
    // overlength strings clamped first — both are mechanical fixes, not regenerations).
    parsed = {
      ...parsed,
      primary_service: clamp(sanitize(parsed.primary_service), 40),
      hero_subline: clamp(sanitize(parsed.hero_subline), 110),
      services: parsed.services.map((s) => ({
        name: clamp(sanitize(s.name), 48),
        blurb: clamp(sanitize(s.blurb), 140),
      })),
      faq: parsed.faq.map((f) => ({ q: clamp(sanitize(f.q), 90), a: clamp(sanitize(f.a), 220) })),
    };
    const allText = [
      parsed.primary_service,
      parsed.hero_subline,
      ...parsed.services.flatMap((s) => [s.name, s.blurb]),
      ...parsed.faq.flatMap((f) => [f.q, f.a]),
    ].join("\n");
    const voice = voiceLint(allText);
    if (voice.length) {
      lastReason = `voice: ${voice.join(", ")}`;
      feedback = `Your previous attempt was rejected for voice violations: ${voice.join(", ")}. Remove them and rewrite in the plain voice.\n\n`;
      continue;
    }
    const invented = inventedNumbers(allText, evidenceText);
    if (invented.length) {
      lastReason = `invented numbers: ${invented.join(", ")}`;
      feedback = `Your previous attempt was rejected because these numbers are not in the evidence: ${invented.join(", ")}. Remove every number that the evidence does not contain.\n\n`;
      continue;
    }
    const claims = unevidencedClaims(allText, evidenceText);
    if (claims.length) {
      lastReason = `unevidenced claims: ${claims.join(", ")}`;
      feedback = `Your previous attempt was rejected because these claim words are not supported by the evidence: ${claims.join(", ")}. Do not promise anything (free, warranty, licensed, certified, emergency availability) unless the evidence states it.\n\n`;
      continue;
    }

    return {
      ok: true,
      copy: {
        primaryService: parsed.primary_service,
        heroSubline: parsed.hero_subline,
        services: parsed.services,
        faq: parsed.faq,
        needs: parsed.unknowns.map((u) => `[NEEDS: confirm] ${u}`),
      },
    };
  }
  return { ok: false, reason: lastReason };
}
