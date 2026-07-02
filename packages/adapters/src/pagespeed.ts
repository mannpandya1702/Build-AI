// PageSpeed Insights adapter (spec §3). Used by the analyzer (Phase 3); built now with the key.
import { MOCK } from "./config.js";

export interface PsiScores {
  performance: number;
  seo: number;
  accessibility: number;
  best_practices: number;
  lcp_ms: number | null;
}

export async function pagespeed(url: string, strategy: "mobile" | "desktop" = "mobile"): Promise<PsiScores> {
  if (MOCK()) return { performance: 34, seo: 61, accessibility: 70, best_practices: 75, lcp_ms: 5200 };
  const key = process.env.PAGESPEED_API_KEY;
  if (!key) throw new Error("PAGESPEED_API_KEY is not set");
  const qs = new URLSearchParams({ url, key, strategy });
  for (const c of ["performance", "seo", "accessibility", "best-practices"]) qs.append("category", c);
  const res = await fetch(`https://www.googleapis.com/pagespeedonline/v5/runPagespeed?${qs}`, {
    signal: AbortSignal.timeout(90_000),
  });
  if (!res.ok) throw new Error(`pagespeed ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const d = (await res.json()) as any;
  const cats = d.lighthouseResult?.categories ?? {};
  const pct = (x: any) => Math.round(((x?.score as number) ?? 0) * 100);
  return {
    performance: pct(cats.performance),
    seo: pct(cats.seo),
    accessibility: pct(cats.accessibility),
    best_practices: pct(cats["best-practices"]),
    lcp_ms: d.lighthouseResult?.audits?.["largest-contentful-paint"]?.numericValue ?? null,
  };
}
