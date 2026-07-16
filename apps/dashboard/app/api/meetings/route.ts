import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// /meetings data (spec §8.4): booked intro calls from Cal.com. Populated once Phase 5 booking is
// wired; honestly empty until then.
export async function GET() {
  const r = await db().query(
    `select m.id, m.title, m.start_time, m.end_time, m.timezone, m.status, m.attendee,
            l.id as lead_id, l.company_name, l.city
     from meetings m join leads l on l.id = m.lead_id
     order by m.start_time desc nulls last limit 100`,
  );
  return NextResponse.json({ meetings: r.rows });
}
