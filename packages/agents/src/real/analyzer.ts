// Analyzer Agent (spec §6.4): PageSpeed + screenshots + Sonnet findings. Every finding cites
// evidence from the audit data. No-website leads get an absence-based audit.
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { advanceLead, emitEvent, getPool } from "@autopilot/core";
import { pagespeed, screenshotSite, llm, MOCK } from "@autopilot/adapters";

const PROMPT = readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), "prompts/analyzer.md"), "utf8");

function slugOf(lead: { slug: string | null; id: string }): string {
  return lead.slug ?? lead.id;
}

export async function analyzer(leadId: string): Promise<void> {
  const pool = getPool();
  const lead = (await pool.query("select * from leads where id = $1", [leadId])).rows[0];
  if (!lead) throw new Error(`lead ${leadId} missing`);

  let lighthouse: Record<string, number> | null = null;
  let shots: { viewport: string; path: string }[] = [];
  const pagesCrawled: string[] = [];

  if (lead.website_url) {
    try {
      const psi = await pagespeed(lead.website_url, "mobile");
      lighthouse = { performance: psi.performance, seo: psi.seo, accessibility: psi.accessibility, best_practices: psi.best_practices, lcp_ms: psi.lcp_ms ?? 0 };
    } catch (err) {
      await emitEvent({ agent: "analyzer", leadId, level: "warn", type: "pagespeed.failed", message: (err as Error).message });
    }
    try {
      const s = await screenshotSite(lead.website_url, slugOf(lead));
      shots = s.map((x) => ({ viewport: x.viewport, path: x.path }));
      pagesCrawled.push(lead.website_url);
    } catch (err) {
      await emitEvent({ agent: "analyzer", leadId, level: "warn", type: "screenshot.failed", message: (err as Error).message });
    }
  }

  const auditData = {
    has_website: Boolean(lead.website_url),
    website_url: lead.website_url,
    lighthouse,
    screenshots_captured: shots.map((s) => s.viewport),
    review_count: lead.review_count,
    rating: lead.rating,
    company: lead.company_name,
    city: lead.city,
  };

  const raw = await llm({
    tier: "sonnet",
    agent: "analyzer",
    leadId,
    maxTokens: 1200,
    system: PROMPT,
    prompt: `Audit data:\n${JSON.stringify(auditData, null, 2)}\n\nReturn the JSON findings.`,
    mockResponse: JSON.stringify({
      summary: lead.website_url ? "Slow mobile site with no clear call path." : "No website; invisible to mobile searchers.",
      findings: [
        lead.website_url
          ? { category: "performance", severity: "high", evidence: `Lighthouse mobile performance ${lighthouse?.performance ?? 34}/100`, why_it_costs_them: "slow pages lose emergency callers to faster competitors" }
          : { category: "conversion", severity: "high", evidence: "no website found on the Google listing", why_it_costs_them: `mobile searchers in ${lead.city ?? "the area"} cannot find or trust the business` },
        { category: "conversion", severity: "high", evidence: "no tap-to-call element detected at 375px", why_it_costs_them: "phone-driven trade with no one-tap call path leaks leads" },
      ],
    }),
  });

  const parsed = safeJson(raw);
  const findings = Array.isArray(parsed?.findings) ? parsed.findings.filter((f: any) => f?.evidence && f?.why_it_costs_them) : [];

  await pool.query(
    `insert into audits (lead_id, lighthouse, screenshots, pages_crawled, findings, summary) values ($1,$2,$3,$4,$5,$6)`,
    [leadId, lighthouse ? JSON.stringify(lighthouse) : null, JSON.stringify(shots), JSON.stringify(pagesCrawled), JSON.stringify(findings), parsed?.summary ?? null],
  );
  await emitEvent({ agent: "analyzer", leadId, type: "audit.completed", message: `${findings.length} evidence-backed findings${MOCK() ? " (mock)" : ""}` });
  await advanceLead(leadId, "analyzed", { agent: "analyzer" });
}

function safeJson(s: string): any {
  try {
    const m = s.match(/\{[\s\S]*\}/);
    return m ? JSON.parse(m[0]) : null;
  } catch {
    return null;
  }
}
