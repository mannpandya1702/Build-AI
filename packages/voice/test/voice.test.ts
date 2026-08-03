import { describe, expect, it } from "vitest";
import { type ConsentRecord, assertCallAllowed } from "../src/consent.js";
import { ASSISTANT_BY_KEY, ASSISTANT_TEMPLATES } from "../src/templates.js";

const FORM_CONSENT: ConsentRecord[] = [
  { number: "+15551230001", basis: "form", callConsent: true, capturedAt: "2026-07-01" },
];

describe("TCPA consent gate", () => {
  it("always allows inbound calls (the prospect called us)", () => {
    expect(
      assertCallAllowed({ number: "+15550000000", direction: "inbound", consentRecords: [] }).allowed,
    ).toBe(true);
  });

  it("REFUSES an outbound call with no consent record", () => {
    const d = assertCallAllowed({
      number: "+15559999999",
      direction: "outbound",
      consentRecords: FORM_CONSENT,
    });
    expect(d.allowed).toBe(false);
    expect(d.reason).toMatch(/no consent record/);
  });

  it("allows an outbound call with form consent that includes call language", () => {
    expect(
      assertCallAllowed({
        number: "+15551230001",
        direction: "outbound",
        consentRecords: FORM_CONSENT,
        localHour: 10,
      }).allowed,
    ).toBe(true);
  });

  it("refuses form consent that lacks call-consent language", () => {
    const rec: ConsentRecord[] = [
      { number: "+15551230002", basis: "form", callConsent: false, capturedAt: "x" },
    ];
    expect(
      assertCallAllowed({ number: "+15551230002", direction: "outbound", consentRecords: rec }).allowed,
    ).toBe(false);
  });

  it("suppression is absolute — refuses even with consent", () => {
    const d = assertCallAllowed({
      number: "+15551230001",
      direction: "outbound",
      consentRecords: FORM_CONSENT,
      suppressed: ["+15551230001"],
    });
    expect(d.allowed).toBe(false);
    expect(d.reason).toMatch(/suppression/);
  });

  it("enforces the 8am-9pm calling window", () => {
    expect(
      assertCallAllowed({
        number: "+15551230001",
        direction: "outbound",
        consentRecords: FORM_CONSENT,
        localHour: 7,
      }).allowed,
    ).toBe(false);
    expect(
      assertCallAllowed({
        number: "+15551230001",
        direction: "outbound",
        consentRecords: FORM_CONSENT,
        localHour: 21,
      }).allowed,
    ).toBe(false);
    expect(
      assertCallAllowed({
        number: "+15551230001",
        direction: "outbound",
        consentRecords: FORM_CONSENT,
        localHour: 14,
      }).allowed,
    ).toBe(true);
  });
});

describe("assistant templates", () => {
  it("ships the four templates, each with a mandatory AI disclosure line", () => {
    expect(ASSISTANT_TEMPLATES).toHaveLength(4);
    for (const t of ASSISTANT_TEMPLATES) {
      expect(t.disclosureLine.trim().length).toBeGreaterThan(0);
    }
  });

  it("every outbound template is consent-gated; inbound receptionist is not", () => {
    for (const t of ASSISTANT_TEMPLATES) {
      expect(t.requiresConsent).toBe(t.direction === "outbound");
    }
    expect(ASSISTANT_BY_KEY.get("inbound_receptionist")?.requiresConsent).toBe(false);
    expect(ASSISTANT_BY_KEY.get("speed_to_lead")?.requiresConsent).toBe(true);
  });
});
