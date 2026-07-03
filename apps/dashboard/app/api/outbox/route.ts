import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// /outbox data (spec §8.3): the approval queue, sent log, and inbound replies. Populated once Phase 5
// (outreach) is wired; until then these are honestly empty.
export async function GET() {
  const rows = async (where: string) =>
    (await db().query(
      `select e.id, e.direction, e.kind, e.subject, e.status, e.sent_at, e.created_at, l.company_name, l.id as lead_id
       from emails e join leads l on l.id = e.lead_id where ${where} order by e.created_at desc limit 100`,
    )).rows;

  const [awaiting, sent, replies] = await Promise.all([
    rows("e.status = 'awaiting_approval'"),
    rows("e.direction = 'outbound' and e.status = 'sent'"),
    rows("e.direction = 'inbound'"),
  ]);
  // call tasks due: leads whose demo drop went out and whose Touch-2 call is pending
  const callsDue = (await db().query(
    `select l.id as lead_id, l.company_name, l.contact_phone, l.city
     from leads l where l.status = 'contacted' order by l.updated_at asc limit 50`,
  )).rows;

  return NextResponse.json({ awaiting, sent, replies, callsDue });
}
