import { describe, expect, it } from "vitest";
import { OPPORTUNITY_STATUSES } from "../src/opportunityStatuses.js";
import { LEAD_STATUSES } from "../src/statuses.js";
import {
  WEBSITE_UNLOCK_LEAD_STATUSES,
  isWebsiteUnlockedForLead,
  websiteOpportunityStatusFor,
} from "../src/websiteOpportunityStatus.js";

describe("websiteOpportunityStatusFor", () => {
  it("maps every lead status to a real opportunity status (total function)", () => {
    for (const s of LEAD_STATUSES) {
      const projected = websiteOpportunityStatusFor(s);
      expect(OPPORTUNITY_STATUSES, s).toContain(projected);
    }
  });

  it("projects the key pipeline milestones the way the backfill did", () => {
    expect(websiteOpportunityStatusFor("discovered")).toBe("identified");
    expect(websiteOpportunityStatusFor("qualified")).toBe("proposed");
    expect(websiteOpportunityStatusFor("awaiting_build_approval")).toBe("awaiting_build_approval");
    expect(websiteOpportunityStatusFor("demo_building")).toBe("building");
    expect(websiteOpportunityStatusFor("outreach_ready")).toBe("demo_ready");
    expect(websiteOpportunityStatusFor("contacted")).toBe("in_outreach");
    expect(websiteOpportunityStatusFor("negotiating")).toBe("negotiating");
    expect(websiteOpportunityStatusFor("closed_won")).toBe("closed_won");
    expect(websiteOpportunityStatusFor("final_qa")).toBe("onboarding");
    expect(websiteOpportunityStatusFor("delivered")).toBe("live");
  });

  it("projects dead-end lead statuses to closed_lost", () => {
    expect(websiteOpportunityStatusFor("disqualified")).toBe("closed_lost");
    expect(websiteOpportunityStatusFor("closed_lost")).toBe("closed_lost");
    expect(websiteOpportunityStatusFor("suppressed")).toBe("closed_lost");
  });

  it("unlocks expansion exactly at closed_won and beyond (won website)", () => {
    // unlocked
    for (const s of ["closed_won", "final_building", "final_qa", "delivery_approval", "delivered"] as const) {
      expect(isWebsiteUnlockedForLead(s), s).toBe(true);
    }
    // still locked — website not yet won
    for (const s of ["qualified", "demo_building", "outreach_ready", "contacted", "negotiating"] as const) {
      expect(isWebsiteUnlockedForLead(s), s).toBe(false);
    }
  });

  it("the unlock set is derived from the projection (no drift possible)", () => {
    for (const s of WEBSITE_UNLOCK_LEAD_STATUSES) {
      expect(["closed_won", "onboarding", "live"]).toContain(websiteOpportunityStatusFor(s));
    }
    // and nothing outside the set projects to a won status
    for (const s of LEAD_STATUSES) {
      const won = ["closed_won", "onboarding", "live"].includes(websiteOpportunityStatusFor(s));
      expect(WEBSITE_UNLOCK_LEAD_STATUSES.includes(s), s).toBe(won);
    }
  });
});
