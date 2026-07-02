// Operator "Discover leads" trigger: writes a research.requested event; the worker picks it up.
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const count = Math.min(Math.max(parseInt(body.count ?? "50", 10) || 50, 1), 200);
  const r = await db().query(
    `insert into agent_events (agent, level, type, message, payload)
     values ('operator','info','research.requested',$1,$2) returning id`,
    [`discover ${count} leads`, JSON.stringify({ count })],
  );
  return NextResponse.json({ requestId: r.rows[0].id, count });
}
