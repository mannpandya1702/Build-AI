// MOCK opportunity handlers (MASTER_SPEC §7.2-7.4). Consumers for the chatbot/voice/automation
// opportunity queues that advance an opportunity ONE lifecycle step — no real service work. They let
// OPPORTUNITY_DISPATCH=execute run a full expansion pipeline end to end under MOCK. The real handlers
// (Vapi assistant provisioning, Twilio A2P, the chatbot builder) replace these per service line as
// their adapters land (NEEDS_FROM_OPERATOR.md).
//
// WEBSITE queues are deliberately excluded: agent:solution / agent:builder / agent:website-provision
// are the LEAD agents' queues, already consumed by the website lead flow. The opportunity dispatcher
// only ever enqueues NON-website opportunities, so these handlers cover exactly those.

import {
  OUTREACH_QUEUE,
  type OpportunityStatus,
  SERVICE_QUEUES,
  SERVICE_TYPES,
  advanceOpportunity,
  getPool,
} from "@autopilot/core";

export type OppStageHandler = (opportunityId: string, leadId: string) => Promise<void>;

async function readStatus(oppId: string): Promise<OpportunityStatus | null> {
  const r = await getPool().query<{ status: OpportunityStatus }>(
    "select status from opportunities where id = $1",
    [oppId],
  );
  return r.rows[0]?.status ?? null;
}

/**
 * Onboard is the only two-step stage: closed_won -> onboarding -> live. Pure so the sub-sequence is
 * testable; returns null when there's nothing to advance (already live / not in the onboard window).
 */
export function onboardNextStatus(current: OpportunityStatus): OpportunityStatus | null {
  if (current === "closed_won") return "onboarding";
  if (current === "onboarding") return "live";
  return null;
}

function stage(to: OpportunityStatus, label: string): OppStageHandler {
  return async (oppId) => {
    // advanceOpportunity is idempotent (from==to no-op) and rejects illegal hops, so a retried job is
    // safe and a mis-routed one throws instead of corrupting the lifecycle.
    await advanceOpportunity(oppId, to, { agent: "opp-mock", reason: `mock ${label}` });
  };
}

export const oppPropose = stage("proposed", "plan");
export const oppBuild = stage("demo_ready", "build");
export const oppOutreach = stage("in_outreach", "outreach");

export const oppOnboard: OppStageHandler = async (oppId) => {
  const cur = await readStatus(oppId);
  if (!cur) return;
  const next = onboardNextStatus(cur);
  if (next) {
    await advanceOpportunity(oppId, next, { agent: "opp-mock", reason: `mock onboard ${cur} -> ${next}` });
  }
};

/**
 * Map of queue name -> MOCK handler for every NON-website service line. The dispatcher enqueues to
 * these exact queue names (SERVICE_QUEUES + OUTREACH_QUEUE), so registering a consumer per key wires
 * the whole expansion pipeline. Website is skipped (its queues belong to the lead agents).
 */
export function mockOpportunityHandlers(): Map<string, OppStageHandler> {
  const m = new Map<string, OppStageHandler>();
  for (const svc of SERVICE_TYPES) {
    if (svc === "website") continue;
    const q = SERVICE_QUEUES[svc];
    m.set(q.propose, oppPropose);
    m.set(q.build, oppBuild);
    m.set(q.onboard, oppOnboard);
  }
  m.set(OUTREACH_QUEUE, oppOutreach);
  return m;
}
