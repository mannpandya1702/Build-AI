import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Only these keys may be written through the API (MASTER_SPEC §9: settings-key allowlist). Before
// this, any key + arbitrary JSON could be written unauthenticated — an open KV-write into the shared
// DB. Anything not listed is refused. Extend deliberately as new operator-editable settings land.
const ALLOWED_SETTING_KEYS = new Set([
  "worker_enabled",
  "demo_batch",
  "icp_overrides",
  "build_mode",
  "build_budget_overrides",
  "outreach_mode",
]);

export async function GET() {
  const r = await db().query("select key, value from settings order by key");
  return NextResponse.json({
    settings: Object.fromEntries(r.rows.map((x: { key: string; value: unknown }) => [x.key, x.value])),
  });
}

export async function POST(req: Request) {
  const { key, value } = await req.json();
  if (typeof key !== "string" || !key) return NextResponse.json({ error: "key required" }, { status: 400 });
  if (!ALLOWED_SETTING_KEYS.has(key))
    return NextResponse.json({ error: `key '${key}' is not writable` }, { status: 400 });
  await db().query(
    `insert into settings (key, value) values ($1, $2)
     on conflict (key) do update set value = excluded.value`,
    [key, JSON.stringify(value)],
  );
  return NextResponse.json({ ok: true });
}
