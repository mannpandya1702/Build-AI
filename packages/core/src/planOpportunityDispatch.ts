// The OPPORTUNITY scheduler plan (MASTER_SPEC §2, §8.4). Pure decision layer between the dispatch
// router (what should happen to ONE opportunity) and the worker loop (which does the DB I/O). Given a
// batch of opportunity rows + the day's gate context, it returns exactly what the scheduler should do:
// which queues to enqueue, which solutions to park at the spend gate, which gated opportunities to
// admit to a paid build (best scores first, until the daily budget runs out), and what is waiting.
//
// Pure and DB-free so the spend accounting is unit-tested, not buried in a setInterval. It reuses the
// already-tested `canRunBuild` rule for admission — the gate logic exists in exactly one place.

import { type BuildMode, canRunBuild } from "./buildGate.js";
import { type DispatchAction, dispatchOpportunity } from "./dispatchOpportunity.js";
import type { OpportunityStatus, ServiceType } from "./opportunityStatuses.js";

export interface OpportunityRow {
  id: string;
  lead_id: string;
  service_type: ServiceType;
  status: OpportunityStatus;
  /** a build-approval event exists for this opportunity (operator approved the paid build) */
  approved: boolean;
  /** owning lead's score — used only to order gate admission (best first) */
  score: number | null;
  /**
   * The owning lead's WEBSITE opportunity has been won (closed_won / onboarding / live). Expansion
   * lines (chatbot/voice/automation) may only START selling after the website closes (CLAUDE.md §1:
   * "sell it AFTER the close, never in cold outreach"), so a non-website opportunity is held at
   * `identified` until this is true. Defaults to false (held) when omitted.
   */
  websiteUnlocked?: boolean;
}

export interface OppGateContext {
  mode: BuildMode;
  /** USD of build budget still available today across ALL opportunities */
  budgetRemainingUsd: number;
  /** projected USD cost of one build */
  estCostUsd: number;
}

export interface OpportunityPlan {
  /** enqueue this pg-boss queue for this opportunity (work is ready + automatable) */
  enqueue: Array<{ oppId: string; leadId: string; queue: string; reason: string }>;
  /** free hop proposed -> awaiting_build_approval + notify operator (no spend) */
  parkAtGate: Array<{ oppId: string; leadId: string; reason: string }>;
  /** gate passed: advance awaiting_build_approval -> building (consumes one budget slot) */
  admitToBuild: Array<{ oppId: string; leadId: string; reason: string }>;
  /** expansion line held at `identified` until the website closes (CLAUDE.md §1: sell after the close) */
  held: Array<{ oppId: string; leadId: string; reason: string }>;
  /** nothing to do: waiting on operator/prospect, live steady-state, or terminal */
  waiting: Array<{ oppId: string; kind: DispatchAction["kind"]; reason: string }>;
}

/**
 * Plan a batch of opportunities. The gate (awaiting_build_approval) is the only place real spend is
 * authorized: candidates are admitted best-score-first and each admission consumes one build slot
 * from the running budget, so the daily ceiling is a hard limit exactly as `canRunBuild` enforces it.
 * Every other status is routed by `dispatchOpportunity` and either enqueued, parked, or left waiting.
 */
export function planOpportunityDispatch(rows: OpportunityRow[], gate: OppGateContext): OpportunityPlan {
  const plan: OpportunityPlan = { enqueue: [], parkAtGate: [], admitToBuild: [], held: [], waiting: [] };
  let budgetUsd = gate.budgetRemainingUsd;

  // Gate fairness: process best scores first (nulls last) so a low-value opportunity never consumes a
  // build slot ahead of a high-value one when the budget is tight. Stable for equal scores.
  const ordered = [...rows].sort((a, b) => (b.score ?? -1) - (a.score ?? -1));

  for (const row of ordered) {
    // Expansion-hold (CLAUDE.md §1): an expansion line can't START selling until the website closes.
    // Hold non-website opportunities at their entry (`identified`) until the website is won. Once
    // unlocked and moved past identified, they flow normally through the gate + build like any other.
    if (row.service_type !== "website" && row.status === "identified" && !row.websiteUnlocked) {
      plan.held.push({
        oppId: row.id,
        leadId: row.lead_id,
        reason: `${row.service_type}: expansion held until the website closes`,
      });
      continue;
    }

    const action = dispatchOpportunity(row.service_type, row.status);
    switch (action.kind) {
      case "enqueue":
        plan.enqueue.push({
          oppId: row.id,
          leadId: row.lead_id,
          queue: action.queue,
          reason: action.reason,
        });
        break;
      case "park_at_gate":
        plan.parkAtGate.push({ oppId: row.id, leadId: row.lead_id, reason: action.reason });
        break;
      case "await_operator":
        // The spend gate: only `awaiting_build_approval` is admissible; `paused` (dunning) just waits.
        if (row.status === "awaiting_build_approval") {
          const decision = canRunBuild({
            mode: gate.mode,
            hasApproval: row.approved,
            budgetRemainingUsd: budgetUsd,
            estCostUsd: gate.estCostUsd,
          });
          if (decision.allowed) {
            plan.admitToBuild.push({ oppId: row.id, leadId: row.lead_id, reason: decision.reason });
            budgetUsd -= gate.estCostUsd; // consume one slot; the ceiling is hard in both modes
          } else {
            plan.waiting.push({ oppId: row.id, kind: action.kind, reason: decision.reason });
          }
        } else {
          plan.waiting.push({ oppId: row.id, kind: action.kind, reason: action.reason });
        }
        break;
      default:
        // await_prospect | operate | terminal — inert this tick
        plan.waiting.push({ oppId: row.id, kind: action.kind, reason: action.reason });
    }
  }

  return plan;
}
