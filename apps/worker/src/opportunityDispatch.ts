// Opportunity scheduler (MASTER_SPEC §8.3/§8.4 — the agency spine, wiring slice). Reads live
// opportunities, computes the plan with the pure `planOpportunityDispatch`, and acts on it. This is
// the bridge between the tested decision layer (packages/core) and the running worker.
//
// SAFETY (why this is flag-gated OFF by default):
//   - Scope: NON-website service lines only. Website opportunities mirror lead_status and are already
//     driven by the lead scheduler in index.ts; processing them here too would double-run the build.
//   - `off`     — never runs (default). The live website pipeline is completely undisturbed.
//   - `shadow`  — reads + emits an `opportunity.dispatch_plan` observability event. No mutations.
//   - `execute` — additionally performs the SAFE, idempotent gate transitions (park a proposed
//                 solution at the spend gate; admit an approved/in-budget one to `building`) via the
//                 tested advanceOpportunity. Enqueue is attempted defensively because the chatbot/
//                 voice/automation worker handlers are still MOCK-stubbed (NEEDS_FROM_OPERATOR.md);
//                 a missing queue consumer just leaves the job parked, it never throws the batch.
//
// End-to-end runtime verification needs a Postgres with real opportunities; until then this ships
// gated so the routing exists and is reviewable without risking the live flow.

import { loadCaps, resolveBuildMode } from "@autopilot/adapters";
import {
  type OppGateContext,
  type OpportunityRow,
  WEBSITE_UNLOCK_LEAD_STATUSES,
  advanceOpportunity,
  emitEvent,
  getPool,
  notifyOperator,
  planOpportunityDispatch,
} from "@autopilot/core";
import type PgBoss from "pg-boss";

export type OpportunityDispatchMode = "off" | "shadow" | "execute";

export function resolveOpportunityDispatchMode(): OpportunityDispatchMode {
  const v = (process.env.OPPORTUNITY_DISPATCH ?? "off").toLowerCase();
  return v === "execute" ? "execute" : v === "shadow" ? "shadow" : "off";
}

// approval event carries the opportunity id; admission event marks a consumed build slot (idempotent
// budget accounting, mirrors the lead flow's build.gate_admitted).
const APPROVED_EVENT = "opportunity.build_approved";
const ADMITTED_EVENT = "opportunity.build_admitted";

/**
 * One dispatch pass over the non-website opportunities. `mode` gates side effects (see file header).
 * Returns the plan summary for logging. Never throws for a single-row failure — each mutation is
 * isolated so one bad row can't stall the batch.
 */
export async function runOpportunityDispatch(boss: PgBoss, mode: OpportunityDispatchMode): Promise<void> {
  if (mode === "off") return;
  const pool = getPool();

  // Non-website, non-terminal opportunities + whether an operator approval exists, + whether the
  // owning lead's WEBSITE opportunity is won (closed_won/onboarding/live) — the expansion unlock.
  const rowsRes = await pool.query<{
    id: string;
    lead_id: string;
    service_type: OpportunityRow["service_type"];
    status: OpportunityRow["status"];
    score: number | null;
    approved: boolean;
    website_unlocked: boolean;
  }>(
    // website_unlocked derives from the AUTHORITATIVE lead status (the website line is a projection of
    // the lead flow), so no website-opportunity row has to be kept in sync for the hold to be correct.
    `select o.id, o.lead_id, o.service_type, o.status, o.score,
            exists(select 1 from agent_events e
                   where e.type = $1 and e.payload->>'opportunityId' = o.id::text) as approved,
            exists(select 1 from leads l
                   where l.id = o.lead_id and l.status = any($2::lead_status[])) as website_unlocked
     from opportunities o
     where o.service_type <> 'website'
       and o.status not in ('churned','closed_lost')
     order by coalesce(o.score,0) desc, o.updated_at asc
     limit 50`,
    [APPROVED_EVENT, [...WEBSITE_UNLOCK_LEAD_STATUSES]],
  );
  if (rowsRes.rows.length === 0) return; // nothing to do (no non-website opportunities yet)
  const rows: OpportunityRow[] = rowsRes.rows.map((r) => ({
    id: r.id,
    lead_id: r.lead_id,
    service_type: r.service_type,
    status: r.status,
    score: r.score,
    approved: r.approved,
    websiteUnlocked: r.website_unlocked,
  }));

  // Daily build budget shared across all opportunities (mirrors the lead gate accounting).
  const caps = loadCaps();
  const budget = caps.build_budget;
  const maxBuildsPerDay = Math.max(0, Math.floor(budget.usd_per_day / budget.usd_per_lead));
  const admittedRes = await pool
    .query<{ n: string }>(
      `select count(*)::text n from agent_events
       where type = $1 and created_at >= date_trunc('day', now())`,
      [ADMITTED_EVENT],
    )
    .catch(() => ({ rows: [{ n: "0" }] }));
  const admittedToday = Number(admittedRes.rows[0].n);
  const budgetRemainingUsd = Math.max(0, maxBuildsPerDay - admittedToday) * budget.usd_per_lead;

  const buildMode = resolveBuildMode(
    (
      await pool
        .query<{ value: unknown }>("select value from settings where key='build_mode'")
        .catch(() => ({ rows: [] as Array<{ value: unknown }> }))
    ).rows[0]?.value,
  );

  const gate: OppGateContext = { mode: buildMode, budgetRemainingUsd, estCostUsd: budget.usd_per_lead };
  const plan = planOpportunityDispatch(rows, gate);

  // Always emit the plan summary — this is the shadow observability signal.
  await emitEvent({
    agent: "scheduler",
    level: "debug",
    type: "opportunity.dispatch_plan",
    message: `opp dispatch (${mode}): ${plan.enqueue.length} enqueue, ${plan.parkAtGate.length} park, ${plan.admitToBuild.length} admit, ${plan.held.length} held, ${plan.waiting.length} waiting`,
    payload: {
      mode,
      buildMode,
      budgetRemainingUsd,
      enqueue: plan.enqueue.length,
      park: plan.parkAtGate.length,
      admit: plan.admitToBuild.length,
      held: plan.held.length,
      waiting: plan.waiting.length,
      queues: [...new Set(plan.enqueue.map((e) => e.queue))],
    },
  }).catch(() => undefined);

  if (mode !== "execute") return;

  // --- execute: the SAFE idempotent gate transitions first ---
  // Park proposed solutions at the spend gate (free hop + one-time operator notify). advanceOpportunity
  // is idempotent (from==to → no-op), so a re-tick never re-parks or re-notifies an already-parked opp.
  for (const p of plan.parkAtGate) {
    try {
      const moved = await advanceOpportunity(p.oppId, "awaiting_build_approval", {
        agent: "scheduler",
        reason: p.reason,
      });
      if (moved.from !== moved.to) {
        await notifyOperator({
          type: "opportunity.awaiting_build_approval",
          title: "Opportunity awaiting build approval",
          body: p.reason,
          leadId: moved.leadId ?? undefined,
        }).catch(() => undefined);
      }
    } catch (err) {
      console.error("[opp-park]", (err as Error).message);
    }
  }

  // Admit gate-passed opportunities to building. Emit the admission event FIRST (budget accounting is
  // admission-time + idempotent), then advance. If the advance fails the event is harmless (the opp
  // stays at the gate and is re-evaluated next tick against the now-decremented budget).
  for (const a of plan.admitToBuild) {
    try {
      await emitEvent({
        agent: "scheduler",
        leadId: undefined,
        type: ADMITTED_EVENT,
        level: "info",
        message: `admitted opportunity to build (${buildMode}): ${a.reason}`,
        payload: { opportunityId: a.oppId, mode: buildMode, est_cost_usd: budget.usd_per_lead },
      });
      await advanceOpportunity(a.oppId, "building", { agent: "scheduler", reason: a.reason });
    } catch (err) {
      console.error("[opp-admit]", (err as Error).message);
    }
  }

  // Enqueue ready work. The service-specific handlers are still MOCK-stubbed, so a send to a queue with
  // no consumer simply parks the job (pg-boss holds it); we guard each send so a not-yet-created queue
  // can't throw the whole pass. singletonKey dedupes re-ticks of the same opportunity+status.
  for (const e of plan.enqueue) {
    try {
      await boss.send(
        e.queue,
        { opportunityId: e.oppId, leadId: e.leadId },
        { singletonKey: `${e.oppId}:${e.queue}`, singletonSeconds: 300, retryLimit: 3, retryBackoff: true },
      );
    } catch (err) {
      console.error(`[opp-enqueue ${e.queue}]`, (err as Error).message);
    }
  }
}
