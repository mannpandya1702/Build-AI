import { describe, expect, it } from "vitest";
import {
  OUTREACH_QUEUE,
  SERVICE_QUEUES,
  dispatchOpportunity,
  isAtRest,
  isEnqueueable,
} from "../src/dispatchOpportunity.js";
import { OPPORTUNITY_STATUSES, SERVICE_TYPES } from "../src/opportunityStatuses.js";

describe("opportunity dispatch router", () => {
  it("returns a defined action for every service × status (exhaustive, no throw)", () => {
    for (const service of SERVICE_TYPES) {
      for (const status of OPPORTUNITY_STATUSES) {
        const a = dispatchOpportunity(service, status);
        expect(a.kind, `${service}/${status}`).toBeTruthy();
        expect(a.reason, `${service}/${status}`).toContain(service);
      }
    }
  });

  it("routes the website happy path stage by stage", () => {
    expect(dispatchOpportunity("website", "identified")).toMatchObject({
      kind: "enqueue",
      queue: "agent:solution",
    });
    expect(dispatchOpportunity("website", "proposed").kind).toBe("park_at_gate");
    expect(dispatchOpportunity("website", "awaiting_build_approval").kind).toBe("await_operator");
    expect(dispatchOpportunity("website", "building")).toMatchObject({
      kind: "enqueue",
      queue: "agent:builder",
    });
    expect(dispatchOpportunity("website", "demo_ready")).toMatchObject({
      kind: "enqueue",
      queue: OUTREACH_QUEUE,
    });
    expect(dispatchOpportunity("website", "in_outreach").kind).toBe("await_prospect");
    expect(dispatchOpportunity("website", "closed_won")).toMatchObject({
      kind: "enqueue",
      queue: "agent:website-provision",
    });
    expect(dispatchOpportunity("website", "live").kind).toBe("operate");
  });

  it("dispatches build + onboard to the SERVICE-SPECIFIC worker for every service line", () => {
    for (const service of SERVICE_TYPES) {
      const build = dispatchOpportunity(service, "building");
      const onboard = dispatchOpportunity(service, "closed_won");
      expect(build).toMatchObject({ kind: "enqueue", queue: SERVICE_QUEUES[service].build });
      expect(onboard).toMatchObject({ kind: "enqueue", queue: SERVICE_QUEUES[service].onboard });
    }
    // and they are genuinely distinct per service (no accidental shared queue)
    expect(dispatchOpportunity("chatbot", "building")).toMatchObject({ queue: "agent:chatbot-build" });
    expect(dispatchOpportunity("voice_agent", "building")).toMatchObject({ queue: "agent:voice-build" });
    expect(dispatchOpportunity("ai_automation", "building")).toMatchObject({
      queue: "agent:automation-build",
    });
  });

  it("ships every service line through the SAME outreach queue", () => {
    for (const service of SERVICE_TYPES) {
      expect(dispatchOpportunity(service, "demo_ready")).toMatchObject({
        kind: "enqueue",
        queue: OUTREACH_QUEUE,
      });
    }
  });

  it("gates paid build behind the operator for every service line", () => {
    for (const service of SERVICE_TYPES) {
      // proposed never enqueues a build directly — it parks at the gate
      const proposed = dispatchOpportunity(service, "proposed");
      expect(proposed.kind).toBe("park_at_gate");
      // at the gate, the scheduler waits on the operator (canRunBuild owns admission)
      expect(dispatchOpportunity(service, "awaiting_build_approval").kind).toBe("await_operator");
      // the build queue is never reachable straight from proposed/awaiting (only from `building`)
      const gate = dispatchOpportunity(service, "awaiting_build_approval");
      expect(isEnqueueable(gate)).toBe(false);
    }
  });

  it("marks terminal states terminal for every service line", () => {
    for (const service of SERVICE_TYPES) {
      expect(dispatchOpportunity(service, "churned").kind).toBe("terminal");
      expect(dispatchOpportunity(service, "closed_lost").kind).toBe("terminal");
    }
  });

  it("treats paused as an operator wait (dunning resume), live as operate", () => {
    expect(dispatchOpportunity("website", "paused").kind).toBe("await_operator");
    expect(dispatchOpportunity("website", "live").kind).toBe("operate");
  });

  it("isEnqueueable narrows only enqueue actions", () => {
    expect(isEnqueueable(dispatchOpportunity("website", "building"))).toBe(true);
    expect(isEnqueueable(dispatchOpportunity("website", "identified"))).toBe(true);
    expect(isEnqueueable(dispatchOpportunity("website", "in_outreach"))).toBe(false);
    expect(isEnqueueable(dispatchOpportunity("website", "churned"))).toBe(false);
  });

  it("isAtRest is true exactly for parked/waiting/operate/terminal statuses", () => {
    // automatable work pending → not at rest
    expect(isAtRest("identified")).toBe(false);
    expect(isAtRest("building")).toBe(false);
    expect(isAtRest("demo_ready")).toBe(false);
    expect(isAtRest("closed_won")).toBe(false);
    // waiting / steady / terminal → at rest
    expect(isAtRest("awaiting_build_approval")).toBe(true);
    expect(isAtRest("in_outreach")).toBe(true);
    expect(isAtRest("negotiating")).toBe(true);
    expect(isAtRest("live")).toBe(true);
    expect(isAtRest("paused")).toBe(true);
    expect(isAtRest("churned")).toBe(true);
    expect(isAtRest("closed_lost")).toBe(true);
  });
});
