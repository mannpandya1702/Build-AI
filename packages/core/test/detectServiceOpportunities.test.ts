import { describe, expect, it } from "vitest";
import {
  type BusinessSignals,
  detectServiceOpportunities,
  detectedServiceTypes,
} from "../src/detectServiceOpportunities.js";

// a healthy phone-driven trade with cash flow; individual tests override what they care about
function signals(p: Partial<BusinessSignals> = {}): BusinessSignals {
  return {
    hasWebsite: p.hasWebsite ?? false,
    siteIsWeak: p.siteIsWeak ?? false,
    reviewCount: p.reviewCount ?? 120,
    isPhoneDriven: p.isPhoneDriven ?? true,
    hasOnlineBooking: p.hasOnlineBooking ?? false,
    hasChat: p.hasChat ?? false,
  };
}

describe("detectServiceOpportunities", () => {
  it("proposes website ONLY as a cold pitch, and only when there is a gap", () => {
    // no website → cold website
    const a = detectServiceOpportunities(
      signals({ hasWebsite: false, reviewCount: 0, isPhoneDriven: false }),
    );
    expect(a).toEqual([{ service_type: "website", phase: "cold", rationale: expect.any(String) }]);
    // strong existing site → no website opportunity
    const b = detectServiceOpportunities(
      signals({ hasWebsite: true, siteIsWeak: false, reviewCount: 0, isPhoneDriven: false, hasChat: true }),
    );
    expect(b.map((o) => o.service_type)).not.toContain("website");
  });

  it("tags every non-website line as expansion (never cold)", () => {
    const all = detectServiceOpportunities(signals());
    for (const o of all) {
      if (o.service_type !== "website") expect(o.phase).toBe("expansion");
    }
  });

  it("proposes automation for a phone-driven business with 40+ reviews", () => {
    expect(detectedServiceTypes(signals({ reviewCount: 40 }))).toContain("ai_automation");
    // below the threshold → no automation
    expect(detectedServiceTypes(signals({ reviewCount: 39, isPhoneDriven: true }))).not.toContain(
      "ai_automation",
    );
    // not phone-driven → no automation even with reviews
    expect(detectedServiceTypes(signals({ isPhoneDriven: false, reviewCount: 200 }))).not.toContain(
      "ai_automation",
    );
  });

  it("proposes chatbot only when there's no existing capture path", () => {
    expect(detectedServiceTypes(signals({ reviewCount: 20, hasChat: false }))).toContain("chatbot");
    expect(detectedServiceTypes(signals({ reviewCount: 20, hasChat: true }))).not.toContain("chatbot");
    expect(detectedServiceTypes(signals({ reviewCount: 19 }))).not.toContain("chatbot");
  });

  it("proposes a voice agent only above the high-call-volume threshold", () => {
    expect(detectedServiceTypes(signals({ reviewCount: 100 }))).toContain("voice_agent");
    expect(detectedServiceTypes(signals({ reviewCount: 99 }))).not.toContain("voice_agent");
    expect(detectedServiceTypes(signals({ reviewCount: 200, isPhoneDriven: false }))).not.toContain(
      "voice_agent",
    );
  });

  it("full-stack candidate: weak site + high reviews + phone-driven → all four lines", () => {
    const all = detectedServiceTypes(signals({ hasWebsite: true, siteIsWeak: true, reviewCount: 150 }));
    expect(all).toEqual(["website", "ai_automation", "chatbot", "voice_agent"]);
  });

  it("a quiet non-phone business with a decent site proposes nothing", () => {
    const none = detectServiceOpportunities({
      hasWebsite: true,
      siteIsWeak: false,
      reviewCount: 5,
      isPhoneDriven: false,
      hasOnlineBooking: true,
      hasChat: true,
    });
    expect(none).toHaveLength(0);
  });
});
