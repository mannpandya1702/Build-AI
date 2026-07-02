import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const r = await db().query(
    `select id, type, title, body, lead_id, read, created_at from notifications order by created_at desc limit 30`,
  );
  const unread = await db().query(`select count(*)::int as n from notifications where not read`);
  return NextResponse.json({ notifications: r.rows, unread: unread.rows[0].n });
}

export async function POST() {
  await db().query(`update notifications set read = true where not read`);
  return NextResponse.json({ ok: true });
}
