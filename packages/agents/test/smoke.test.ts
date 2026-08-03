import { describe, expect, it } from "vitest";
import { AGENTS, AGENT_BY_TRIGGER } from "../src/registry.js";

// Phase 0 smoke: the agent registry is the pipeline's backbone (status -> owning agent). Real
// per-agent tests (email gate, approval gate, etc.) land in their phases per MASTER_SPEC §11.
describe("agent registry", () => {
  it("registers the core pipeline agents", () => {
    const names = AGENTS.map((a) => a.name);
    for (const expected of ["scrape", "qualify", "analyzer", "solution", "uiux", "builder", "qa", "sales"]) {
      expect(names).toContain(expected);
    }
  });

  it("maps every trigger status to exactly one owning agent", () => {
    expect(AGENT_BY_TRIGGER.size).toBeGreaterThan(0);
    for (const [, agent] of AGENT_BY_TRIGGER) {
      expect(agent.name).toBeTruthy();
      expect(agent.queue).toMatch(/^agent:/);
    }
  });
});
