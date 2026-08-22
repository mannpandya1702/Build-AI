"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";

/**
 * Runs Google's own PageSpeed test against the public site, from the
 * viewer's browser, on demand.
 *
 * Why this shape: the panel's rule is that it never invents a number, and
 * the PageSpeed Insights API is the one source of real performance data that
 * needs no account, no API key and no stored credentials — Google allows a
 * small unauthenticated quota, which a button pressed by one studio owner
 * sits well inside. It runs client-side because the API sends CORS headers
 * and a 30-second test has no business blocking the panel's server render.
 */

type Scores = {
  performance: number | null;
  accessibility: number | null;
  bestPractices: number | null;
  seo: number | null;
  lcp: string | null;
  cls: string | null;
  tbt: string | null;
  strategy: "mobile" | "desktop";
};

type State =
  | { phase: "idle" }
  | { phase: "running"; strategy: "mobile" | "desktop" }
  | { phase: "done"; scores: Scores }
  | { phase: "error"; message: string };

function scoreTone(score: number | null): string {
  if (score === null) return "text-stone-deep";
  if (score >= 90) return "text-[#3f6b3f]";
  if (score >= 50) return "text-[#8a6a2f]";
  return "text-[#8f3a32]";
}

export function SpeedCheck({ origin }: { origin: string }) {
  const [state, setState] = useState<State>({ phase: "idle" });

  async function run(strategy: "mobile" | "desktop") {
    setState({ phase: "running", strategy });

    const url = new URL("https://www.googleapis.com/pagespeedonline/v5/runPagespeed");
    url.searchParams.set("url", `${origin}/`);
    url.searchParams.set("strategy", strategy);
    for (const category of ["performance", "accessibility", "best-practices", "seo"]) {
      url.searchParams.append("category", category);
    }

    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(90_000) });
      if (!res.ok) {
        setState({
          phase: "error",
          message:
            res.status === 429
              ? "Google's test is busy right now — wait a minute and run it again."
              : `Google's test could not run (it returned ${res.status}). Try again in a minute.`,
        });
        return;
      }

      const data = (await res.json()) as {
        lighthouseResult?: {
          categories?: Record<string, { score?: number }>;
          audits?: Record<string, { displayValue?: string }>;
        };
      };
      const categories = data.lighthouseResult?.categories ?? {};
      const audits = data.lighthouseResult?.audits ?? {};
      const pct = (key: string) => {
        const score = categories[key]?.score;
        return typeof score === "number" ? Math.round(score * 100) : null;
      };

      setState({
        phase: "done",
        scores: {
          performance: pct("performance"),
          accessibility: pct("accessibility"),
          bestPractices: pct("best-practices"),
          seo: pct("seo"),
          lcp: audits["largest-contentful-paint"]?.displayValue ?? null,
          cls: audits["cumulative-layout-shift"]?.displayValue ?? null,
          tbt: audits["total-blocking-time"]?.displayValue ?? null,
          strategy,
        },
      });
    } catch {
      setState({
        phase: "error",
        message:
          "The test did not finish — usually a slow moment at Google's end, occasionally a page it could not reach. Run it again.",
      });
    }
  }

  const running = state.phase === "running";

  return (
    <div className="rounded-sm border border-ink/12 bg-chandni p-5 shadow-[0_1px_0_0_rgba(34,39,31,0.04)]">
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <div>
          <p className="font-sans text-body font-semibold text-ink">
            How fast the site feels to a visitor
          </p>
          <p className="mt-1 max-w-xl font-sans text-micro text-stone-deep">
            Runs Google&apos;s own test against {origin.replace(/^https?:\/\//, "")} — it loads the
            page on a simulated phone or desktop and measures it. Takes about half a minute.
            Nothing to set up.
          </p>
        </div>
        <div className="flex gap-2">
          {(["mobile", "desktop"] as const).map((strategy) => (
            <button
              key={strategy}
              type="button"
              disabled={running}
              onClick={() => run(strategy)}
              className={cn(
                "rounded-full border border-ink/20 px-4 py-1.5 font-sans text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-stone-deep transition-colors",
                running ? "cursor-wait opacity-50" : "hover:border-ink/40 hover:text-ink",
              )}
            >
              Test {strategy}
            </button>
          ))}
        </div>
      </div>

      <div aria-live="polite">
        {state.phase === "running" && (
          <p className="mt-4 border-t border-ink/10 pt-4 font-sans text-micro text-stone-deep">
            Google is loading the page on a simulated {state.strategy} — about 30 seconds…
          </p>
        )}

        {state.phase === "error" && (
          <p className="mt-4 border-t border-ink/10 pt-4 font-sans text-micro text-[#8f3a32]">
            {state.message}
          </p>
        )}

        {state.phase === "done" && (
          <div className="mt-4 border-t border-ink/10 pt-4">
            <div className="grid gap-4 sm:grid-cols-4">
              {(
                [
                  ["Speed", state.scores.performance],
                  ["Accessibility", state.scores.accessibility],
                  ["Best practice", state.scores.bestPractices],
                  ["Search basics", state.scores.seo],
                ] as const
              ).map(([label, score]) => (
                <div key={label}>
                  <p
                    className={cn(
                      "font-display text-3xl font-light leading-none lining-nums tabular-nums",
                      scoreTone(score),
                    )}
                  >
                    {score ?? "—"}
                  </p>
                  <p className="mt-2 font-sans text-[0.625rem] font-semibold uppercase tracking-[0.16em] text-stone-deep">
                    {label}
                  </p>
                </div>
              ))}
            </div>
            <p className="mt-4 font-sans text-micro text-stone-deep">
              Measured on a simulated {state.scores.strategy}
              {state.scores.lcp ? ` · largest content painted in ${state.scores.lcp}` : ""}
              {state.scores.cls ? ` · layout shift ${state.scores.cls}` : ""}
              {state.scores.tbt ? ` · blocked for ${state.scores.tbt}` : ""}. Out of 100; 90 and
              above is the band Google calls good.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
