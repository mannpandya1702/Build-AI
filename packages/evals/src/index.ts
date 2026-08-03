// Eval harness (AI_AGENCY_MASTER_SPEC.md §11). Golden sets are frozen fixtures of known-good
// judgments (scores, QA verdicts, reply classifications). A scorer runs the current model/logic over
// each case and compares to the frozen label. A metric that drops more than the allowed threshold
// fails CI — prompt changes are treated like schema migrations: versioned, evaluated, reversible.
//
// MOCK-first: the golden sets shipped here are small SYNTHETIC placeholders so the harness runs in CI
// today. They are replaced with real sets frozen from the ~108 processed leads once the operator
// provides the labels ([NEEDS] in NEEDS_FROM_OPERATOR.md).
import { z } from "zod";

export const GoldenCaseSchema = z.object({
  id: z.string(),
  input: z.unknown(),
  expected: z.unknown(),
});
export type GoldenCase = z.infer<typeof GoldenCaseSchema>;

export const GoldenSetSchema = z.object({
  name: z.string(),
  version: z.string(),
  /** synthetic placeholder set vs frozen-from-real-data */
  provenance: z.enum(["placeholder", "frozen"]),
  /** max allowed metric drop (points, 0-100) before CI fails */
  regressionThreshold: z.number().default(2),
  cases: z.array(GoldenCaseSchema),
});
export type GoldenSet = z.infer<typeof GoldenSetSchema>;

export interface EvalResult {
  set: string;
  version: string;
  provenance: string;
  total: number;
  passed: number;
  score: number; // 0-100
}

/** A scorer decides whether the produced output matches the golden expectation for one case. */
export type Scorer = (c: GoldenCase) => boolean | Promise<boolean>;

export async function runGoldenSet(set: GoldenSet, scorer: Scorer): Promise<EvalResult> {
  let passed = 0;
  for (const c of set.cases) {
    if (await scorer(c)) passed += 1;
  }
  const total = set.cases.length;
  const score = total === 0 ? 100 : Math.round((passed / total) * 100);
  return { set: set.name, version: set.version, provenance: set.provenance, total, passed, score };
}
