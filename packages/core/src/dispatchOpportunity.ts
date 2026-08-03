// The OPPORTUNITY dispatch router (MASTER_SPEC §8.3/§8.4 — the agency spine). Given one opportunity's
// (service_type, status), it returns the single action the scheduler should take next. This is the
// wiring that turns the built-and-tested service cores (@autopilot/chat, voice, automation) into a
// live multi-service pipeline: the STATUS decides the lifecycle stage (service-agnostic), the
// SERVICE_TYPE decides WHICH worker owns the service-specific stages (propose / build / onboard).
//
// It is a PURE function on purpose — no DB, no pg-boss — so the whole routing table is unit-tested
// without infrastructure. The scheduler consumes the action; it never re-derives routing inline.

import { type OpportunityStatus, type ServiceType, isOpportunityTerminal } from "./opportunityStatuses.js";

// Which pg-boss queue owns each service-specific stage. Outreach ("ship the demo") and the spend gate
// are service-agnostic, so they are NOT in here. Non-website workers are MOCK-stubbed until their
// adapters land (Vapi / Twilio / Trigger.dev — see NEEDS_FROM_OPERATOR.md), but the ROUTING is real:
// flipping a service line live is a handler swap in the worker, not a change here.
export const SERVICE_QUEUES: Record<ServiceType, { propose: string; build: string; onboard: string }> = {
  website: {
    propose: "agent:solution",
    build: "agent:builder",
    onboard: "agent:website-provision",
  },
  chatbot: {
    propose: "agent:chatbot-plan",
    build: "agent:chatbot-build",
    onboard: "agent:chatbot-provision",
  },
  voice_agent: {
    propose: "agent:voice-plan",
    build: "agent:voice-build",
    onboard: "agent:voice-provision",
  },
  ai_automation: {
    propose: "agent:automation-plan",
    build: "agent:automation-build",
    onboard: "agent:automation-provision",
  },
};

// The opportunity pipeline's OWN outreach step. Deliberately distinct from the lead sales queue
// (agent:sales), which drives the website cold-drop keyed on lead_status. An expansion opportunity
// ships a post-close upsell to an EXISTING client — a different message on a different trigger — so it
// must never land on the lead-sales consumer (that would re-run the lead's cold outreach). One shared
// queue across service lines (send/gate/suppression is one path); the message is stamped per opp.
export const OUTREACH_QUEUE = "agent:opportunity-outreach";

// The one thing the scheduler does with an opportunity this tick.
export type DispatchAction =
  // enqueue a worker queue (work is ready and automatable)
  | { kind: "enqueue"; queue: string; reason: string }
  // solution is ready: free hop proposed -> awaiting_build_approval + notify operator (no spend)
  | { kind: "park_at_gate"; reason: string }
  // parked at the spend gate (or dunning pause): the operator acts, the scheduler does not enqueue
  | { kind: "await_operator"; reason: string }
  // demo shipped / negotiating: waiting on the prospect, nothing to enqueue
  | { kind: "await_prospect"; reason: string }
  // live and running: steady state, no pipeline work
  | { kind: "operate"; reason: string }
  // terminal (churned / closed_lost): never scheduled again
  | { kind: "terminal"; reason: string };

/**
 * Route one opportunity. Exhaustive over OpportunityStatus (the `never` guard makes a missed status a
 * compile error, so adding a status without routing it cannot ship).
 *
 * The spend gate lives at `awaiting_build_approval` → `await_operator`; the scheduler's existing
 * `canRunBuild` rule owns the admission decision (operator approval, or auto within the daily build
 * budget) and advances to `building`. This function never duplicates that rule — it just marks the
 * wait. Once at `building`, the spend is already authorized, so the build enqueue is ungated.
 */
export function dispatchOpportunity(service: ServiceType, status: OpportunityStatus): DispatchAction {
  const q = SERVICE_QUEUES[service];
  switch (status) {
    case "identified":
      return { kind: "enqueue", queue: q.propose, reason: `${service}: prepare the solution/pitch` };
    case "proposed":
      return { kind: "park_at_gate", reason: `${service}: solution ready — park for build approval` };
    case "awaiting_build_approval":
      return { kind: "await_operator", reason: `${service}: spend gate — operator approves paid build` };
    case "building":
      return { kind: "enqueue", queue: q.build, reason: `${service}: build the demo (past the gate)` };
    case "demo_ready":
      return { kind: "enqueue", queue: OUTREACH_QUEUE, reason: `${service}: demo QA-passed — ship it` };
    case "in_outreach":
      return { kind: "await_prospect", reason: `${service}: demo shipped — awaiting the prospect` };
    case "negotiating":
      return { kind: "await_prospect", reason: `${service}: prospect engaged — operator drives the close` };
    case "closed_won":
      return { kind: "enqueue", queue: q.onboard, reason: `${service}: signed — provision the live service` };
    case "onboarding":
      return { kind: "enqueue", queue: q.onboard, reason: `${service}: onboarding — continue provisioning` };
    case "live":
      return { kind: "operate", reason: `${service}: live and running` };
    case "paused":
      return { kind: "await_operator", reason: `${service}: paused (e.g. dunning) — resumes when cleared` };
    case "churned":
      return { kind: "terminal", reason: `${service}: churned` };
    case "closed_lost":
      return { kind: "terminal", reason: `${service}: closed lost` };
    default: {
      // exhaustiveness guard: a new OpportunityStatus without a route fails the type-check here
      const _exhaustive: never = status;
      return { kind: "terminal", reason: `unrouted status: ${String(_exhaustive)}` };
    }
  }
}

/** True when the scheduler should enqueue a worker for this action (vs. wait / terminal). */
export function isEnqueueable(
  action: DispatchAction,
): action is { kind: "enqueue"; queue: string; reason: string } {
  return action.kind === "enqueue";
}

/** Convenience: an opportunity is "at rest" (no automatable work) when parked, waiting, or terminal. */
export function isAtRest(status: OpportunityStatus): boolean {
  if (isOpportunityTerminal(status)) return true;
  const a = dispatchOpportunity("website", status);
  return a.kind === "await_operator" || a.kind === "await_prospect" || a.kind === "operate";
}
