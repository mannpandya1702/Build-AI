import { describe, expect, it } from "vitest";
import * as adapters from "../src/index.js";

// Phase 0 smoke: the adapters barrel loads cleanly (no import-time crash) and exposes the caps loader.
// Real adapter tests (safeFetch SSRF corpus, email gate) land in Phases 1/6 per MASTER_SPEC §11.
describe("adapters barrel", () => {
  it("loads and exposes loadCaps", () => {
    expect(typeof (adapters as Record<string, unknown>).loadCaps).toBe("function");
  });
});
