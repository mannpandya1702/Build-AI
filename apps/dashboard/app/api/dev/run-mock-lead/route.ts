// Phase 1 acceptance trigger: create a fixture lead in `discovered`; the worker's scheduler
// carries it through every stage. Dev-panel only (spec §11 mock injectors live here later).
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { devToolsEnabled } from "@/lib/devtools";

export const dynamic = "force-dynamic";

export async function POST() {
  if (!devToolsEnabled()) return NextResponse.json({ error: "dev tools are disabled on hosted deployments" }, { status: 403 });
  const n = Math.floor(Math.random() * 9000 + 1000);
  const name = `Mock Roofing Co ${n}`;
  const r = await db().query(
    `insert into leads (company_name, slug, industry, city, region, country, source, status)
     values ($1, $2, 'roofing', 'Dallas', 'TX', 'US', 'mock', 'discovered') returning id`,
    [name, `mock-roofing-co-${n}`],
  );
  await db().query(
    `insert into agent_events (agent, lead_id, level, type, message) values ('research', $1, 'info', 'lead.discovered', $2)`,
    [r.rows[0].id, `${name} discovered (mock)`],
  );
  return NextResponse.json({ leadId: r.rows[0].id, name });
}
