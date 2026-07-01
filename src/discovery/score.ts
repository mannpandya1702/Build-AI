// src/discovery/score.ts — applies the exact CLAUDE.md §4 rubric and auto-disqualifiers.
// Output: a 0-100 score plus a breakdown and any disqualify reasons.

import type { PlaceDetails, SiteProbe } from "./places";

export interface ScoreResult {
  score: number;
  breakdown: Record<string, number>;
  disqualified: boolean;
  disqualifyReasons: string[];
  hasWebsiteGap: boolean;
}

// Keyword hints that a business is in a target, phone-driven, high-job-value niche (CLAUDE.md §1).
const TARGET_NICHE_KEYWORDS = [
  "roof",
  "hvac",
  "air condition",
  "heating",
  "cooling",
  "plumb",
  "electric",
  "med spa",
  "medical spa",
  "dentist",
  "dental",
  "chiropract",
  "landscap",
  "auto repair",
  "law",
  "attorney",
];

// Rough national-chain / franchise markers. Not exhaustive; a manual eyeball still matters.
const CHAIN_MARKERS = [
  "roto-rooter",
  "mr. rooter",
  "mr rooter",
  "one hour heating",
  "aire serv",
  "benjamin franklin",
  "home depot",
  "lowe's",
  "sears",
  "terminix",
  "orkin",
  "aptive",
];

const FAST_MODERN_MS = 3500; // a responsive site that loads this fast on mobile = nothing to sell

/** Score a lead against CLAUDE.md §4. `probe` is the mobile site-quality probe (null if no website). */
export function scoreLead(d: PlaceDetails, probe?: SiteProbe | null): ScoreResult {
  const breakdown: Record<string, number> = {};
  const disqualifyReasons: string[] = [];

  const name = (d.displayName?.text ?? "").toLowerCase();
  const reviews = d.userRatingCount ?? 0;
  const rating = d.rating ?? 0;
  const hasWebsite = Boolean(d.websiteUri);
  const photoCount = d.photos?.length ?? 0;
  const hasPhone = Boolean(d.nationalPhoneNumber);

  // 40+ reviews = +30, 20+ = +15 (cash-flow signal)
  breakdown.reviews = reviews >= 40 ? 30 : reviews >= 20 ? 15 : 0;

  // Rating 4.0+ = +15
  breakdown.rating = rating >= 4.0 ? 15 : 0;

  // Website gap: no site at all, OR a site that is genuinely weak. We only claim "weak" on strong,
  // reliable signals (unreachable, no viewport meta = old build, or very slow). A responsive site we
  // simply could not confirm is NOT counted as a gap, to avoid over-flagging good sites. = +25
  const siteIsWeak =
    !hasWebsite ||
    (probe
      ? !probe.reachable || !probe.hasViewportMeta || (probe.loadMs ?? 0) > 5000
      : false);
  breakdown.websiteGap = siteIsWeak ? 25 : 0;

  // In a target niche = +15
  breakdown.niche = TARGET_NICHE_KEYWORDS.some((k) => name.includes(k)) ? 15 : 0;

  // Real photos available on GBP = +10
  breakdown.photos = photoCount > 0 ? 10 : 0;

  // Phone present = +5
  breakdown.phone = hasPhone ? 5 : 0;

  const score = Object.values(breakdown).reduce((a, b) => a + b, 0);

  // --- Auto-disqualifiers (CLAUDE.md §4) ---
  if (d.businessStatus && d.businessStatus !== "OPERATIONAL") {
    disqualifyReasons.push(`business status is ${d.businessStatus}`);
  }
  if (CHAIN_MARKERS.some((c) => name.includes(c))) {
    disqualifyReasons.push("looks like a national chain / franchise (no local decision-maker)");
  }
  if (hasWebsite && probe && probe.reachable && probe.likelyResponsive && (probe.loadMs ?? Infinity) < FAST_MODERN_MS) {
    disqualifyReasons.push("already on a fast, modern, mobile site (nothing to sell)");
  }
  if (photoCount === 0 && reviews === 0) {
    disqualifyReasons.push("no photo and no reviews: nothing real to personalize with");
  }

  return {
    score,
    breakdown,
    disqualified: disqualifyReasons.length > 0,
    disqualifyReasons,
    hasWebsiteGap: siteIsWeak,
  };
}
