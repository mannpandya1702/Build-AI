// The spend-gate decision (MASTER_SPEC §2, §8.4). Pure and exhaustively tested: given a lead sitting
// at `awaiting_build_approval`, may the paid pipeline (analyze -> solution -> design -> build) proceed?
//
//   review mode (default): only with an operator approval AND within the day's build budget.
//   auto mode  (opt-in):   within budget, no per-lead approval needed (top-scored leads first).
//
// The scheduler owns the I/O (does an approval event exist? what's today's remaining budget?) and
// calls this to decide. Keeping the decision pure means the exact rule that guards real spend is
// unit-tested, not buried in a scheduler loop.

export type BuildMode = "review" | "auto";

export interface BuildGateInput {
  mode: BuildMode;
  /** a `lead.build_approved` event exists for this lead */
  hasApproval: boolean;
  /** USD of build budget still available today */
  budgetRemainingUsd: number;
  /** projected USD cost of building this lead's demo */
  estCostUsd: number;
}

export interface BuildGateDecision {
  allowed: boolean;
  reason: string;
}

export function canRunBuild(input: BuildGateInput): BuildGateDecision {
  // Budget is a hard limit in BOTH modes — an operator approval never overrides the daily ceiling
  // (it pauses + notifies instead, spec §2 "caps are hard limits").
  if (!(input.estCostUsd <= input.budgetRemainingUsd)) {
    return { allowed: false, reason: "daily build budget exhausted" };
  }
  if (input.mode === "review" && !input.hasApproval) {
    return { allowed: false, reason: "awaiting operator approval" };
  }
  return {
    allowed: true,
    reason: input.mode === "auto" ? "auto mode, within budget" : "operator approved, within budget",
  };
}
