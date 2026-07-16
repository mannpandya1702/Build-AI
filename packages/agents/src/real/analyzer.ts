// Analyzer Agent (spec §6.4): PageSpeed + screenshots + Sonnet findings. Every finding cites
// evidence from the audit data. Sonnet judges the ACTUAL rendered screenshots (vision), not a
// text description of them. A qualified lead never produces an empty audit: if PageSpeed and the
// model both come up short, a deterministic fallback derives findings from strictly-known facts
// (Lighthouse scores or their absence, GBP review reputation, website presence). No-website leads
// get an absence-based audit.
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { MOCK, llm, pagespeed, screenshotSite } from "@autopilot/adapters";
import { advanceLead, emitEvent, getPool } from "@autopilot/core";

const PROMPT = readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), "prompts/analyzer.md"), "utf8");

function slugOf(lead: { slug: string | null; id: string }): string {
  return lead.slug ?? lead.id;
}

interface Finding {
  category: string;
  severity: "low" | "medium" | "high";
  evidence: string;
  why_it_costs_them: string;
}

export async function analyzer(leadId: string): Promise<void> {
  const pool = getPool();
  const lead = (await pool.query("select * from leads where id = $1", [leadId])).rows[0];
  if (!lead) throw new Error(`lead ${leadId} missing`);

  // Idempotency guard (spec §4.4): a duplicate job can fire after the lead already advanced
  // (singleton window race). Re-running would burn a Sonnet call, write a duplicate audit, and
  // throw on an illegal transition. If the lead has left `qualified`, this work is already done.
  if (lead.status !== "qualified") {
    await emitEvent({
      agent: "analyzer",
      leadId,
      level: "debug",
      type: "analyzer.skipped",
      message: `lead already at ${lead.status}`,
    });
    return;
  }

  let lighthouse: Record<string, number> | null = null;
  let pagespeedFailed = false;
  let shots: { viewport: string; path: string }[] = [];
  const pagesCrawled: string[] = [];

  if (lead.website_url) {
    try {
      const psi = await pagespeed(lead.website_url, "mobile");
      lighthouse = {
        performance: psi.performance,
        seo: psi.seo,
        accessibility: psi.accessibility,
        best_practices: psi.best_practices,
        lcp_ms: psi.lcp_ms ?? 0,
      };
    } catch (err) {
      pagespeedFailed = true;
      await emitEvent({
        agent: "analyzer",
        leadId,
        level: "warn",
        type: "pagespeed.failed",
        message: (err as Error).message,
      });
    }
    try {
      const s = await screenshotSite(lead.website_url, slugOf(lead));
      shots = s.map((x) => ({ viewport: x.viewport, path: x.path }));
      pagesCrawled.push(lead.website_url);
    } catch (err) {
      await emitEvent({
        agent: "analyzer",
        leadId,
        level: "warn",
        type: "screenshot.failed",
        message: (err as Error).message,
      });
    }
  }

  const auditData = {
    has_website: Boolean(lead.website_url),
    website_url: lead.website_url,
    lighthouse,
    pagespeed_could_not_measure: pagespeedFailed,
    screenshots_attached: shots.map((s) => s.viewport),
    review_count: lead.review_count,
    rating: lead.rating,
    company: lead.company_name,
    city: lead.city,
  };

  // Feed the real rendered mobile + desktop screenshots to the model so findings are backed by
  // the actual page, not a guess. Missing files are dropped inside the adapter.
  const visionImages = shots
    .filter((s) => s.viewport === "mobile" || s.viewport === "desktop")
    .map((s) => s.path);

  const raw = await llm({
    tier: "sonnet",
    agent: "analyzer",
    leadId,
    maxTokens: 1400,
    system: PROMPT,
    images: visionImages,
    prompt: `Audit data:\n${JSON.stringify(auditData, null, 2)}\n\n${
      visionImages.length
        ? `The attached images are the site's real rendered mobile and desktop screenshots. Judge what you can actually see (phone number visibility on mobile, dated vs modern look, clarity of the call-to-action).`
        : "No screenshots were captured."
    }\n\nReturn the JSON findings.`,
    mockResponse: JSON.stringify({
      summary: lead.website_url
        ? "Slow mobile site with no clear call path."
        : "No website; invisible to mobile searchers.",
      findings: [
        lead.website_url
          ? {
              category: "performance",
              severity: "high",
              evidence: `Lighthouse mobile performance ${lighthouse?.performance ?? 34}/100`,
              why_it_costs_them: "slow pages lose emergency callers to faster competitors",
            }
          : {
              category: "conversion",
              severity: "high",
              evidence: "no website found on the Google listing",
              why_it_costs_them: `mobile searchers in ${lead.city ?? "the area"} cannot find or trust the business`,
            },
        {
          category: "conversion",
          severity: "high",
          evidence: "no tap-to-call element detected at 375px",
          why_it_costs_them: "phone-driven trade with no one-tap call path leaks leads",
        },
      ],
    }),
  });

  const parsed = safeJson(raw);
  let findings: Finding[] = Array.isArray(parsed?.findings)
    ? parsed.findings.filter((f: any) => f?.evidence && f?.why_it_costs_them)
    : [];
  let summary: string | null =
    typeof parsed?.summary === "string" && parsed.summary.trim() ? parsed.summary.trim() : null;

  // GUARANTEE a coherent audit. A qualified lead must never land in `analyzed` with an empty audit
  // (Phase 3 acceptance). If the model returned nothing usable, derive findings from known facts.
  if (findings.length === 0) {
    findings = fallbackFindings(lead, lighthouse, pagespeedFailed);
    summary = summary ?? fallbackSummary(lead, lighthouse, pagespeedFailed);
    await emitEvent({
      agent: "analyzer",
      leadId,
      level: "warn",
      type: "audit.fallback",
      message: "model returned no usable findings; used deterministic fallback",
    });
  }
  summary = summary ?? fallbackSummary(lead, lighthouse, pagespeedFailed);

  await pool.query(
    "insert into audits (lead_id, lighthouse, screenshots, pages_crawled, findings, summary) values ($1,$2,$3,$4,$5,$6)",
    [
      leadId,
      lighthouse ? JSON.stringify(lighthouse) : null,
      JSON.stringify(shots),
      JSON.stringify(pagesCrawled),
      JSON.stringify(findings),
      summary,
    ],
  );
  await emitEvent({
    agent: "analyzer",
    leadId,
    type: "audit.completed",
    message: `${findings.length} evidence-backed findings${MOCK() ? " (mock)" : ""}`,
  });
  await advanceLead(leadId, "analyzed", { agent: "analyzer" });
}

/** Deterministic findings from strictly-known facts only. Never fabricates (CLAUDE.md §0.1). */
function fallbackFindings(
  lead: {
    website_url: string | null;
    review_count: number | null;
    rating: number | null;
    city: string | null;
  },
  lighthouse: Record<string, number> | null,
  pagespeedFailed: boolean,
): Finding[] {
  const out: Finding[] = [];
  const city = lead.city ?? "the area";
  const reviews = lead.review_count ?? null;
  const rating = lead.rating ?? null;

  if (!lead.website_url) {
    out.push({
      category: "conversion",
      severity: "high",
      evidence: "no website is listed on the Google Business Profile",
      why_it_costs_them: `mobile searchers comparing options in ${city} cannot find or vet the business, so it only reaches people who already know the name`,
    });
    if (reviews != null) {
      out.push({
        category: "trust",
        severity: "high",
        evidence: `${reviews} Google reviews${rating != null ? ` at ${rating}★` : ""} with no site to send them to`,
        why_it_costs_them: "a strong reputation has nowhere to convert the searcher into a booked call",
      });
    }
    return out;
  }

  if (lighthouse) {
    if (lighthouse.performance != null) {
      out.push({
        category: "performance",
        severity: lighthouse.performance < 50 ? "high" : "medium",
        evidence: `Lighthouse mobile performance ${lighthouse.performance}/100${lighthouse.lcp_ms ? ` (largest content paints at ${Math.round(lighthouse.lcp_ms)}ms)` : ""}`,
        why_it_costs_them: "slow mobile pages lose emergency callers to competitors that load faster",
      });
    }
    if (lighthouse.seo != null && lighthouse.seo < 90) {
      out.push({
        category: "seo",
        severity: lighthouse.seo < 70 ? "high" : "medium",
        evidence: `Lighthouse SEO ${lighthouse.seo}/100`,
        why_it_costs_them:
          "weaker search signals mean fewer of the people searching this service find the business first",
      });
    }
  } else if (pagespeedFailed) {
    out.push({
      category: "performance",
      severity: "high",
      evidence: `Google PageSpeed could not complete a Lighthouse audit for ${lead.website_url} after retries`,
      why_it_costs_them:
        "a page Google itself cannot measure in 90 seconds is a page real mobile visitors abandon before it loads",
    });
  }

  if (reviews != null) {
    out.push({
      category: "trust",
      severity: "medium",
      evidence: `${reviews} Google reviews${rating != null ? ` at ${rating}★` : ""}`,
      why_it_costs_them:
        "a demand signal this strong should be front-and-center on the site to turn visitors into calls",
    });
  }

  // Absolute floor: even with no other signal, presence-of-site + city is a real, citable fact.
  if (out.length === 0) {
    out.push({
      category: "conversion",
      severity: "medium",
      evidence: `the current site at ${lead.website_url} was reached but shows no measured strengths to build on`,
      why_it_costs_them: `visitors in ${city} have no clear reason to call rather than move to the next result`,
    });
  }
  return out;
}

function fallbackSummary(
  lead: { website_url: string | null; city: string | null },
  lighthouse: Record<string, number> | null,
  pagespeedFailed: boolean,
): string {
  if (!lead.website_url) return `No website; invisible to mobile searchers in ${lead.city ?? "the area"}.`;
  if (lighthouse?.performance != null)
    return `Live site scoring ${lighthouse.performance}/100 on mobile performance, with room to convert its reviews into calls.`;
  if (pagespeedFailed)
    return "Live site too slow for Google to measure; mobile visitors likely leave before it loads.";
  return "Live site with weak conversion signals for a phone-driven local business.";
}

function safeJson(s: string): any {
  try {
    const m = s.match(/\{[\s\S]*\}/);
    return m ? JSON.parse(m[0]) : null;
  } catch {
    return null;
  }
}
