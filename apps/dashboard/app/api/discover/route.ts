import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// "Discover leads" with explicit targeting (niche, cities, country) from the dashboard panel.
// A first-class operator action (unlike the /api/dev fabricators): it only requests real Places
// discovery, which the worker runs within the daily cap. Persists the targeting as icp_overrides so
// the qualifier and future runs stay consistent, then emits research.requested for the worker
// (bridged down from the hosted DB when the dashboard runs on Vercel).
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));

  const count = Math.min(Math.max(Number.parseInt(String(body.count ?? "25"), 10) || 25, 1), 200);
  const vertical =
    typeof body.vertical === "string" && body.vertical.trim() ? body.vertical.trim().toLowerCase() : null;
  const country = typeof body.country === "string" && body.country.trim() ? body.country.trim() : null;
  const cities: string[] = Array.isArray(body.cities)
    ? body.cities
        .map((c: unknown) => String(c).trim())
        .filter(Boolean)
        .slice(0, 25)
    : [];

  if (!vertical) return NextResponse.json({ error: "vertical (niche) is required" }, { status: 400 });
  if (cities.length === 0)
    return NextResponse.json({ error: "at least one city is required" }, { status: 400 });
  if (!country) return NextResponse.json({ error: "country is required" }, { status: 400 });

  // Persist as the active targeting so scoring + future runs match what the operator picked.
  const existing = await db().query("select value from settings where key='icp_overrides'");
  const merged = { ...(existing.rows[0]?.value ?? {}), active_vertical: vertical, cities, country };
  await db().query(
    `insert into settings (key, value) values ('icp_overrides', $1)
     on conflict (key) do update set value = excluded.value`,
    [JSON.stringify(merged)],
  );

  const r = await db().query(
    `insert into agent_events (agent, level, type, message, payload)
     values ('dashboard','info','research.requested',$1,$2) returning id`,
    [
      `discover ${count} ${vertical} leads in ${cities.join("; ")} (${country})`,
      JSON.stringify({ count, vertical, cities, country }),
    ],
  );
  return NextResponse.json({ requestId: r.rows[0].id, count, vertical, cities, country });
}
