import { describe, expect, it } from "vitest";
import {
  OPPORTUNITY_STATUSES,
  OPPORTUNITY_TRANSITIONS,
  type OpportunityStatus,
  SERVICE_TYPES,
  canTransitionOpportunity,
  isOpportunityTerminal,
} from "../src/opportunityStatuses.js";

describe("opportunity state machine", () => {
  it("has the four launch service types", () => {
    expect([...SERVICE_TYPES]).toEqual(["website", "chatbot", "voice_agent", "ai_automation"]);
  });

  it("covers every status in the transition map", () => {
    for (const s of OPPORTUNITY_STATUSES) expect(OPPORTUNITY_TRANSITIONS[s]).toBeDefined();
  });

  it("allows the happy path identified -> live", () => {
    const path: OpportunityStatus[] = [
      "identified",
      "proposed",
      "awaiting_build_approval",
      "building",
      "demo_ready",
      "in_outreach",
      "negotiating",
      "closed_won",
      "onboarding",
      "live",
    ];
    for (let i = 0; i < path.length - 1; i++) {
      expect(canTransitionOpportunity(path[i], path[i + 1]), `${path[i]} -> ${path[i + 1]}`).toBe(true);
    }
  });

  it("gates paid build behind approval: awaiting_build_approval only reaches building or closed_lost", () => {
    expect(canTransitionOpportunity("awaiting_build_approval", "building")).toBe(true);
    expect(canTransitionOpportunity("proposed", "building")).toBe(false); // cannot skip the gate
  });

  it("supports QA-fix loop and post-live churn/pause", () => {
    expect(canTransitionOpportunity("demo_ready", "building")).toBe(true);
    expect(canTransitionOpportunity("live", "paused")).toBe(true);
    expect(canTransitionOpportunity("paused", "live")).toBe(true);
    expect(canTransitionOpportunity("live", "churned")).toBe(true);
  });

  it("terminal states have no outgoing transitions", () => {
    for (const s of ["churned", "closed_lost"] as const) {
      expect(isOpportunityTerminal(s)).toBe(true);
      expect(OPPORTUNITY_TRANSITIONS[s]).toHaveLength(0);
    }
  });

  it("rejects backwards / skipping transitions", () => {
    expect(canTransitionOpportunity("live", "identified")).toBe(false);
    expect(canTransitionOpportunity("identified", "closed_won")).toBe(false);
    expect(canTransitionOpportunity("closed_lost", "identified")).toBe(false);
  });
});
