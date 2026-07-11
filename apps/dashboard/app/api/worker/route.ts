import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// Worker control. GET: desired state + liveness (heartbeats fire every 60s; the bridge syncs them
// to the hosted DB every ~45s, so "online" tolerates up to 3 minutes) + demo-batch progress.
// POST: flip the desired state and/or set the demo batch; the worker's scheduler polls settings
// every 2s locally (hosted writes ride the bridge, so allow up to a minute). The dashboard cannot
// START a dead process — it commands a running one.
export async function GET() {
  const [flag, hb, batchRow] = await Promise.all([
    db().query<{ value: unknown }>("select value from settings where key='worker_enabled'"),
    db().query<{ t: string | null }>("select max(created_at)::text t from agent_events where type in ('worker.heartbeat','worker.started')"),
    db().query<{ value: { size?: number; started_at?: string } }>("select value from settings where key='demo_batch'"),
  ]);
  const enabled = String(flag.rows[0]?.value ?? "false").replace(/"/g, "") === "true";
  const lastBeat = hb.rows[0]?.t ? new Date(hb.rows[0].t) : null;
  const online = Boolean(lastBeat && Date.now() - lastBeat.getTime() < 3 * 60 * 1000);

  // Demo batch: size <= 0 or no row = no limit. "Used" = distinct leads admitted to the batch
  // (design.admitted at enqueue) or completed (design.ready) after the batch started — the same
  // admission-time accounting as the worker's gate (apps/worker/src/batch.ts).
  const bv = batchRow.rows[0]?.value;
  const size = Number(bv?.size ?? 0);
  let demo_batch: { size: number; used: number; remaining: number; started_at: string | null } | null = null;
  if (bv && Number.isFinite(size) && size > 0) {
    const used = Number(
      (await db().query<{ n: string }>(
        "select count(distinct lead_id)::text n from agent_events where type in ('design.admitted','design.ready') and created_at > $1",
        [bv.started_at ?? "1970-01-01T00:00:00Z"],
      )).rows[0].n,
    );
    demo_batch = { size, used, remaining: Math.max(0, size - used), started_at: bv.started_at ?? null };
  }

  return NextResponse.json({ enabled, online, last_heartbeat: lastBeat?.toISOString() ?? null, demo_batch });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const hasEnabled = typeof body.enabled === "boolean";
  const hasBatch = "batch_size" in body;
  if (!hasEnabled && !hasBatch) {
    return NextResponse.json({ error: "enabled (boolean) or batch_size (integer 1-100, null to clear) required" }, { status: 400 });
  }

  if (hasEnabled) {
    await db().query(
      `insert into settings (key, value) values ('worker_enabled', $1)
       on conflict (key) do update set value = excluded.value`,
      [JSON.stringify(String(body.enabled))],
    );
    await db().query(
      "insert into agent_events (agent, type, level, message) values ('dashboard','worker.toggle_requested','info',$1)",
      [`operator set worker ${body.enabled ? "ON" : "OFF"}`],
    );
  }

  if (hasBatch) {
    const raw = body.batch_size;
    const clearing = raw === null || raw === 0;
    if (!clearing && (!Number.isInteger(raw) || raw < 1 || raw > 100)) {
      return NextResponse.json({ error: "batch_size must be an integer 1-100, or null to clear" }, { status: 400 });
    }
    // Clearing writes size 0 instead of deleting the row: the worker bridge's two-way settings
    // merge has no delete tombstone, so a deleted hosted row would be resurrected from local.
    const value = clearing ? { size: 0, started_at: new Date().toISOString() } : { size: raw, started_at: new Date().toISOString() };
    await db().query(
      `insert into settings (key, value) values ('demo_batch', $1)
       on conflict (key) do update set value = excluded.value`,
      [JSON.stringify(value)],
    );
    await db().query(
      "insert into agent_events (agent, type, level, message, payload) values ('dashboard','worker.batch_set','info',$1,$2)",
      [clearing ? "operator cleared the demo batch limit" : `operator set demo batch: top ${raw} by score`, JSON.stringify(value)],
    );
  }

  return NextResponse.json({ ok: true });
}
