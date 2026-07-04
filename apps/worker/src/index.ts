// Agency Autopilot worker: one process consumes every agent queue via pg-boss (spec §2.1).
// A small scheduler scans for leads sitting in a trigger status and enqueues the owning agent's
// job (singleton-keyed on lead+status: idempotent, spec §4.4). Agents advance the state machine;
// the scheduler notices the new status and enqueues the next agent. Illegal transitions throw
// inside advanceLead and surface as error events.

import PgBoss from "pg-boss";
import { emitEvent, getPool, type LeadStatus } from "@autopilot/core";
import { AGENTS, AGENT_BY_TRIGGER, STUB_HANDLERS, research, realScrape, realQualify, realAnalyzer, realSolution, realUiux, realBuilder, realQa, realSales, approveAndSend, ingestReply, ingestBooking, monitorHourly, dailyDigest } from "@autopilot/agents";
import { usedToday, loadCaps } from "@autopilot/adapters";

const MOCK = process.env.MOCK_MODE !== "false";

async function main(): Promise<void> {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  const pool = getPool();

  // Single-worker advisory lock (Phase 7 hardening; PROGRESS.md incidents: a second worker running
  // stale code twice caused retry storms and fixture contamination). The lock is session-scoped on a
  // dedicated client held for the process lifetime; a second worker exits instead of double-running.
  const lockClient = await pool.connect();
  const lock = await lockClient.query<{ ok: boolean }>("select pg_try_advisory_lock(hashtext('autopilot_worker')) as ok");
  if (!lock.rows[0].ok) {
    console.error("[worker] another worker already holds the advisory lock for this database. Exiting.");
    lockClient.release();
    process.exit(1);
  }

  // Mock-on-real-data guard (Phase 7; this class of incident happened TWICE): fixture stubs must
  // never run against a database holding real leads — they fixture-advance real prospects and
  // contaminate the CRM. If MOCK_MODE=true and real-sourced leads exist, refuse to start unless
  // the operator explicitly overrides (MOCK_ON_REAL_DB=allow, for surgical debugging only).
  if (MOCK && process.env.MOCK_ON_REAL_DB !== "allow") {
    const real = await pool.query<{ n: string }>(
      "select count(*)::text n from leads where source in ('places','legacy')",
    );
    if (real.rows[0].n !== "0") {
      console.error(
        `[worker] REFUSING to run MOCK stubs: this database holds ${real.rows[0].n} real leads. ` +
          `Use MOCK_MODE=false, or point DATABASE_URL at a scratch database, or set MOCK_ON_REAL_DB=allow if you really mean it.`,
      );
      lockClient.release();
      process.exit(1);
    }
  }

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
    uiux: realUiux,
    builder: realBuilder,
    qa: realQa,
    sales: realSales,
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
  const caps = loadCaps();
  const placesCap = caps.places_calls_per_day;
  const buildCap = caps.concurrent_demo_builds; // spec §9: cap concurrent demo builds (default 2)
  // Fresh builds are gated by a concurrency cap; a lead already mid-build (a QA-fix re-entry) is
  // NOT gated (it must finish). So only design_ready/closed_won are throttled by buildCap.
  const FRESH_BUILD: readonly LeadStatus[] = ["design_ready", "closed_won"];
  setInterval(async () => {
    // skip scrape scheduling once the Places budget is spent for the day (no retry churn)
    const placesSpent = await usedToday("places.call").catch(() => 0);
    const buildingNow = Number(
      (await pool.query<{ n: string }>(`select count(*)::text n from leads where status in ('demo_building','final_building')`).catch(() => ({ rows: [{ n: "0" }] }))).rows[0].n,
    );
    for (const [status, agent] of handledTriggers) {
      if (agent.name === "scrape" && placesSpent >= placesCap) continue;
      // hold fresh builds when the concurrent-build cap is reached (best leads go first, below)
      if (agent.name === "builder" && FRESH_BUILD.includes(status) && buildingNow >= buildCap) continue;
      try {
        // builder picks the best leads first (spec §9: score desc); everything else is oldest-first.
        const orderBy = agent.name === "builder" ? "coalesce(score,0) desc, updated_at asc" : "updated_at asc";
        const limit = agent.name === "builder" && FRESH_BUILD.includes(status) ? Math.max(0, buildCap - buildingNow) : 10;
        const r = await pool.query<{ id: string }>(
          `select id from leads where status = $1::lead_status order by ${orderBy} limit ${limit}`,
          [status],
        );
        for (const lead of r.rows) {
          await boss.send(
            agent.queue,
            { leadId: lead.id },
            // singletonSeconds must EXCEED the slowest job (analyzer: PageSpeed up to ~90s +
            // screenshots + Sonnet vision). A shorter window re-enqueues a lead that is still
            // being processed, piling up thousands of duplicate jobs (PROGRESS.md incident).
            { singletonKey: `${lead.id}:${status}`, singletonSeconds: 300, retryLimit: 3, retryBackoff: true },
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

  // Phase 5 operator actions ride the DB (dashboard stays dependency-light; the worker executes the
  // agent logic that owns the deps). Approvals: the operator flips an email to 'approved' in the
  // Outbox; the worker gate-checks + sends. Simulated reply/booking arrive as dev events.
  setInterval(async () => {
    try {
      const approved = await pool.query<{ idempotency_key: string }>(
        "select idempotency_key from emails where status='approved' and idempotency_key is not null limit 5");
      for (const e of approved.rows) await approveAndSend(e.idempotency_key).catch((err) => console.error("[approve]", (err as Error).message));

      const replies = await pool.query<{ id: string; payload: { leadId: string; text?: string; classification?: string } }>(
        `select id, payload from agent_events e where e.type='dev.reply_requested'
           and not exists (select 1 from agent_events s where s.type='dev.reply_processed' and s.payload->>'request_id'=e.id::text) limit 5`);
      for (const req of replies.rows) {
        await ingestReply(req.payload.leadId, req.payload.text ?? "interested, tell me more", req.payload.classification).catch((err) => console.error("[reply]", (err as Error).message));
        await emitEvent({ agent: "sales", type: "dev.reply_processed", level: "debug", payload: { request_id: req.id } });
      }

      // bookings arrive from the dev panel (dev.booking_requested) or the real Cal.com webhook
      // (booking.received, inserted by the dashboard's /api/webhooks/calcom after HMAC verification)
      const bookings = await pool.query<{ id: string; payload: { leadId: string; title?: string; startTime?: string; attendee?: unknown } }>(
        `select id, payload from agent_events e where e.type in ('dev.booking_requested','booking.received')
           and not exists (select 1 from agent_events s where s.type='dev.booking_processed' and s.payload->>'request_id'=e.id::text) limit 5`);
      for (const req of bookings.rows) {
        await ingestBooking(req.payload.leadId, { title: req.payload.title, startTime: req.payload.startTime, attendee: req.payload.attendee }).catch((err) => console.error("[booking]", (err as Error).message));
        await emitEvent({ agent: "sales", type: "dev.booking_processed", level: "debug", payload: { request_id: req.id } });
      }
    } catch (err) {
      console.error("[outbox-poll]", (err as Error).message);
    }
  }, 3000);

  await emitEvent({ agent: "worker", type: "worker.started", message: `worker online (mock=${MOCK})` });
  setInterval(() => {
    emitEvent({ agent: "worker", type: "worker.heartbeat", level: "debug" }).catch((e) =>
      console.error("[heartbeat]", e.message),
    );
  }, 60_000);

  // Monitoring (spec §6.10): hourly anomaly sweep + a daily digest at 09:00 IST. Both are
  // idempotent (anomalies dedupe on message per 12h; the digest upserts on date), so the minutely
  // tick is safe: it fires each job at most once per its window.
  let lastHourly = 0;
  let lastDigestDay = "";
  setInterval(async () => {
    try {
      const now = new Date();
      if (Date.now() - lastHourly >= 60 * 60 * 1000) {
        lastHourly = Date.now();
        await monitorHourly();
      }
      // 09:00 IST = 03:30 UTC. Fire once per calendar day when the wall clock passes it.
      const istNow = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
      const istDay = istNow.toISOString().slice(0, 10);
      if (istNow.getUTCHours() >= 9 && lastDigestDay !== istDay) {
        lastDigestDay = istDay;
        await dailyDigest();
      }
    } catch (err) {
      console.error("[monitor]", (err as Error).message);
    }
  }, 60_000);

  console.log(`[worker] up. agents: ${AGENTS.map((a) => a.name).join(", ")} | mock=${MOCK}`);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
