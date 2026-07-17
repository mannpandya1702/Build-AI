import { describe, expect, it } from "vitest";
import { assertSmsAllowed, classifyInboundSms } from "../src/sms.js";
import { AUTOMATION_BY_KEY, AUTOMATION_TEMPLATES } from "../src/templates.js";

const BASE = { toNumber: "+15551230001", campaignStatus: "approved" as const, optedIn: true, localHour: 12 };

describe("A2P / SMS gate", () => {
  it("allows a send when campaign is approved, opt-in exists, and within quiet hours", () => {
    expect(assertSmsAllowed(BASE).allowed).toBe(true);
  });

  it("HARD-BLOCKS SMS until the A2P campaign is approved", () => {
    const d = assertSmsAllowed({ ...BASE, campaignStatus: "pending" });
    expect(d.allowed).toBe(false);
    expect(d.reason).toMatch(/campaign not approved/);
  });

  it("blocks without a stored opt-in", () => {
    expect(assertSmsAllowed({ ...BASE, optedIn: false }).allowed).toBe(false);
  });

  it("STOP is absolute — a suppressed number is blocked even with an approved campaign", () => {
    const d = assertSmsAllowed({ ...BASE, suppressed: ["+15551230001"] });
    expect(d.allowed).toBe(false);
    expect(d.reason).toMatch(/opted out/);
  });

  it("enforces quiet hours (8am-9pm local)", () => {
    expect(assertSmsAllowed({ ...BASE, localHour: 7 }).allowed).toBe(false);
    expect(assertSmsAllowed({ ...BASE, localHour: 22 }).allowed).toBe(false);
  });

  it("classifies STOP/HELP keywords", () => {
    expect(classifyInboundSms("STOP")).toBe("stop");
    expect(classifyInboundSms("unsubscribe please")).toBe("stop");
    expect(classifyInboundSms("HELP")).toBe("help");
    expect(classifyInboundSms("yes I'd like to book")).toBe("other");
  });
});

describe("automation templates", () => {
  it("ships exactly three templates", () => {
    expect(AUTOMATION_TEMPLATES).toHaveLength(3);
  });
  it("review requests intercept negative sentiment to the owner (never public)", () => {
    expect(AUTOMATION_BY_KEY.get("review_requests")?.negativeInterceptToOwner).toBe(true);
  });
  it("each template has a trigger, steps, and a stop condition", () => {
    for (const t of AUTOMATION_TEMPLATES) {
      expect(t.trigger.length).toBeGreaterThan(0);
      expect(t.steps.length).toBeGreaterThan(0);
      expect(t.stopOn.length).toBeGreaterThan(0);
    }
  });
});
