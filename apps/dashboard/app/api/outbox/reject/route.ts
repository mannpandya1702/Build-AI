import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const { emailId } = await req.json();
  if (!emailId) return NextResponse.json({ error: "emailId required" }, { status: 400 });
  await db().query("update emails set status='failed' where id=$1 and status='awaiting_approval'", [emailId]);
  return NextResponse.json({ ok: true });
}
