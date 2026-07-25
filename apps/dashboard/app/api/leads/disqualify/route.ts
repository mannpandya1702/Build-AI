import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Operator lead-status action. Two modes:
//   action "disqualify" (default): set status=disqualified for the given leads. `disqualified` is a
//     legal transition from every pre-outreach state (core statuses.ts TRANSITIONS), and the status
//     guard protects anything already in outreach/won from being nuked. Used to trim an over-sized
//     discovery batch to a target count, or drop a stray lead.
//   action "reactivate": undo a batch disqualify — re-enter leads into the pipeline at `discovered`
//     (so the worker re-scrapes and re-scores them) and clear disqualify_reason. Only affects rows
//     currently disqualified. Re-entering at discovered (not the gate) means a reactivated lead is
//     properly re-qualified rather than jumping onto the Shortlist unscored.
// Each affected lead gets one event so the Activity feed and Timeline reflect the change.
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const ids: string[] = Array.isArray(body.leadIds)
    ? body.leadIds.filter((x: unknown): x is string => typeof x === "string")
    : [];
  const reason =
    typeof body.reason === "string" && body.reason.trim() ? body.reason.trim().slice(0, 120) : "operator_disqualified";
  const action = body.action === "reactivate" ? "reactivate" : "disqualify";
  if (ids.length === 0) return NextResponse.json({ error: "leadIds (string[]) required" }, { status: 400 });

  if (action === "reactivate") {
    const r = await db().query<{ id: string }>(
      `with upd as (
         update leads set status = 'discovered', disqualify_reason = null
          where id = any($1::uuid[]) and status = 'disqualified'
          returning id
       ), ev as (
         insert into agent_events (agent, lead_id, level, type, message)
         select 'dashboard', id, 'info', 'lead.reactivated', 'operator reactivated into pipeline' from upd
       )
       select id from upd`,
      [ids],
    );
    return NextResponse.json({ reactivated: r.rows.map((x) => x.id), count: r.rowCount });
  }

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
