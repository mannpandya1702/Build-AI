import { describe, expect, it } from "vitest";
import { LOOKS, looksForPreset } from "../src/looks.js";
import { PRESETS, presetForIndustry } from "../src/presets.js";
import { BLOCKS, BLOCK_BY_ID, blockDataSatisfied } from "../src/registry.js";

describe("block library (spec §6.7 acceptance: ≥12 blocks, 4 presets)", () => {
  it("has at least 12 blocks", () => {
    expect(BLOCKS.length).toBeGreaterThanOrEqual(12);
  });

  it("covers the required block types", () => {
    for (const id of [
      "sticky-call-header",
      "hero-photo",
      "stats-strip",
      "services-grid",
      "niche-need-band",
      "process-steps",
      "gallery",
      "reviews",
      "service-map",
      "faq",
      "quote-form",
      "footer",
    ]) {
      expect(BLOCK_BY_ID.has(id)).toBe(true);
    }
  });

  it("has 4 presets, roofing live with enough looks for the §5d no-reuse rule", () => {
    expect(PRESETS.length).toBe(4);
    const roofing = PRESETS.find((p) => p.id === "roofing")!;
    expect(roofing.live).toBe(true);
    // roofing (the live vertical) carries the 4 proven looks + skill-grounded additions
    expect(roofing.looks.length).toBeGreaterThanOrEqual(8);
  });

  it("every look's fonts are declared in the roofing template's name-based font registry", () => {
    // Fonts the roofing template (legacy/templates/roofers) loads via next/font. A live-preset look
    // must render faithfully; guard against adding a look whose font the template can't load.
    // Source of truth: FONT_VARS in legacy/templates/roofers/app/layout.tsx. Keep in sync — a look
    // whose font is not loaded there renders with a fallback (silent design regression).
    const RENDERABLE = new Set([
      "Bricolage Grotesque",
      "Source Sans 3",
      "Archivo",
      "IBM Plex Sans",
      "Space Grotesk",
      "Work Sans",
      "Anton",
      "Bebas Neue",
      "Outfit",
      "Sora",
      "Hanken Grotesk",
      "Chivo",
      "Rubik",
      "Manrope",
      "Barlow Condensed",
      "Alfa Slab One",
    ]);
    for (const p of PRESETS.filter((p) => p.live)) {
      for (const l of p.looks) {
        expect(RENDERABLE.has(l.typePairing.display), `${l.name} display ${l.typePairing.display}`).toBe(
          true,
        );
        expect(RENDERABLE.has(l.typePairing.body), `${l.name} body ${l.typePairing.body}`).toBe(true);
      }
    }
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
