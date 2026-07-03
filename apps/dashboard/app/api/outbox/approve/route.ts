import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// Operator approves a drafted email. The dashboard only flips it to 'approved'; the worker
// gate-checks + sends (keeps the Next app dependency-light). Idempotent.
export async function POST(req: Request) {
  const { emailId } = await req.json();
  if (!emailId) return NextResponse.json({ error: "emailId required" }, { status: 400 });
  await db().query("update emails set status='approved' where id=$1 and status='awaiting_approval'", [emailId]);
  return NextResponse.json({ ok: true });
}
