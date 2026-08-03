// Solution Maker Agent (spec §6.5): Sonnet over audit findings + automation offer (CLAUDE.md §1).
// Also writes the call_sheet_md: the operator's 30-second phone opener + objections + automation
// upsell + best call window. Advances to solution_ready.
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { MOCK, llm } from "@autopilot/adapters";
import { advanceLead, emitEvent, getPool } from "@autopilot/core";

const PROMPT = readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), "prompts/solution.md"), "utf8");

export async function solution(leadId: string): Promise<void> {
  const pool = getPool();
  const lead = (await pool.query("select * from leads where id = $1", [leadId])).rows[0];
  if (!lead) throw new Error(`lead ${leadId} missing`);

  // Idempotency guard (spec §4.4): skip if a duplicate job fires after the lead already advanced.
  if (lead.status !== "analyzed") {
    await emitEvent({
      agent: "solution",
      leadId,
      level: "debug",
      type: "solution.skipped",
      message: `lead already at ${lead.status}`,
    });
    return;
  }

  const audit = (
    await pool.query("select * from audits where lead_id = $1 order by created_at desc limit 1", [leadId])
  ).rows[0];
  const findings = audit?.findings ?? [];

  const raw = await llm({
    tier: "sonnet",
    agent: "solution",
    leadId,
    maxTokens: 1400,
    system: PROMPT,
    prompt: `Business: ${lead.company_name} (${lead.industry}, ${lead.city ?? "?"})\nReviews: ${lead.review_count ?? 0} at ${lead.rating ?? "?"}\nHas website: ${Boolean(lead.website_url)}\nAudit summary: ${audit?.summary ?? "n/a"}\nFindings: ${JSON.stringify(findings)}\n\nReturn the JSON solution.`,
    mockResponse: JSON.stringify({
      pitch_angle: `${lead.company_name} has ${lead.review_count ?? "strong"} reviews that nobody can see because there is no fast mobile site to send people to.`,
      proposed_pages: ["Home", "Services", "About", "Contact"],
      features: [
        "sticky tap-to-call",
        "real Google reviews block",
        "3-5 field quote form",
        "storm/insurance band",
        "service-area map",
      ],
      differentiators: [
        `${lead.review_count ?? 0} real reviews front and center`,
        `${lead.city ?? "local"} in the hero`,
      ],
      automation_opportunities: [
        { package: "never-miss-a-lead", reason: "phone-driven trade loses calls while on the job" },
      ],
      estimated_impact: "More of the people already finding them on Google actually call.",
    }),
  });
  const s = safeJson(raw) ?? {};

  const callSheet = buildCallSheet(lead, s, findings);
  await pool.query(
    `insert into solutions (lead_id, pitch_angle, proposed_pages, features, differentiators, estimated_impact, call_sheet_md)
     values ($1,$2,$3,$4,$5,$6,$7)`,
    [
      leadId,
      s.pitch_angle ?? null,
      JSON.stringify(s.proposed_pages ?? ["Home", "Services", "About", "Contact"]),
      JSON.stringify(s.features ?? []),
      JSON.stringify(s.differentiators ?? []),
      s.estimated_impact ?? null,
      callSheet,
    ],
  );
  await emitEvent({
    agent: "solution",
    leadId,
    type: "solution.ready",
    message: `pitch + call sheet${MOCK() ? " (mock)" : ""}`,
  });
  await advanceLead(leadId, "solution_ready", { agent: "solution" });
}

/** Call sheet (spec §6.9): the operator's phone weapon. Includes automation upsell for post-close. */
function buildCallSheet(lead: any, s: any, findings: any[]): string {
  const biggest = findings[0]?.evidence ?? s.pitch_angle ?? "their weak web presence";
  const autos =
    (s.automation_opportunities ?? []).map((a: any) => `- ${a.package}: ${a.reason}`).join("\n") ||
    "- (assess after close)";
  return [
    `# Call sheet — ${lead.company_name}`,
    `${lead.review_count ?? 0} reviews at ${lead.rating ?? "?"} | ${lead.city ?? "?"} | ${lead.contact_phone ?? "no phone"}`,
    "",
    "## 30-second opener",
    `"Hey${lead.contact_name ? ` ${String(lead.contact_name).split(" ")[0]}` : ""}, it's Mann from TradeCraft Sites. I built ${lead.company_name} a new website and emailed you the link. Did you get a chance to click it?"`,
    "",
    "## The one finding to name",
    `${biggest}`,
    "",
    "## Likely objections",
    `- "How much?" -> setup then $149/mo, you pay nothing until it's live and you're happy.`,
    `- "Where are you based?" -> India. The work speaks for itself, click the demo.`,
    "",
    "## After the close: automation to offer (never in the cold pitch)",
    autos,
    "",
    "## Best call window",
    `${lead.city ? `${lead.city} ` : ""}business hours, 8-10am local (before jobs start).`,
  ].join("\n");
}

function safeJson(s: string): any {
  try {
    const m = s.match(/\{[\s\S]*\}/);
    return m ? JSON.parse(m[0]) : null;
  } catch {
    return null;
  }
}
