import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// Cal.com webhook (spec §6.9): BOOKING_CREATED / BOOKING_CANCELLED. Verifies the HMAC-SHA256
// signature (x-cal-signature-256) against CALCOM_WEBHOOK_SECRET on the RAW body before trusting a
// byte of it. Matches the lead by attendee email; the worker's poll runs the real booking handler.
// Without the secret configured this endpoint refuses (503) rather than accepting unsigned posts.
export async function POST(req: Request) {
  const secret = process.env.CALCOM_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "webhook secret not configured" }, { status: 503 });

  const raw = await req.text();
  const given = req.headers.get("x-cal-signature-256") ?? "";
  const expected = createHmac("sha256", secret).update(raw).digest("hex");
  const a = Buffer.from(given), b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return NextResponse.json({ error: "bad signature" }, { status: 401 });
  }

  let body: any;
  try { body = JSON.parse(raw); } catch { return NextResponse.json({ error: "bad json" }, { status: 400 }); }
  const event = body.triggerEvent ?? body.type ?? "";
  const payload = body.payload ?? {};
  const attendee = payload.attendees?.[0] ?? payload.responses?.email ?? null;
  const email: string | null = attendee?.email ?? (typeof attendee === "string" ? attendee : null);

  if (event === "BOOKING_CANCELLED") {
    if (payload.uid) {
      await db().query("update meetings set status='cancelled' where cal_booking_uid=$1", [payload.uid]);
    }
    return NextResponse.json({ ok: true });
  }

  // BOOKING_CREATED: match the lead by attendee email.
  const lead = email
    ? await db().query<{ id: string }>("select id from leads where lower(contact_email)=lower($1) limit 1", [email])
    : { rowCount: 0, rows: [] as { id: string }[] };
  if (!lead.rowCount) {
    // no matching lead: notify the operator instead of guessing (never attach a booking to the wrong lead)
    await db().query(
      "insert into notifications (type, title, body) values ('booking_unmatched', $1, $2)",
      [`Cal.com booking from ${email ?? "unknown"} matched no lead`, raw.slice(0, 500)],
    );
    return NextResponse.json({ ok: true, matched: false });
  }

  await db().query(
    "insert into agent_events (agent, lead_id, type, message, payload) values ('sales',$1,'booking.received','cal.com BOOKING_CREATED',$2)",
    [lead.rows[0].id, JSON.stringify({ leadId: lead.rows[0].id, title: payload.title ?? "Intro call", startTime: payload.startTime ?? null, attendee })],
  );
  return NextResponse.json({ ok: true, matched: true });
}
