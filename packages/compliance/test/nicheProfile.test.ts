import { describe, expect, it } from "vitest";
import { type ComplianceState, assertNicheActivatable, loadNicheProfile } from "../src/nicheProfile.js";

const NONE: ComplianceState = {
  baaTemplateOnFile: false,
  insuranceOnFile: false,
  phiHandlingEnabled: false,
  legalAdReviewAck: false,
};
const HEALTHCARE_READY: ComplianceState = {
  baaTemplateOnFile: true,
  insuranceOnFile: true,
  phiHandlingEnabled: true,
  legalAdReviewAck: false,
};

describe("niche profiles + activation gate (Amendment A)", () => {
  it("loads the baseline roofing niche", () => {
    const p = loadNicheProfile("roofing");
    expect(p.compliance.regime).toBe("baseline");
    expect(p.tier).toBe("volume");
  });

  it("loads the healthcare niches (dental, med_spa, mental_health, chiropractic)", () => {
    for (const n of ["dental", "med_spa", "mental_health", "chiropractic"]) {
      const p = loadNicheProfile(n);
      expect(p.compliance.regime).toBe("healthcare");
      expect(p.compliance.requires_baa).toBe(true);
      expect(p.tier).toBe("high_ticket");
    }
  });

  it("baseline niche activates immediately with nothing on file", () => {
    expect(assertNicheActivatable(loadNicheProfile("roofing"), NONE)).toEqual({
      activatable: true,
      missing: [],
    });
  });

  it("healthcare niche is BLOCKED until BAA + insurance + PHI handling are on file", () => {
    const d = assertNicheActivatable(loadNicheProfile("dental"), NONE);
    expect(d.activatable).toBe(false);
    expect(d.missing).toContain("BAA template on file");
    expect(d.missing).toContain("PHI handling enabled");
    expect(d.missing.some((m) => m.includes("insurance"))).toBe(true);
  });

  it("healthcare niche activates once the compliance profile is satisfied", () => {
    expect(assertNicheActivatable(loadNicheProfile("dental"), HEALTHCARE_READY)).toEqual({
      activatable: true,
      missing: [],
    });
  });

  it("rejects an invalid niche name (path-traversal guard)", () => {
    expect(() => loadNicheProfile("../secrets")).toThrow();
  });
});
