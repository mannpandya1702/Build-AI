// The lead state machine (spec §5). One source of truth for statuses and legal transitions.
// This is a superset of the operator contract's stage list (CLAUDE.md §2): `found` spans
// discovered/enriched, `demo_built` = outreach_ready, `nurture` = sequence exhausted, kept warm.

export const LEAD_STATUSES = [
  "discovered",
  "enriched",
  "qualified",
  "disqualified",
  "analyzed",
  "solution_ready",
  "design_ready",
  "demo_building",
  "demo_qa",
  "outreach_ready",
  "awaiting_approval",
  "contacted",
  "replied",
  "meeting_booked",
  "nurture",
  "negotiating",
  "closed_won",
  "closed_lost",
  "final_building",
  "final_qa",
  "delivery_approval",
  "delivered",
  "suppressed",
] as const;

export type LeadStatus = (typeof LEAD_STATUSES)[number];

/**
 * Allowed transitions (spec §5 state machine). `suppressed` is reachable from any non-terminal
 * state and is terminal. Keys are FROM, values are the set of legal TO states.
 */
export const TRANSITIONS: Record<LeadStatus, readonly LeadStatus[]> = {
  discovered: ["enriched", "disqualified"],
  enriched: ["qualified", "disqualified"],
  qualified: ["analyzed", "disqualified"],
  disqualified: [],
  analyzed: ["solution_ready"],
  solution_ready: ["design_ready"],
  design_ready: ["demo_building"],
  demo_building: ["demo_qa"],
  demo_qa: ["outreach_ready", "demo_building"], // QA fail loops back to builder
  outreach_ready: ["awaiting_approval", "contacted"], // review mode vs auto mode
  awaiting_approval: ["contacted", "outreach_ready"], // approve, or reject back to drafting
  contacted: ["replied", "meeting_booked", "nurture"],
  replied: ["negotiating", "meeting_booked", "nurture"],
  meeting_booked: ["closed_won", "closed_lost"],
  nurture: ["replied", "meeting_booked"], // a nurture lead can come back to life
  negotiating: ["closed_won", "closed_lost"],
  closed_won: ["final_building"],
  closed_lost: [],
  final_building: ["final_qa"],
  final_qa: ["delivery_approval", "final_building"], // QA fail loops back
  delivery_approval: ["delivered"],
  delivered: [],
  suppressed: [],
};

const TERMINAL: readonly LeadStatus[] = ["disqualified", "closed_lost", "delivered", "suppressed"];

export function isTerminal(s: LeadStatus): boolean {
  return TERMINAL.includes(s);
}

export function canTransition(from: LeadStatus, to: LeadStatus): boolean {
  if (to === "suppressed") return !isTerminal(from); // suppression allowed from any live state
  return (TRANSITIONS[from] ?? []).includes(to);
}
