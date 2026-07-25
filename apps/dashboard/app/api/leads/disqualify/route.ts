import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Operator action: disqualify one or more leads (e.g. trim an over-sized discovery batch to a target
// count, or drop a lead that slipped the filter). `disqualified` is a legal transition from every
// pre-outreach state (core statuses.ts TRANSITIONS), so this raw update never produces an illegal
// transition; the status guard also protects anything already in outreach/won from being nuked.
// Emits one `lead.disqualified` event per lead so the Activity feed and lead Timeline reflect it.
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const ids: string[] = Array.isArray(body.leadIds)
    ? body.leadIds.filter((x: unknown): x is string => typeof x === "string")
    : [];
  const reason =
    typeof body.reason === "string" && body.reason.trim() ? body.reason.trim().slice(0, 120) : "operator_disqualified";
  if (ids.length === 0) return NextResponse.json({ error: "leadIds (string[]) required" }, { status: 400 });

  const r = await db().query<{ id: string }>(
    `with upd as (
       update leads set status = 'disqualified', disqualify_reason = $2
        where id = any($1::uuid[])
          and status in ('discovered','enriched','qualified','awaiting_build_approval')
        returning id
     ), ev as (
       insert into agent_events (agent, lead_id, level, type, message)
       select 'dashboard', id, 'info', 'lead.disqualified', $2 from upd
     )
     select id from upd`,
    [ids, reason],
  );
  return NextResponse.json({ disqualified: r.rows.map((x) => x.id), count: r.rowCount });
}
