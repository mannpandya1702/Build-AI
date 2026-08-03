import { db } from "@/lib/db";
// Live tail source for /activity. Local dev polls this; production swaps to Supabase Realtime.
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const after = url.searchParams.get("after");
  const rows = await db().query(
    after
      ? `select id, agent, lead_id, level, type, message, payload, cost_usd, created_at
         from agent_events where created_at > $1 order by created_at desc limit 100`
      : `select id, agent, lead_id, level, type, message, payload, cost_usd, created_at
         from agent_events order by created_at desc limit 100`,
    after ? [after] : [],
  );
  return NextResponse.json({ events: rows.rows });
}
