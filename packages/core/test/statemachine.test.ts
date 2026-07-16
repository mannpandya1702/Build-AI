// State machine unit tests (spec §12): legal transitions, illegal transitions, suppression rules.
import { describe, expect, it } from "vitest";
import { LEAD_STATUSES, type LeadStatus, TRANSITIONS, canTransition, isTerminal } from "../src/statuses.js";

describe("lead state machine", () => {
  it("covers every status in the transition map", () => {
    for (const s of LEAD_STATUSES) expect(TRANSITIONS[s]).toBeDefined();
  });

  it("allows the happy path discovered -> delivered", () => {
    const path: LeadStatus[] = [
      "discovered",
      "enriched",
      "qualified",
      "analyzed",
      "solution_ready",
      "design_ready",
      "demo_building",
      "demo_qa",
      "outreach_ready",
      "awaiting_approval",
      "contacted",
      "replied",
      "negotiating",
      "closed_won",
      "final_building",
      "final_qa",
      "delivery_approval",
      "delivered",
    ];
    for (let i = 0; i < path.length - 1; i++) {
      expect(canTransition(path[i], path[i + 1]), `${path[i]} -> ${path[i + 1]}`).toBe(true);
    }
  });

  it("allows auto mode to skip approval", () => {
    expect(canTransition("outreach_ready", "contacted")).toBe(true);
  });

  it("allows QA fail loops", () => {
    expect(canTransition("demo_qa", "demo_building")).toBe(true);
    expect(canTransition("final_qa", "final_building")).toBe(true);
  });

  it("rejects backwards and skipping transitions", () => {
    expect(canTransition("contacted", "discovered")).toBe(false);
    expect(canTransition("discovered", "outreach_ready")).toBe(false);
    expect(canTransition("qualified", "contacted")).toBe(false);
    expect(canTransition("delivered", "discovered")).toBe(false);
  });

  it("suppression is reachable from any live state but not from terminal states", () => {
    expect(canTransition("contacted", "suppressed")).toBe(true);
    expect(canTransition("discovered", "suppressed")).toBe(true);
    expect(canTransition("nurture", "suppressed")).toBe(true);
    expect(canTransition("delivered", "suppressed")).toBe(false);
    expect(canTransition("suppressed", "suppressed")).toBe(false);
  });

  it("terminal states have no outgoing transitions", () => {
    for (const s of ["disqualified", "closed_lost", "delivered", "suppressed"] as const) {
      expect(isTerminal(s)).toBe(true);
      expect(TRANSITIONS[s]).toHaveLength(0);
    }
  });

  it("nurture can come back to life (reply or booking), per the contract", () => {
    expect(canTransition("nurture", "replied")).toBe(true);
    expect(canTransition("nurture", "meeting_booked")).toBe(true);
  });
});
