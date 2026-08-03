// The OPPORTUNITY state machine (MASTER_SPEC §8.3/§8.4) — the agency pivot. A lead can carry several
// opportunities (one per service_type: website, chatbot, voice agent, automation), each moving through
// its own lifecycle independently. This mirrors the lead state machine (statuses.ts) so advance*
// shares the same transactional, illegal-transition-rejecting guarantees.

export const SERVICE_TYPES = ["website", "chatbot", "voice_agent", "ai_automation"] as const;
export type ServiceType = (typeof SERVICE_TYPES)[number];

export const OPPORTUNITY_STATUSES = [
  "identified", // gap detected for this service; not yet proposed
  "proposed", // solution/pitch prepared
  "awaiting_build_approval", // spend gate — operator approves before any paid build
  "building", // demo being built
  "demo_ready", // demo built + QA-passed
  "in_outreach", // demo shipped to the prospect
  "negotiating", // prospect engaged
  "closed_won", // signed
  "onboarding", // provisioning the live service (A2P, integrations, etc.)
  "live", // delivered and running
  "paused", // temporarily suspended (e.g. dunning auto-pause)
  "churned", // cancelled after being live (terminal)
  "closed_lost", // never converted (terminal)
] as const;
export type OpportunityStatus = (typeof OPPORTUNITY_STATUSES)[number];

export const OPPORTUNITY_TRANSITIONS: Record<OpportunityStatus, readonly OpportunityStatus[]> = {
  identified: ["proposed", "closed_lost"],
  proposed: ["awaiting_build_approval", "closed_lost"],
  awaiting_build_approval: ["building", "closed_lost"], // the spend gate
  building: ["demo_ready", "closed_lost"],
  demo_ready: ["in_outreach", "building"], // QA-fix loops back to building
  in_outreach: ["negotiating", "closed_lost"],
  negotiating: ["closed_won", "closed_lost"],
  closed_won: ["onboarding"],
  onboarding: ["live", "closed_lost"], // integration can fail before go-live
  live: ["paused", "churned"],
  paused: ["live", "churned"], // resume (e.g. payment resolved) or churn
  churned: [],
  closed_lost: [],
};

const OPPORTUNITY_TERMINAL: readonly OpportunityStatus[] = ["churned", "closed_lost"];

export function isOpportunityTerminal(s: OpportunityStatus): boolean {
  return OPPORTUNITY_TERMINAL.includes(s);
}

export function canTransitionOpportunity(from: OpportunityStatus, to: OpportunityStatus): boolean {
  return (OPPORTUNITY_TRANSITIONS[from] ?? []).includes(to);
}
