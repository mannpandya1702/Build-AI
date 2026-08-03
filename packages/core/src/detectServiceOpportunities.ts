// Service-opportunity detection (MASTER_SPEC §8.3; CLAUDE.md §1). Given what we know about a business,
// decide which service lines are worth carrying as opportunities on the lead. This is internal
// TARGETING logic (like the lead score) — it never produces a customer-facing claim, so heuristics are
// fine and nothing here is fabrication.
//
// The critical contract rule it encodes (CLAUDE.md §1): the WEBSITE is the one cold-pitch product;
// chatbot / voice / automation are EXPANSION revenue, sold AFTER the website closes, never in cold
// outreach. So every non-website opportunity is tagged phase:"expansion" and the pipeline holds it
// until the website is won (see the expansion-hold in planOpportunityDispatch).

import type { ServiceType } from "./opportunityStatuses.js";

export interface BusinessSignals {
  /** the business has any website at all */
  hasWebsite: boolean;
  /** the site is missing, outdated, broken, or not mobile-friendly (a reason to pitch a new one) */
  siteIsWeak: boolean;
  /** Google review count (cash-flow + call-volume proxy); null if unknown */
  reviewCount: number | null;
  /** phone-driven trade where customers call to buy (roofing, plumbing, HVAC, …) */
  isPhoneDriven: boolean;
  /** customers can already book or request a quote online */
  hasOnlineBooking: boolean;
  /** the site already has a live chat / lead-capture widget */
  hasChat: boolean;
}

export interface DetectedOpportunity {
  service_type: ServiceType;
  /** "cold" = pitchable in first-touch outreach; "expansion" = only after the website closes */
  phase: "cold" | "expansion";
  rationale: string;
}

// Conservative thresholds so the system never over-proposes expansion lines. Reviews stand in for
// cash flow AND call volume — the two things that make an automation/voice retainer pay for itself.
export const AUTOMATION_MIN_REVIEWS = 40; // §1: 40+ reviews = real cash flow
export const CHATBOT_MIN_REVIEWS = 20; // enough web presence that capturing it is worth it
export const VOICE_MIN_REVIEWS = 100; // high call volume to justify an inbound agent

/**
 * Detect the service opportunities to carry for a business. Website first (the cold product); the rest
 * are expansion, gated by conservative review thresholds and returned phase-tagged. Pure + ordered
 * (website first, then automation, chatbot, voice) so the output is deterministic.
 */
export function detectServiceOpportunities(signals: BusinessSignals): DetectedOpportunity[] {
  const out: DetectedOpportunity[] = [];
  const reviews = signals.reviewCount ?? 0;

  // Website — the cold pitch. Only when there is a gap to sell (no site, or a weak one).
  if (!signals.hasWebsite || signals.siteIsWeak) {
    out.push({
      service_type: "website",
      phase: "cold",
      rationale: !signals.hasWebsite
        ? "no website — the core cold-pitch gap"
        : "site is weak/outdated/not mobile-friendly — rebuild is the cold pitch",
    });
  }

  // Automation — expansion. Missed-call text-back + review engine + follow-up: the speed-to-lead leak
  // is real for phone-driven trades with cash flow. Extra pull if there is no online booking path.
  if (signals.isPhoneDriven && reviews >= AUTOMATION_MIN_REVIEWS) {
    out.push({
      service_type: "ai_automation",
      phase: "expansion",
      rationale: signals.hasOnlineBooking
        ? `phone-driven with ${reviews} reviews — missed-call text-back + review engine`
        : `phone-driven with ${reviews} reviews and no online booking — speed-to-lead leak to close`,
    });
  }

  // Chatbot — expansion. Lead capture on the new site; only if they don't already have a capture path.
  if (reviews >= CHATBOT_MIN_REVIEWS && !signals.hasChat) {
    out.push({
      service_type: "chatbot",
      phase: "expansion",
      rationale: `${reviews} reviews and no live capture — a site chatbot catches leads that would bounce`,
    });
  }

  // Voice — expansion, INBOUND only (never cold outbound; TCPA). High call volume justifies an agent
  // that answers their own inbound calls / after-hours.
  if (signals.isPhoneDriven && reviews >= VOICE_MIN_REVIEWS) {
    out.push({
      service_type: "voice_agent",
      phase: "expansion",
      rationale: `phone-driven with ${reviews} reviews — inbound/after-hours reception agent`,
    });
  }

  return out;
}

/** The service types detected, in order — convenience for callers that only need the set. */
export function detectedServiceTypes(signals: BusinessSignals): ServiceType[] {
  return detectServiceOpportunities(signals).map((o) => o.service_type);
}
