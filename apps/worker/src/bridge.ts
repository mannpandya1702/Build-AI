// Local<->hosted bridge. The deployed dashboard + Cal.com webhook live on hosted Postgres (Neon);
// the worker's brain (pg-boss, agents) runs on local Postgres because this container cannot open
// raw TCP :5432 (ENV ADAPTATION, RUNBOOK §2b). Without a bridge that split-brains: a booking or an
// Outbox approval landing in Neon would never reach the worker, and worker progress would never
// show on the deployed dashboard. So, every cycle:
//
//   DOWN (Neon -> local, operator inputs):
//     - booking.received events not yet pulled -> replayed locally (the worker's booking poll
//       ingests them), marked in Neon with a bridge.pulled event so they pull exactly once
//     - emails approved/rejected on the deployed Outbox -> same status locally (the worker's
//       approve poll then gate-checks + sends; idempotency_key matches across databases)
//
//   UP (local -> Neon, worker outputs):
//     - small mutable tables upserted whole (leads=~100, audits, solutions, designs, builds,
//       qa_reports, email_sequences, emails, meetings, suppression_list, daily_reports, looks)
//     - append-only tables (agent_events, notifications, replies) pushed by created_at watermark
//
// Every step is idempotent; a crashed cycle re-runs safely. Failures log and never crash the worker.
import { getPool, createPoolForUrl, type DbPool } from "@autopilot/core";

const UPSERT_TABLES = [
  "looks", "leads", "audits", "solutions", "designs", "builds", "qa_reports",
  "email_sequences", "emails", "meetings", "suppression_list", "daily_reports",
] as const;
const APPEND_TABLES = ["agent_events", "notifications", "replies"] as const;

let remote: DbPool | null = null;
function getRemote(): DbPool | null {
  const url = process.env.DATABASE_URL_NEON;
  if (!url || url === process.env.DATABASE_URL) return null;
  if (!remote) remote = createPoolForUrl(url, 3);
  return remote;
}

const colsCache = new Map<string, string[]>();
async function cols(pool: DbPool, table: string): Promise<string[]> {
  if (!colsCache.has(table)) {
    colsCache.set(table, (await pool.query<{ column_name: string }>(
      "select column_name from information_schema.columns where table_name=$1 and table_schema='public' order by ordinal_position",
      [table],
    )).rows.map((r) => r.column_name));
  }
  return colsCache.get(table)!;
}

function toParam(v: unknown): unknown {
  return v !== null && typeof v === "object" && !(v instanceof Date) ? JSON.stringify(v) : v;
}

async function upsertAll(local: DbPool, rem: DbPool, table: string): Promise<void> {
  const cs = await cols(local, table);
  const rows = (await local.query(`select * from ${table}`)).rows;
  const setList = cs.filter((c) => c !== "id").map((c) => `${c}=excluded.${c}`).join(",");
  for (let i = 0; i < rows.length; i += 100) {
    const chunk = rows.slice(i, i + 100);
    const params: unknown[] = [];
    const tuples = chunk.map((row, r) => `(${cs.map((c, j) => {
      params.push(toParam((row as Record<string, unknown>)[c]));
      return `$${r * cs.length + j + 1}`;
    }).join(",")})`);
    await rem.query(
      `insert into ${table} (${cs.join(",")}) values ${tuples.join(",")} on conflict (id) do update set ${setList}`,
      params,
    );
  }
}

async function appendNew(local: DbPool, rem: DbPool, table: string): Promise<void> {
  const cs = await cols(local, table);
  const wm = (await rem.query<{ t: string | null }>(`select max(created_at)::text t from ${table}`)).rows[0].t;
  const rows = (await local.query(
    wm ? `select * from ${table} where created_at > $1 order by created_at asc limit 2000` : `select * from ${table} order by created_at asc limit 2000`,
    wm ? [wm] : [],
  )).rows;
  for (let i = 0; i < rows.length; i += 100) {
    const chunk = rows.slice(i, i + 100);
    const params: unknown[] = [];
    const tuples = chunk.map((row, r) => `(${cs.map((c, j) => {
      params.push(toParam((row as Record<string, unknown>)[c]));
      return `$${r * cs.length + j + 1}`;
    }).join(",")})`);
    await rem.query(`insert into ${table} (${cs.join(",")}) values ${tuples.join(",")} on conflict do nothing`, params);
  }
}

/** One bridge cycle. No-op unless DATABASE_URL_NEON is configured. */
export async function bridgeCycle(): Promise<void> {
  const rem = getRemote();
  if (!rem) return;
  const local = getPool();

  // DOWN: operator inputs created on the hosted side, each pulled exactly once. Local replays are
  // inserted with agent='bridge'; the pulls exclude that agent so a replay that gets up-synced back
  // to the hosted DB can never be pulled again (replay loop).
  const PULL_TYPES = ["booking.received", "research.requested"] as const;
  for (const type of PULL_TYPES) {
    const rows = await rem.query<{ id: string; lead_id: string | null; message: string | null; payload: unknown }>(
      `select e.id, e.lead_id, e.message, e.payload from agent_events e
       where e.type = $1
         and e.agent <> 'bridge'
         and not exists (select 1 from agent_events m where m.type='bridge.pulled' and m.payload->>'remote_id' = e.id::text)
       limit 10`,
      [type],
    );
    for (const b of rows.rows) {
      await local.query(
        "insert into agent_events (agent, lead_id, type, message, payload) values ('bridge',$1,$2,$3,$4)",
        [b.lead_id, type, b.message ?? "bridged from hosted", JSON.stringify(b.payload ?? {})],
      );
      await rem.query(
        "insert into agent_events (agent, type, level, message, payload) values ('bridge','bridge.pulled','debug',$2,$1)",
        [JSON.stringify({ remote_id: b.id }), `${type} pulled to worker`],
      );
    }
  }

  // DOWN: Outbox decisions made on the deployed dashboard.
  const decisions = await rem.query<{ idempotency_key: string; status: string }>(
    `select idempotency_key, status from emails where status in ('approved','failed') and idempotency_key is not null`,
  );
  for (const d of decisions.rows) {
    await local.query(
      `update emails set status = $2::email_status where idempotency_key = $1 and status = 'awaiting_approval'`,
      [d.idempotency_key, d.status],
    );
  }

  // UP: worker outputs -> hosted, so the deployed dashboard stays current.
  for (const t of UPSERT_TABLES) await upsertAll(local, rem, t);
  for (const t of APPEND_TABLES) await appendNew(local, rem, t);
}
