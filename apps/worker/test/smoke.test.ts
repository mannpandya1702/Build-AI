import { describe, expect, it } from "vitest";
import { demoBatchRemaining, readDemoBatch } from "../src/batch.js";

// Phase 0 smoke: pure batch-accounting helpers load without booting the worker (which has main()
// side effects). Real worker tests (spend-gate: no build job without an approval event) land in
// Phase 2 per MASTER_SPEC §11.
describe("worker batch helpers", () => {
  it("exposes batch-accounting functions", () => {
    expect(typeof readDemoBatch).toBe("function");
    expect(typeof demoBatchRemaining).toBe("function");
  });
});
