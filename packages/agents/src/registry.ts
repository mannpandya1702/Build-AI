// Agent registry (spec §6): which agent owns which trigger status, and where a lead goes next.
// The worker's scheduler enqueues `agent:<name>` jobs for any lead sitting in a trigger status;
// each agent module does its work and advances the lead. In Phase 1 all handlers are stubs that
// write plausible fixture artifacts (spec §13 Phase 1).

import type { LeadStatus } from "@autopilot/core";

export interface AgentSpec {
  name: string;
  queue: string;
  /** statuses that mean "this agent should pick the lead up now" */
  triggers: readonly LeadStatus[];
}

export const AGENTS: readonly AgentSpec[] = [
  { name: "scrape", queue: "agent:scrape", triggers: ["discovered"] },
  { name: "qualify", queue: "agent:qualify", triggers: ["enriched"] },
  { name: "analyzer", queue: "agent:analyzer", triggers: ["qualified"] },
  { name: "solution", queue: "agent:solution", triggers: ["analyzed"] },
  { name: "uiux", queue: "agent:uiux", triggers: ["solution_ready"] },
  // *_building triggers are the QA-fix re-entry (the QA agent sends a failed lead back to rebuild);
  // the builder's in-flight-build claim keeps a fresh build from re-triggering itself.
  { name: "builder", queue: "agent:builder", triggers: ["design_ready", "closed_won", "demo_building", "final_building"] },
  { name: "qa", queue: "agent:qa", triggers: ["demo_qa", "final_qa"] },
  { name: "sales", queue: "agent:sales", triggers: ["outreach_ready", "awaiting_approval", "contacted", "replied", "negotiating", "delivery_approval"] },
  // research + monitor are cron/operator-triggered, not status-triggered:
  { name: "research", queue: "agent:research", triggers: [] },
  { name: "monitor", queue: "agent:monitor", triggers: [] },
] as const;

/** statuses an agent moves work through without operator input, used by the mock traversal */
export const AGENT_BY_TRIGGER: ReadonlyMap<LeadStatus, AgentSpec> = new Map(
  AGENTS.flatMap((a) => a.triggers.map((t) => [t, a] as const)),
);
