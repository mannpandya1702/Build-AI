import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// /outbox data (spec §8.3): the approval queue, sent log, and inbound replies. Populated once Phase 5
// (outreach) is wired; until then these are honestly empty.
export async function GET() {
  const rows = async (where: string) =>
    (await db().query(
      `select e.id, e.direction, e.kind, e.subject, e.body_text, e.status, e.sent_at, e.created_at,
              l.company_name, l.id as lead_id, l.contact_email
       from emails e join leads l on l.id = e.lead_id where ${where} order by e.created_at desc limit 100`,
    )).rows;

  const [awaiting, queued, blocked, sent, replies] = await Promise.all([
    rows("e.status = 'awaiting_approval'"),
    // approved but not yet sent: waiting for the worker (paused/offline) or mid-send
    rows("e.direction = 'outbound' and e.status = 'approved'"),
    // failed = gate-blocked or rejected. Shown, never hidden: an approved email that cannot send
    // must stay visible with its reason (2026-07-10: two approved emails vanished from this page).
    rows("e.direction = 'outbound' and e.status = 'failed'"),
    rows("e.direction = 'outbound' and e.status = 'sent'"),
    rows("e.direction = 'inbound'"),
  ]);
  // why a blocked email failed: the latest gate/blocked warning per lead
  const blockReasons: Record<string, string> = {};
  if (blocked.length) {
    const reasons = await db().query<{ lead_id: string; message: string }>(
      `select distinct on (lead_id) lead_id, message from agent_events
       where type in ('email.gated','outreach.blocked') and lead_id = any($1::uuid[])
       order by lead_id, created_at desc`,
      [blocked.map((b: { lead_id: string }) => b.lead_id)],
    );
    for (const r of reasons.rows) blockReasons[r.lead_id] = r.message;
  }
  // call tasks due: leads whose demo drop went out and whose Touch-2 call is pending
  const callsDue = (await db().query(
    `select l.id as lead_id, l.company_name, l.contact_phone, l.city
     from leads l where l.status = 'contacted' order by l.updated_at asc limit 50`,
  )).rows;

  return NextResponse.json({ awaiting, queued, blocked, sent, replies, callsDue, blockReasons });
}
