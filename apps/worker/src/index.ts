// Agency Autopilot worker: one process consumes every agent queue via pg-boss (spec §2.1).
// A small scheduler scans for leads sitting in a trigger status and enqueues the owning agent's
// job (singleton-keyed on lead+status: idempotent, spec §4.4). Agents advance the state machine;
// the scheduler notices the new status and enqueues the next agent. Illegal transitions throw
// inside advanceLead and surface as error events.

import PgBoss from "pg-boss";
import { emitEvent, getPool, type LeadStatus } from "@autopilot/core";
import { AGENTS, AGENT_BY_TRIGGER, STUB_HANDLERS, research, realScrape, realQualify, realAnalyzer, realSolution } from "@autopilot/agents";

const MOCK = process.env.MOCK_MODE !== "false";

async function main(): Promise<void> {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  const pool = getPool();

  const boss = new PgBoss({ connectionString: url, schema: "pgboss" });
  boss.on("error", (err) => console.error("[pg-boss]", err.message));
  await boss.start();

  // Handler selection (spec §2.6 mock adapters): MOCK_MODE uses stubs end to end; real mode uses
  // real agents where implemented (Phase 2: scrape, qualify) and PAUSES at un-implemented stages
  // rather than running fixture stubs against real leads.
  const REAL_HANDLERS: Record<string, (leadId: string) => Promise<void>> = {
    scrape: realScrape,
    qualify: realQualify,
    analyzer: realAnalyzer,
    solution: realSolution,
  };
  const handlers = MOCK ? STUB_HANDLERS : REAL_HANDLERS;

  // one consumer per agent queue
  for (const agent of AGENTS) {
    await boss.work<{ leadId: string }>(agent.queue, { teamSize: 2 }, async (job) => {
      const handler = handlers[agent.name];
      if (!handler) return; // not yet implemented for this mode: lead waits, nothing fabricated
      try {
        await handler(job.data.leadId);
      } catch (err) {
        await emitEvent({
          agent: agent.name,
          leadId: job.data.leadId,
          level: "error",
          type: `${agent.name}.failed`,
          message: (err as Error).message,
        });
        throw err; // let pg-boss retry (max 3, spec §6)
      }
    });
  }

  // Scheduler: enqueue the owning agent for any lead sitting in a trigger status.
  // FAIRNESS: query per status (oldest-updated first, bounded) so a crowd in one status can
  // never starve another (a flat LIMIT across all statuses did exactly that; PROGRESS.md).
  // Only statuses whose agent has a handler in this mode are scheduled: no no-op job churn.
  const handledTriggers = [...AGENT_BY_TRIGGER.entries()].filter(([, a]) => Boolean(handlers[a.name]));
  setInterval(async () => {
    for (const [status, agent] of handledTriggers) {
      try {
        const r = await pool.query<{ id: string }>(
          `select id from leads where status = $1::lead_status order by updated_at asc limit 10`,
          [status],
        );
        for (const lead of r.rows) {
          await boss.send(
            agent.queue,
            { leadId: lead.id },
            { singletonKey: `${lead.id}:${status}`, singletonSeconds: 30, retryLimit: 3, retryBackoff: true },
          );
        }
      } catch (err) {
        console.error("[scheduler]", (err as Error).message);
      }
    }
  }, 2000);

  // operator-triggered research requests ride the event stream (research.requested -> started)
  await boss.work<{ requestId: string; count: number }>("agent:research-run", { teamSize: 1 }, async (job) => {
    await research(job.data.requestId, job.data.count);
  });
  setInterval(async () => {
    try {
      const r = await pool.query<{ id: string; payload: { count?: number } }>(
        `select e.id, e.payload from agent_events e
         where e.type = 'research.requested'
           and not exists (select 1 from agent_events s where s.type = 'research.started' and s.payload->>'request_id' = e.id::text)
         limit 5`,
      );
      for (const req of r.rows) {
        await boss.send("agent:research-run", { requestId: req.id, count: req.payload?.count ?? 50 }, { singletonKey: req.id, retryLimit: 2 });
      }
    } catch (err) {
      console.error("[research-poll]", (err as Error).message);
    }
  }, 3000);

  await emitEvent({ agent: "worker", type: "worker.started", message: `worker online (mock=${MOCK})` });
  setInterval(() => {
    emitEvent({ agent: "worker", type: "worker.heartbeat", level: "debug" }).catch((e) =>
      console.error("[heartbeat]", e.message),
    );
  }, 60_000);

  console.log(`[worker] up. agents: ${AGENTS.map((a) => a.name).join(", ")} | mock=${MOCK}`);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
