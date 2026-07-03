import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// Dev panel (spec §11): inject a simulated Cal.com booking. The worker runs the real booking handler
// (meeting row + meeting_booked + operator notification).
export async function POST(req: Request) {
  const { leadId } = await req.json();
  if (!leadId) return NextResponse.json({ error: "leadId required" }, { status: 400 });
  await db().query(
    "insert into agent_events (agent, lead_id, type, message, payload) values ('dev',$1,'dev.booking_requested','simulate booking',$2)",
    [leadId, JSON.stringify({ leadId })],
  );
  return NextResponse.json({ ok: true });
}
