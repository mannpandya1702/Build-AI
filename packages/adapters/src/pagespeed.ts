// PageSpeed Insights adapter (spec §3). Used by the analyzer (Phase 3); built now with the key.
import { MOCK } from "./config.js";

export interface PsiScores {
  performance: number;
  seo: number;
  accessibility: number;
  best_practices: number;
  lcp_ms: number | null;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function pagespeed(url: string, strategy: "mobile" | "desktop" = "mobile"): Promise<PsiScores> {
  if (MOCK()) return { performance: 34, seo: 61, accessibility: 70, best_practices: 75, lcp_ms: 5200 };
  const key = process.env.PAGESPEED_API_KEY;
  if (!key) throw new Error("PAGESPEED_API_KEY is not set");
  const qs = new URLSearchParams({ url, key, strategy });
  for (const c of ["performance", "seo", "accessibility", "best-practices"]) qs.append("category", c);

  // PageSpeed frequently returns a transient 500 ("Lighthouse returned error: Something went
  // wrong") when Google's runner times out on a slow page. Retry twice before giving up; a page
  // that still fails after retries is itself signal the analyzer turns into a finding.
  let lastErr = "";
  for (let attempt = 1; attempt <= 3; attempt++) {
    let res: Response;
    try {
      res = await fetch(`https://www.googleapis.com/pagespeedonline/v5/runPagespeed?${qs}`, {
        signal: AbortSignal.timeout(90_000),
      });
    } catch (e) {
      lastErr = (e as Error).message;
      if (attempt < 3) await sleep(attempt * 3000);
      continue;
    }
    if (res.ok) {
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
    lastErr = `pagespeed ${res.status}: ${(await res.text()).slice(0, 200)}`;
    // 4xx (bad url, unauthorized) will not fix themselves; don't burn retries on them.
    if (res.status >= 400 && res.status < 500) break;
    if (attempt < 3) await sleep(attempt * 3000);
  }
  throw new Error(lastErr || "pagespeed failed");
}
