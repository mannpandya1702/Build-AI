import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const r = await db().query("select key, value from settings order by key");
  return NextResponse.json({ settings: Object.fromEntries(r.rows.map((x: { key: string; value: unknown }) => [x.key, x.value])) });
}

export async function POST(req: Request) {
  const { key, value } = await req.json();
  if (typeof key !== "string" || !key) return NextResponse.json({ error: "key required" }, { status: 400 });
  await db().query(
    `insert into settings (key, value) values ($1, $2)
     on conflict (key) do update set value = excluded.value`,
    [key, JSON.stringify(value)],
  );
  return NextResponse.json({ ok: true });
}
