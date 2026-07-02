import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const lead = await db().query("select * from leads where id = $1", [params.id]);
  if (lead.rowCount === 0) return NextResponse.json({ error: "not found" }, { status: 404 });
  const events = await db().query(
    `select id, agent, level, type, message, payload, cost_usd, created_at
     from agent_events where lead_id = $1 order by created_at desc limit 200`,
    [params.id],
  );
  const builds = await db().query(
    "select id, kind, status, deploy_url, iteration, created_at from builds where lead_id = $1 order by created_at desc",
    [params.id],
  );
  const emails = await db().query(
    "select id, direction, kind, subject, status, sent_at, created_at from emails where lead_id = $1 order by created_at",
    [params.id],
  );
  return NextResponse.json({ lead: lead.rows[0], events: events.rows, builds: builds.rows, emails: emails.rows });
}
