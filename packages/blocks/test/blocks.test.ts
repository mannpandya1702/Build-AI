import { describe, it, expect } from "vitest";
import { BLOCKS, blockDataSatisfied, BLOCK_BY_ID } from "../src/registry.js";
import { PRESETS, presetForIndustry } from "../src/presets.js";
import { LOOKS, looksForPreset } from "../src/looks.js";

describe("block library (spec §6.7 acceptance: ≥12 blocks, 4 presets)", () => {
  it("has at least 12 blocks", () => {
    expect(BLOCKS.length).toBeGreaterThanOrEqual(12);
  });

  it("covers the required block types", () => {
    for (const id of ["sticky-call-header", "hero-photo", "stats-strip", "services-grid", "niche-need-band", "process-steps", "gallery", "reviews", "service-map", "faq", "quote-form", "footer"]) {
      expect(BLOCK_BY_ID.has(id)).toBe(true);
    }
  });

  it("has 4 presets, roofing live with 4 looks", () => {
    expect(PRESETS.length).toBe(4);
    const roofing = PRESETS.find((p) => p.id === "roofing")!;
    expect(roofing.live).toBe(true);
    expect(roofing.looks.length).toBe(4);
  });

  it("every preset's block sequence references real blocks", () => {
    for (const p of PRESETS) for (const b of p.blockSequence) expect(BLOCK_BY_ID.has(b)).toBe(true);
  });

  it("every look belongs to a preset and has a distinctive (non-system) display font", () => {
    const banned = ["Inter", "Roboto", "Arial", "Open Sans", "system-ui"];
    for (const l of LOOKS) {
      expect(looksForPreset(l.preset).length).toBeGreaterThan(0);
      expect(banned).not.toContain(l.typePairing.display);
    }
  });

  it("omits a conditional block when its data is missing (no fabrication)", () => {
    const reviews = BLOCK_BY_ID.get("reviews")!;
    expect(blockDataSatisfied(reviews, { reviews: [] })).toBe(false);
    expect(blockDataSatisfied(reviews, { reviews: [{ author: "x", rating: 5, text: "great" }] })).toBe(true);
  });

  it("maps industries to presets, defaulting to roofing", () => {
    expect(presetForIndustry("roofing contractor").id).toBe("roofing");
    expect(presetForIndustry("Emergency Plumbing").id).toBe("plumbing");
    expect(presetForIndustry(null).id).toBe("roofing");
  });
});
