import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { devToolsEnabled } from "@/lib/devtools";

export const dynamic = "force-dynamic";

// Dev panel (spec §11): inject a simulated inbound reply. The worker picks up the event and runs the
// real reply handler (classify -> suppress+halt on opt-out, or notify + advance to replied).
export async function POST(req: Request) {
  if (!devToolsEnabled()) return NextResponse.json({ error: "dev tools are disabled on hosted deployments" }, { status: 403 });
  const { leadId, classification, text } = await req.json();
  if (!leadId) return NextResponse.json({ error: "leadId required" }, { status: 400 });
  await db().query(
    "insert into agent_events (agent, lead_id, type, message, payload) values ('dev',$1,'dev.reply_requested',$2,$3)",
    [leadId, `simulate reply: ${classification ?? "interested"}`, JSON.stringify({ leadId, classification, text })],
  );
  return NextResponse.json({ ok: true });
}
