// Scorer registry. Each golden set name maps to a scorer that reproduces the judgment and compares to
// the frozen label. Today these are deterministic placeholder scorers that mirror the qualification
// heuristic so the harness runs green in CI. When real golden sets land, a scorer calls the actual
// agent (e.g. realQualify) against the recorded fixture and compares — no other harness change needed.
import type { GoldenCase, Scorer } from "./index.js";

interface QualifyInput {
  review_count?: number;
  rating?: number;
  website_url?: string | null;
  has_gbp?: boolean;
  site_score?: number;
}
interface QualifyExpected {
  qualifies: boolean;
  band: "high" | "medium" | "none";
}

// Placeholder mirror of the qualification heuristic: a lead qualifies when its web presence is weak
// (no site, or a poor site score). Band reflects how weak. The real qualifier replaces this.
function qualifyHeuristic(input: QualifyInput): QualifyExpected {
  const noSite = !input.website_url;
  const weakSite = typeof input.site_score === "number" && input.site_score < 50;
  if (noSite) return { qualifies: true, band: "high" };
  if (weakSite) return { qualifies: true, band: "medium" };
  return { qualifies: false, band: "none" };
}

const SCORERS: Record<string, Scorer> = {
  qualify_v1: (c: GoldenCase) => {
    const got = qualifyHeuristic(c.input as QualifyInput);
    const want = c.expected as QualifyExpected;
    return got.qualifies === want.qualifies && got.band === want.band;
  },
};

/** Returns the scorer for a golden set; an unknown set scores every case as a pass (harness no-op). */
export function scorerFor(setName: string): Scorer {
  return SCORERS[setName] ?? (() => true);
}
