// The website opportunity is a PROJECTION of the lead flow (MASTER_SPEC §8.3). A lead's website line
// mirrors lead_status; this is the single source of truth for that mapping — the same map migration
// 00003 backfilled, extracted so the ongoing creation/sync uses one tested projection instead of a
// second copy drifting in SQL. Because website is a projection, the expansion-unlock check derives
// from lead_status directly (see WEBSITE_UNLOCK_LEAD_STATUSES), so no website-opportunity row needs to
// be kept in sync for the spine to be correct.

import type { OpportunityStatus } from "./opportunityStatuses.js";
import { LEAD_STATUSES, type LeadStatus } from "./statuses.js";

/** Project a lead's status onto its website opportunity's lifecycle status. Exhaustive (never guard). */
export function websiteOpportunityStatusFor(leadStatus: LeadStatus): OpportunityStatus {
  switch (leadStatus) {
    case "discovered":
    case "enriched":
      return "identified";
    case "qualified":
      return "proposed";
    case "awaiting_build_approval":
      return "awaiting_build_approval";
    case "analyzed":
    case "solution_ready":
    case "design_ready":
    case "demo_building":
    case "demo_qa":
      return "building";
    case "outreach_ready":
    case "awaiting_approval":
      return "demo_ready";
    case "contacted":
    case "nurture":
      return "in_outreach";
    case "replied":
    case "meeting_booked":
    case "negotiating":
      return "negotiating";
    case "closed_won":
      return "closed_won";
    case "final_building":
    case "final_qa":
    case "delivery_approval":
      return "onboarding";
    case "delivered":
      return "live";
    case "disqualified":
    case "closed_lost":
    case "suppressed":
      return "closed_lost";
    default: {
      const _exhaustive: never = leadStatus;
      return "closed_lost" as OpportunityStatus; // unreachable; keeps a new status a compile error above
    }
  }
}

// The lead statuses at which expansion selling is unlocked — i.e. those that project to a won website
// (closed_won / onboarding / live). Derived from the projection so it can never drift from it.
export const WEBSITE_UNLOCK_LEAD_STATUSES: readonly LeadStatus[] = LEAD_STATUSES.filter((s) =>
  ["closed_won", "onboarding", "live"].includes(websiteOpportunityStatusFor(s)),
);

/** True when a lead has progressed far enough (website won) that its expansion lines may start selling. */
export function isWebsiteUnlockedForLead(leadStatus: LeadStatus): boolean {
  return WEBSITE_UNLOCK_LEAD_STATUSES.includes(leadStatus);
}
