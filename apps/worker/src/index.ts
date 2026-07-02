// Agency Autopilot worker: one process consumes every agent queue via pg-boss (spec §2.1).
// A small scheduler scans for leads sitting in a trigger status and enqueues the owning agent's
// job (singleton-keyed on lead+status: idempotent, spec §4.4). Agents advance the state machine;
// the scheduler notices the new status and enqueues the next agent. Illegal transitions throw
// inside advanceLead and surface as error events.

import PgBoss from "pg-boss";
import { emitEvent, getPool, type LeadStatus } from "@autopilot/core";
import { AGENTS, AGENT_BY_TRIGGER, STUB_HANDLERS } from "@autopilot/agents";

const MOCK = process.env.MOCK_MODE !== "false";

async function main(): Promise<void> {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  const pool = getPool();

  const boss = new PgBoss({ connectionString: url, schema: "pgboss" });
  boss.on("error", (err) => console.error("[pg-boss]", err.message));
  await boss.start();

  // one consumer per agent queue
  for (const agent of AGENTS) {
    await boss.work<{ leadId: string }>(agent.queue, { teamSize: 2 }, async (job) => {
      const handler = STUB_HANDLERS[agent.name];
      if (!handler) return; // research/monitor have no status-triggered stub yet
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

  // scheduler: enqueue the owning agent for any lead sitting in a trigger status
  const TRIGGERS = [...AGENT_BY_TRIGGER.keys()];
  setInterval(async () => {
    try {
      const r = await pool.query<{ id: string; status: LeadStatus }>(
        `select id, status from leads where status = any($1::lead_status[]) limit 50`,
        [TRIGGERS],
      );
      for (const lead of r.rows) {
        const agent = AGENT_BY_TRIGGER.get(lead.status);
        if (!agent) continue;
        await boss.send(
          agent.queue,
          { leadId: lead.id },
          { singletonKey: `${lead.id}:${lead.status}`, singletonSeconds: 30, retryLimit: 3, retryBackoff: true },
        );
      }
    } catch (err) {
      console.error("[scheduler]", (err as Error).message);
    }
  }, 2000);

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
