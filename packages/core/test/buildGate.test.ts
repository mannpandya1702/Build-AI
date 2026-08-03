import { describe, expect, it } from "vitest";
import { canRunBuild } from "../src/buildGate.js";

// The rule that guards real money (MASTER_SPEC §2/§11). Every branch is asserted.
describe("canRunBuild — the spend gate", () => {
  const within = { budgetRemainingUsd: 30, estCostUsd: 6 };

  it("review mode BLOCKS a lead with no approval, even within budget", () => {
    const d = canRunBuild({ mode: "review", hasApproval: false, ...within });
    expect(d.allowed).toBe(false);
    expect(d.reason).toMatch(/approval/);
  });

  it("review mode ALLOWS an approved lead within budget", () => {
    expect(canRunBuild({ mode: "review", hasApproval: true, ...within }).allowed).toBe(true);
  });

  it("auto mode ALLOWS within budget without an explicit approval", () => {
    expect(canRunBuild({ mode: "auto", hasApproval: false, ...within }).allowed).toBe(true);
  });

  it("budget is a hard limit: an APPROVED lead is still blocked when the budget can't cover it", () => {
    const d = canRunBuild({ mode: "review", hasApproval: true, budgetRemainingUsd: 4, estCostUsd: 6 });
    expect(d.allowed).toBe(false);
    expect(d.reason).toMatch(/budget/);
  });

  it("budget is a hard limit in auto mode too", () => {
    expect(
      canRunBuild({ mode: "auto", hasApproval: false, budgetRemainingUsd: 0, estCostUsd: 6 }).allowed,
    ).toBe(false);
  });

  it("allows exactly at the budget boundary (est == remaining)", () => {
    expect(
      canRunBuild({ mode: "auto", hasApproval: false, budgetRemainingUsd: 6, estCostUsd: 6 }).allowed,
    ).toBe(true);
  });
});
