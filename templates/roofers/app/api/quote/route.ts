// app/api/quote/route.ts — quote form endpoint. Server-side validation + sanitization with zod,
// because client checks are never trusted (CLAUDE.md §5e). No secrets here: this route only accepts
// a lead and acknowledges it. Wire it to email/CRM later via server-only env vars, never the client.

import { NextResponse } from "next/server";
import { z } from "zod";

// Strip anything that is not a phone-legal character; collapse whitespace; cap length.
const clean = (s: string) => s.replace(/[<>]/g, "").replace(/\s+/g, " ").trim().slice(0, 200);

const QuoteSchema = z.object({
  name: z.string().min(2).max(80).transform(clean),
  phone: z
    .string()
    .max(20)
    .transform((s) => s.replace(/[^0-9+()\-\s]/g, "").trim())
    .refine((s) => s.replace(/[^0-9]/g, "").length >= 10, "invalid phone"),
  service: z.string().max(60).transform(clean),
  timing: z.enum(["emergency", "this-week", "this-month", "just-looking"]),
});

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid JSON" }, { status: 400 });
  }

  const parsed = QuoteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "validation failed" }, { status: 422 });
  }

  // Demo: acknowledge only. In production, hand the sanitized lead to email/CRM here (server-side).
  // Never log full PII in a real deployment; this stays minimal on purpose.
  return NextResponse.json({ ok: true });
}
