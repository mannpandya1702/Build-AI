// Agency Autopilot worker: one process consumes every agent queue via pg-boss (spec §2.1).
// A small scheduler scans for leads sitting in a trigger status and enqueues the owning agent's
// job (singleton-keyed on lead+status: idempotent, spec §4.4). Agents advance the state machine;
// the scheduler notices the new status and enqueues the next agent. Illegal transitions throw
// inside advanceLead and surface as error events.

import { loadCaps, resolveBuildMode, usedToday } from "@autopilot/adapters";
import {
  AGENTS,
  AGENT_BY_TRIGGER,
  STUB_HANDLERS,
  approveAndSend,
  dailyDigest,
  ingestBooking,
  ingestReply,
  monitorHourly,
  realAnalyzer,
  realBuilder,
  realQa,
  realQualify,
  realSales,
  realScrape,
  realSolution,
  realUiux,
  research,
} from "@autopilot/agents";
import {
  type LeadStatus,
  advanceLead,
  canRunBuild,
  emitEvent,
  getPool,
  notifyOperator,
} from "@autopilot/core";
import PgBoss from "pg-boss";
import { readDemoBatch } from "./batch.js";
import { bridgeCycle } from "./bridge.js";
import { resolveOpportunityDispatchMode, runOpportunityDispatch } from "./opportunityDispatch.js";

const MOCK = process.env.MOCK_MODE !== "false";

async function main(): Promise<void> {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  const pool = getPool();

  // Single-worker advisory lock (Phase 7 hardening; PROGRESS.md incidents: a second worker running
  // stale code twice caused retry storms and fixture contamination). The lock is session-scoped on a
  // dedicated client held for the process lifetime; a second worker exits instead of double-running.
  const lockClient = await pool.connect();
  const lock = await lockClient.query<{ ok: boolean }>(
    "select pg_try_advisory_lock(hashtext('autopilot_worker')) as ok",
  );
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
        `[worker] REFUSING to run MOCK stubs: this database holds ${real.rows[0].n} real leads. Use MOCK_MODE=false, or point DATABASE_URL at a scratch database, or set MOCK_ON_REAL_DB=allow if you really mean it.`,
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

  // Operator kill switch (dashboard "Worker" toggle): settings.worker_enabled gates all NEW work
  // (scheduler, research + operator-action polls). In-flight jobs drain naturally; heartbeat,
  // monitoring, and the bridge keep running while paused so status stays live and hosted toggles
  // reach us. Default is PAUSED: a freshly booted worker never starts spending until the operator
  // flips it on.
  let workerEnabled = false;
  await pool.query(
    `insert into settings (key, value) values ('worker_enabled', '"false"'::jsonb) on conflict (key) do nothing`,
  );
  async function refreshEnabled(): Promise<void> {
    const r = await pool.query<{ value: unknown }>("select value from settings where key='worker_enabled'");
    const next = String(r.rows[0]?.value ?? "false").replace(/"/g, "") === "true";
    if (next !== workerEnabled) {
      workerEnabled = next;
      await emitEvent({
        agent: "worker",
        type: next ? "worker.resumed" : "worker.paused",
        message: `processing ${next ? "resumed" : "paused"} by operator`,
      });
      console.log(`[worker] processing ${next ? "RESUMED" : "PAUSED"}`);
    }
  }
  await refreshEnabled();

  // one consumer per agent queue
  for (const agent of AGENTS) {
    await boss.work<{ leadId: string }>(agent.queue, { teamSize: 2 }, async (job) => {
      // Paused: complete the job as a no-op. Nothing is lost — jobs are derived from lead status,
      // so the scheduler re-enqueues pending work the moment processing resumes. Without this gate a
      // stale queue backlog drains into handlers right through a pause (observed live).
      if (!workerEnabled) return;
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
  // Seed the spend-gate settings so the dashboard Shortlist can read the projected per-lead cost and
  // the current mode. build_budget mirrors caps.yaml; build_mode defaults to review (never auto).
  await pool
    .query(
      `insert into settings (key, value) values ('build_budget', $1::jsonb)
       on conflict (key) do update set value = excluded.value`,
      [JSON.stringify(caps.build_budget)],
    )
    .catch(() => undefined);
  await pool
    .query(
      `insert into settings (key, value) values ('build_mode', '"review"'::jsonb) on conflict (key) do nothing`,
    )
    .catch(() => undefined);
  const placesCap = caps.places_calls_per_day;
  const buildCap = caps.concurrent_demo_builds; // spec §9: cap concurrent demo builds (default 2)
  // Fresh builds are gated by a concurrency cap; a lead already mid-build (a QA-fix re-entry) is
  // NOT gated (it must finish). So only design_ready/closed_won are throttled by buildCap.
  const FRESH_BUILD: readonly LeadStatus[] = ["design_ready", "closed_won"];
  setInterval(async () => {
    await refreshEnabled().catch(() => undefined);
    if (!workerEnabled) return; // paused: schedule nothing (in-flight jobs drain)
    // skip scrape scheduling once the Places budget is spent for the day (no retry churn)
    const placesSpent = await usedToday("places.call").catch(() => 0);
    const buildingNow = Number(
      (
        await pool
          .query<{ n: string }>(
            `select count(*)::text n from leads where status in ('demo_building','final_building')`,
          )
          .catch(() => ({ rows: [{ n: "0" }] }))
      ).rows[0].n,
    );

    // --- Spend gate (MASTER_SPEC §2): the operator approves before any paid build ---
    // (1) Park qualified leads at the gate and notify the operator once (free, no spend).
    const toGate = await pool
      .query<{ id: string; company_name: string; score: number | null }>(
        `select id, company_name, score from leads where status='qualified'
         order by coalesce(score,0) desc, updated_at asc limit 20`,
      )
      .catch(() => ({ rows: [] as Array<{ id: string; company_name: string; score: number | null }> }));
    for (const l of toGate.rows) {
      try {
        await advanceLead(l.id, "awaiting_build_approval", {
          agent: "scheduler",
          reason: "qualified — awaiting operator build approval",
        });
        await notifyOperator({
          type: "lead.awaiting_build_approval",
          title: "Lead awaiting build approval",
          body: `${l.company_name} qualified (score ${l.score ?? "—"}) — approve to build a demo`,
          leadId: l.id,
        });
      } catch (e) {
        console.error("[gate-hop]", (e as Error).message);
      }
    }
    // (2) Build mode + daily build budget (one admission = one usd_per_lead slot).
    const buildMode = resolveBuildMode(
      (
        await pool
          .query<{ value: unknown }>("select value from settings where key='build_mode'")
          .catch(() => ({ rows: [] as Array<{ value: unknown }> }))
      ).rows[0]?.value,
    );
    const buildBudget = caps.build_budget;
    const maxBuildsPerDay = Math.max(0, Math.floor(buildBudget.usd_per_day / buildBudget.usd_per_lead));
    const admittedToday = Number(
      (
        await pool
          .query<{ n: string }>(
            `select count(distinct lead_id)::text n from agent_events
             where type='build.gate_admitted' and created_at >= date_trunc('day', now())`,
          )
          .catch(() => ({ rows: [{ n: "0" }] }))
      ).rows[0].n,
    );
    let buildBudgetRemaining = Math.max(0, maxBuildsPerDay - admittedToday);

    for (const [status, agent] of handledTriggers) {
      if (agent.name === "scrape" && placesSpent >= placesCap) continue;
      // hold fresh builds when the concurrent-build cap is reached (best leads go first, below)
      if (agent.name === "builder" && FRESH_BUILD.includes(status) && buildingNow >= buildCap) continue;
      try {
        // Spend gate: admit awaiting_build_approval leads to PAID analysis only when the gate allows
        // (review: an operator `lead.build_approved` event exists; auto: within the daily build
        // budget), top scores first. A `build.gate_admitted` event marks admission so budget
        // accounting is idempotent; the generic enqueue is skipped for this status. This is the one
        // place real build spend is authorized (canRunBuild is the tested rule).
        if (agent.name === "analyzer") {
          const enqueueAnalyzer = (leadId: string) =>
            boss.send(
              agent.queue,
              { leadId },
              {
                singletonKey: `${leadId}:${status}`,
                singletonSeconds: 300,
                retryLimit: 3,
                retryBackoff: true,
              },
            );
          // Re-enqueue already-admitted leads still at the gate so a retry-exhausted analyzer never
          // strands a lead (singleton dedupes a live job) — mirrors the demo-batch re-entry rule.
          const admitted = await pool.query<{ id: string }>(
            `select l.id from leads l where l.status = $1::lead_status and exists (
               select 1 from agent_events g where g.lead_id = l.id and g.type = 'build.gate_admitted')`,
            [status],
          );
          for (const l of admitted.rows) await enqueueAnalyzer(l.id);
          if (buildBudgetRemaining <= 0) continue;
          const cands = await pool.query<{ id: string; approved: boolean }>(
            `select l.id,
                    exists(select 1 from agent_events e where e.lead_id = l.id and e.type = 'lead.build_approved') as approved
             from leads l
             where l.status = $1::lead_status
               and not exists(select 1 from agent_events g where g.lead_id = l.id and g.type = 'build.gate_admitted')
             order by coalesce(l.score,0) desc, l.updated_at asc
             limit 20`,
            [status],
          );
          for (const c of cands.rows) {
            if (buildBudgetRemaining <= 0) break;
            const decision = canRunBuild({
              mode: buildMode,
              hasApproval: c.approved,
              budgetRemainingUsd: buildBudgetRemaining * buildBudget.usd_per_lead,
              estCostUsd: buildBudget.usd_per_lead,
            });
            if (!decision.allowed) continue;
            await emitEvent({
              agent: "scheduler",
              leadId: c.id,
              type: "build.gate_admitted",
              level: "info",
              message: `admitted to build (${buildMode}): ${decision.reason}`,
              payload: { mode: buildMode, est_cost_usd: buildBudget.usd_per_lead },
            });
            await enqueueAnalyzer(c.id);
            buildBudgetRemaining -= 1;
          }
          continue; // gate path fully handled this status
        }
        // builder picks the best leads first (spec §9: score desc). Sales puts EMAILABLE leads
        // first: a no-email lead at outreach_ready blocks silently (call-first) but keeps its
        // updated_at, so oldest-first let 12 of them pin all 10 slots and starve every email lead
        // behind them (observed live 2026-07-11: 17 drafts stuck for 30+ min). Everything else is
        // oldest-first.
        const orderBy =
          agent.name === "builder"
            ? "coalesce(score,0) desc, updated_at asc"
            : agent.name === "sales"
              ? "(contact_email is not null) desc, updated_at asc"
              : "updated_at asc";
        const limit =
          agent.name === "builder" && FRESH_BUILD.includes(status) ? Math.max(0, buildCap - buildingNow) : 10;
        // Demo batch (operator: "build the top N demos first"): admission is gated at the uiux
        // trigger, best scores first. Accounting is ADMISSION-time (design.admitted emitted at
        // enqueue; see batch.ts) — completion-only counting let newly qualified high scorers slip
        // in while admitted leads were in flight (batch of 5 admitted 7, live 2026-07-11). Already-
        // admitted leads still sitting at solution_ready are always re-enqueued (singleton dedupes)
        // so a retry-exhausted job never strands a consumed slot. Final builds (closed_won) are a
        // signed deal and are never batch-gated.
        if (agent.name === "uiux") {
          const batch = await readDemoBatch(pool);
          if (batch) {
            const enqueue = (leadId: string) =>
              boss.send(
                agent.queue,
                { leadId },
                {
                  singletonKey: `${leadId}:${status}`,
                  singletonSeconds: 300,
                  retryLimit: 3,
                  retryBackoff: true,
                },
              );
            const admitted = await pool.query<{ id: string }>(
              `select l.id from leads l
               where l.status = $1::lead_status and exists (
                 select 1 from agent_events e
                 where e.lead_id = l.id and e.type = 'design.admitted' and e.created_at > $2)`,
              [status, batch.startedAt],
            );
            for (const lead of admitted.rows) await enqueue(lead.id);
            const remaining = batch.size - batch.used;
            if (remaining <= 0) continue;
            const picks = await pool.query<{ id: string }>(
              `select l.id from leads l
               where l.status = $1::lead_status and not exists (
                 select 1 from agent_events e
                 where e.lead_id = l.id and e.type = 'design.admitted' and e.created_at > $2)
               order by coalesce(l.score,0) desc, (l.contact_email is not null) desc, l.updated_at asc
               limit ${Math.min(10, remaining)}`,
              [status, batch.startedAt],
            );
            for (const lead of picks.rows) {
              await emitEvent({
                agent: "uiux",
                leadId: lead.id,
                type: "design.admitted",
                level: "debug",
                message: "admitted to demo batch (top scores first)",
                payload: { batch_started_at: batch.startedAt, batch_size: batch.size },
              });
              await enqueue(lead.id);
            }
            continue; // batch path fully handled this status
          }
        }
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
            {
              singletonKey: `${lead.id}:${status}`,
              singletonSeconds: 300,
              retryLimit: 3,
              retryBackoff: true,
            },
          );
        }
      } catch (err) {
        console.error("[scheduler]", (err as Error).message);
      }
    }
  }, 2000);

  // Opportunity dispatcher (agency spine, MASTER_SPEC §8.3/§8.4). DEFAULT OFF — see
  // opportunityDispatch.ts for the safety model. Scoped to NON-website service lines (website stays
  // on the lead scheduler above, so nothing double-runs). Serialized so a slow pass never overlaps.
  const oppDispatchMode = resolveOpportunityDispatchMode();
  if (oppDispatchMode !== "off") {
    await emitEvent({
      agent: "worker",
      type: "opportunity.dispatch_enabled",
      message: `opportunity dispatch: ${oppDispatchMode} (non-website service lines)`,
    });
    console.log(`[worker] opportunity dispatch: ${oppDispatchMode}`);
    let oppBusy = false;
    setInterval(async () => {
      if (!workerEnabled || oppBusy) return; // paused or a pass still running: skip this tick
      oppBusy = true;
      try {
        await runOpportunityDispatch(boss, oppDispatchMode);
      } catch (err) {
        console.error("[opp-dispatch]", (err as Error).message);
      } finally {
        oppBusy = false;
      }
    }, 3000);
  }

  // operator-triggered research requests ride the event stream (research.requested -> started).
  // The payload carries the discover panel's targeting (vertical, cities, country).
  await boss.work<{
    requestId: string;
    count: number;
    vertical?: string;
    cities?: string[];
    country?: string;
  }>("agent:research-run", { teamSize: 1 }, async (job) => {
    if (!workerEnabled) return; // no-op; the poll re-finds the request on resume
    await research(job.data.requestId, job.data.count, {
      vertical: job.data.vertical,
      cities: job.data.cities,
      country: job.data.country,
    });
  });
  setInterval(async () => {
    if (!workerEnabled) return;
    try {
      const r = await pool.query<{
        id: string;
        payload: { count?: number; vertical?: string; cities?: string[]; country?: string };
      }>(
        `select e.id, e.payload from agent_events e
         where e.type = 'research.requested'
           and not exists (select 1 from agent_events s where s.type = 'research.started' and s.payload->>'request_id' = e.id::text)
         limit 5`,
      );
      for (const req of r.rows) {
        await boss.send(
          "agent:research-run",
          {
            requestId: req.id,
            count: req.payload?.count ?? 50,
            vertical: req.payload?.vertical,
            cities: req.payload?.cities,
            country: req.payload?.country,
          },
          { singletonKey: req.id, retryLimit: 2 },
        );
      }
    } catch (err) {
      console.error("[research-poll]", (err as Error).message);
    }
  }, 3000);

  // Phase 5 operator actions ride the DB (dashboard stays dependency-light; the worker executes the
  // agent logic that owns the deps). Approvals: the operator flips an email to 'approved' in the
  // Outbox; the worker gate-checks + sends. Simulated reply/booking arrive as dev events.
  setInterval(async () => {
    if (!workerEnabled) return; // paused: approvals/replies/bookings stay queued, processed on resume
    try {
      const approved = await pool.query<{ idempotency_key: string }>(
        "select idempotency_key from emails where status='approved' and idempotency_key is not null limit 5",
      );
      for (const e of approved.rows)
        await approveAndSend(e.idempotency_key).catch((err) =>
          console.error("[approve]", (err as Error).message),
        );

      const replies = await pool.query<{
        id: string;
        payload: { leadId: string; text?: string; classification?: string };
      }>(
        `select id, payload from agent_events e where e.type='dev.reply_requested'
           and not exists (select 1 from agent_events s where s.type='dev.reply_processed' and s.payload->>'request_id'=e.id::text) limit 5`,
      );
      for (const req of replies.rows) {
        await ingestReply(
          req.payload.leadId,
          req.payload.text ?? "interested, tell me more",
          req.payload.classification,
        ).catch((err) => console.error("[reply]", (err as Error).message));
        await emitEvent({
          agent: "sales",
          type: "dev.reply_processed",
          level: "debug",
          payload: { request_id: req.id },
        });
      }

      // bookings arrive from the dev panel (dev.booking_requested) or the real Cal.com webhook
      // (booking.received, inserted by the dashboard's /api/webhooks/calcom after HMAC verification)
      const bookings = await pool.query<{
        id: string;
        payload: { leadId: string; title?: string; startTime?: string; attendee?: unknown };
      }>(
        `select id, payload from agent_events e where e.type in ('dev.booking_requested','booking.received')
           and not exists (select 1 from agent_events s where s.type='dev.booking_processed' and s.payload->>'request_id'=e.id::text) limit 5`,
      );
      for (const req of bookings.rows) {
        await ingestBooking(req.payload.leadId, {
          title: req.payload.title,
          startTime: req.payload.startTime,
          attendee: req.payload.attendee,
        }).catch((err) => console.error("[booking]", (err as Error).message));
        await emitEvent({
          agent: "sales",
          type: "dev.booking_processed",
          level: "debug",
          payload: { request_id: req.id },
        });
      }
    } catch (err) {
      console.error("[outbox-poll]", (err as Error).message);
    }
  }, 3000);

  // Photo self-heal (2026-07-12 incident: a fleet rebuild burned the Places cap re-downloading
  // photos, later builds shipped photo-less). Builds now emit build.no_photos when a lead HAS
  // photos that could not be fetched; when the daily budget has headroom again, requeue those
  // demos (unsent only, ≤5 per pass, ≥12h between attempts per lead — no churn while capped).
  setInterval(
    async () => {
      if (!workerEnabled) return;
      try {
        const caps2 = loadCaps();
        const spent = await usedToday("places.call").catch(() => caps2.places_calls_per_day);
        if (spent > caps2.places_calls_per_day - 30) return; // not enough headroom to bother
        const debt = await pool.query<{ id: string; company_name: string }>(
          `select l.id, l.company_name from leads l
         where l.status in ('outreach_ready','awaiting_approval')
           and not exists (select 1 from emails e where e.lead_id = l.id and e.status = 'sent')
           and exists (
             select 1 from agent_events np where np.lead_id = l.id and np.type = 'build.no_photos'
               and np.created_at > coalesce((select max(rq.created_at) from agent_events rq
                                             where rq.lead_id = l.id and rq.type = 'photo.requeue'), '1970-01-01'))
           and not exists (select 1 from agent_events rq2 where rq2.lead_id = l.id
                             and rq2.type = 'photo.requeue' and rq2.created_at > now() - interval '12 hours')
         limit 5`,
        );
        for (const l of debt.rows) {
          await emitEvent({
            agent: "builder",
            leadId: l.id,
            type: "photo.requeue",
            message: "photo budget available again; rebuilding photo-less demo",
          });
          await pool.query(
            "update leads set status='demo_building' where id=$1 and status in ('outreach_ready','awaiting_approval')",
            [l.id],
          );
        }
      } catch (err) {
        console.error("[photo-heal]", (err as Error).message);
      }
    },
    30 * 60 * 1000,
  );

  await emitEvent({ agent: "worker", type: "worker.started", message: `worker online (mock=${MOCK})` });
  setInterval(() => {
    emitEvent({ agent: "worker", type: "worker.heartbeat", level: "debug" }).catch((e) =>
      console.error("[heartbeat]", e.message),
    );
  }, 60_000);

  // Local<->hosted bridge (RUNBOOK §2b): pulls operator inputs (bookings, Outbox decisions) from
  // the hosted DB, pushes worker outputs up so the deployed dashboard stays current. No-op when
  // DATABASE_URL_NEON is unset. Serialized: a cycle never overlaps a slow predecessor.
  let bridging = false;
  setInterval(async () => {
    if (bridging) return;
    bridging = true;
    try {
      await bridgeCycle();
    } catch (err) {
      console.error("[bridge]", (err as Error).message);
    } finally {
      bridging = false;
    }
  }, 45_000);

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
