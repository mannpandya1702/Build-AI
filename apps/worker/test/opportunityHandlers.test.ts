import { SERVICE_QUEUES } from "@autopilot/core";
import { describe, expect, it } from "vitest";
import { mockOpportunityHandlers, onboardNextStatus } from "../src/opportunityHandlers.js";

describe("opportunity MOCK handlers", () => {
  it("onboard advances closed_won -> onboarding -> live, then stops", () => {
    expect(onboardNextStatus("closed_won")).toBe("onboarding");
    expect(onboardNextStatus("onboarding")).toBe("live");
    expect(onboardNextStatus("live")).toBeNull();
    expect(onboardNextStatus("building")).toBeNull();
  });

  it("registers a handler for every NON-website service queue + the shared outreach queue", () => {
    const m = mockOpportunityHandlers();
    // chatbot/voice/automation × (propose, build, onboard) = 9, + 1 opportunity-outreach = 10
    expect(m.size).toBe(10);
    for (const svc of ["chatbot", "voice_agent", "ai_automation"] as const) {
      expect(m.has(SERVICE_QUEUES[svc].propose), `${svc} propose`).toBe(true);
      expect(m.has(SERVICE_QUEUES[svc].build), `${svc} build`).toBe(true);
      expect(m.has(SERVICE_QUEUES[svc].onboard), `${svc} onboard`).toBe(true);
    }
  });

  it("NEVER registers a website queue — those belong to the lead agents (no double-consume)", () => {
    const m = mockOpportunityHandlers();
    expect(m.has(SERVICE_QUEUES.website.propose)).toBe(false); // agent:solution
    expect(m.has(SERVICE_QUEUES.website.build)).toBe(false); // agent:builder
    expect(m.has(SERVICE_QUEUES.website.onboard)).toBe(false);
    // the lead-agent queue names specifically must be absent
    expect(m.has("agent:solution")).toBe(false);
    expect(m.has("agent:builder")).toBe(false);
    expect(m.has("agent:sales")).toBe(false);
  });
});
