import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// Worker control. GET: desired state + liveness (heartbeats fire every 60s; the bridge syncs them
// to the hosted DB every ~45s, so "online" tolerates up to 3 minutes). POST: flip the desired
// state; the worker's scheduler polls it every 2s locally (hosted toggles ride the bridge, so
// allow up to a minute). The dashboard cannot START a dead process — it commands a running one.
export async function GET() {
  const [flag, hb] = await Promise.all([
    db().query<{ value: unknown }>("select value from settings where key='worker_enabled'"),
    db().query<{ t: string | null }>("select max(created_at)::text t from agent_events where type in ('worker.heartbeat','worker.started')"),
  ]);
  const enabled = String(flag.rows[0]?.value ?? "false").replace(/"/g, "") === "true";
  const lastBeat = hb.rows[0]?.t ? new Date(hb.rows[0].t) : null;
  const online = Boolean(lastBeat && Date.now() - lastBeat.getTime() < 3 * 60 * 1000);
  return NextResponse.json({ enabled, online, last_heartbeat: lastBeat?.toISOString() ?? null });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  if (typeof body.enabled !== "boolean") return NextResponse.json({ error: "enabled (boolean) required" }, { status: 400 });
  await db().query(
    `insert into settings (key, value) values ('worker_enabled', $1)
     on conflict (key) do update set value = excluded.value`,
    [JSON.stringify(String(body.enabled))],
  );
  await db().query(
    "insert into agent_events (agent, type, level, message) values ('dashboard','worker.toggle_requested','info',$1)",
    [`operator set worker ${body.enabled ? "ON" : "OFF"}`],
  );
  return NextResponse.json({ ok: true, enabled: body.enabled });
}
