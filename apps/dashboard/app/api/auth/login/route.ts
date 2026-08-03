import { SESSION_COOKIE, SESSION_MAX_AGE, checkPassword, createSessionToken } from "@/lib/auth";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Operator login: verify the shared password (constant-time) and mint a signed session cookie.
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const expected = process.env.AUTH_PASSWORD;
  const secret = process.env.AUTH_SECRET;
  if (!expected || !secret) return NextResponse.json({ error: "auth not configured" }, { status: 503 });
  if (!checkPassword(body.password, expected))
    return NextResponse.json({ error: "invalid password" }, { status: 401 });

  const token = await createSessionToken(secret);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  return res;
}
