import { db } from "@/lib/db";
import { type KbDoc, answerQuestion } from "@autopilot/chat";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Chatbot endpoint (MASTER_SPEC §7.2). Answers ONLY from the client's real facts and DECLINES rather
// than fabricate a price/availability (the guardrails live in @autopilot/chat). The KB is built from
// the lead's actual GBP-derived data — never invented. Live answers use a Haiku generator once
// ANTHROPIC_API_KEY is set; until then the grounded MOCK generator runs (still non-fabricating).

const MAX_Q = 500;

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  const { question, leadId } = (body ?? {}) as { question?: unknown; leadId?: unknown };

  // Input validation (§5e: every form-like endpoint validates + bounds its input).
  if (typeof question !== "string" || question.trim().length === 0) {
    return NextResponse.json({ error: "question is required" }, { status: 400 });
  }
  if (question.length > MAX_Q) {
    return NextResponse.json({ error: `question too long (max ${MAX_Q})` }, { status: 400 });
  }
  if (leadId !== undefined && typeof leadId !== "string") {
    return NextResponse.json({ error: "leadId must be a string" }, { status: 400 });
  }

  // Build the KB from the lead's REAL facts only (never fabricated). Defensive: any query failure
  // leaves the KB minimal rather than 500-ing the widget.
  const kb: KbDoc[] = [];

  // Preview KB: a clearly-labeled SAMPLE business (not a real GBP), so the widget preview answers
  // meaningfully without impersonating anyone. This is a labeled example, not fabricated real facts.
  if (leadId === "demo") {
    kb.push(
      {
        id: "about",
        title: "About",
        text: "Demo Co is a sample local business used to preview this chat widget. It offers roof repair and roof replacement.",
      },
      { id: "hours", title: "Hours", text: "Demo Co is open Monday to Saturday, 8am to 6pm." },
      { id: "contact", title: "Contact", text: "You can reach Demo Co by phone at (555) 010-1234." },
    );
    const result = await answerQuestion({ kb, question });
    return NextResponse.json(result);
  }

  if (typeof leadId === "string" && leadId.length > 0) {
    try {
      const lead = await db().query(
        "select company_name, city, region, contact_phone, industry from leads where id=$1",
        [leadId],
      );
      const l = lead.rows[0] as
        | {
            company_name: string;
            city: string | null;
            region: string | null;
            contact_phone: string | null;
            industry: string | null;
          }
        | undefined;
      if (l) {
        const where = l.city ? ` in ${l.city}${l.region ? `, ${l.region}` : ""}` : "";
        const facts = [
          `${l.company_name} is a ${l.industry ?? "local"} business${where}.`,
          l.contact_phone ? `You can reach ${l.company_name} by phone at ${l.contact_phone}.` : "",
        ]
          .filter(Boolean)
          .join(" ");
        kb.push({ id: "business", title: "Business", text: facts });

        const sol = await db()
          .query("select features from solutions where lead_id=$1 order by created_at desc limit 1", [leadId])
          .catch(() => ({ rows: [] as Array<{ features: unknown }> }));
        const features = sol.rows[0]?.features;
        if (Array.isArray(features) && features.length > 0) {
          kb.push({
            id: "services",
            title: "Services",
            text: `Services offered: ${features.filter((f) => typeof f === "string").join(", ")}.`,
          });
        }
      }
    } catch {
      // KB stays minimal; the runtime will DECLINE (never fabricate) when nothing matches.
    }
  }

  if (kb.length === 0) {
    return NextResponse.json({
      answer: "I don't have this business's details loaded yet.",
      declined: true,
      reason: "no_kb",
    });
  }

  const result = await answerQuestion({ kb, question });
  return NextResponse.json(result);
}
