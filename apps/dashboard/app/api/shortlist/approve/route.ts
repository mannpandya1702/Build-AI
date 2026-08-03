import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Approve one or more shortlisted leads for a paid build (MASTER_SPEC §2, §12). Emits a
// `lead.build_approved` event — the scheduler's spend gate admits the lead to analysis on its next
// scan (review mode). Idempotent: a lead already approved, or not currently at the gate, is skipped.
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const ids: string[] = Array.isArray(body.leadIds)
    ? body.leadIds.filter((x: unknown): x is string => typeof x === "string")
    : [];
  if (ids.length === 0) return NextResponse.json({ error: "leadIds (string[]) required" }, { status: 400 });

  const r = await db().query<{ lead_id: string }>(
    `insert into agent_events (agent, lead_id, level, type, message)
     select 'dashboard', l.id, 'info', 'lead.build_approved', 'operator approved build'
       from leads l
      where l.id = any($1::uuid[])
        and l.status = 'awaiting_build_approval'
        and not exists (select 1 from agent_events e where e.lead_id = l.id and e.type = 'lead.build_approved')
     returning lead_id`,
    [ids],
  );
  return NextResponse.json({ approved: r.rows.map((x) => x.lead_id) });
}
