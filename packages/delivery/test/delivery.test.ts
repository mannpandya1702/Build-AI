import { describe, expect, it } from "vitest";
import { computeSlaCredits } from "../src/sla.js";
import { type Metric, generateValueReport } from "../src/valueReport.js";

const METRICS: Metric[] = [
  { label: "Calls answered", value: 128, tag: "measured" },
  { label: "Leads captured", value: 41, tag: "measured" },
  { label: "Projected revenue", value: 90000, unit: "USD", tag: "estimated" }, // must NOT appear
  { label: "Allocated overhead", value: 300, unit: "USD", tag: "allocated" }, // must NOT appear
];

describe("value report (measured-only)", () => {
  const r = generateValueReport({ clientName: "Acme Roofing", periodLabel: "July 2026", metrics: METRICS });

  it("includes only measured metrics", () => {
    expect(r.lines.map((l) => l.label)).toEqual(["Calls answered", "Leads captured"]);
    expect(r.excludedCount).toBe(2);
  });

  it("contains ZERO estimated/allocated numbers (the §7.5 acceptance criterion)", () => {
    expect(r.markdown).not.toContain("90,000");
    expect(r.markdown).not.toContain("Projected revenue");
    expect(r.markdown).not.toContain("Allocated overhead");
    expect(r.markdown).toContain("Calls answered");
  });
});

describe("SLA credits", () => {
  const thresholds = { uptimePct: 99.5, speedToLeadSeconds: 60 };

  it("no credit when both SLAs are met", () => {
    const c = computeSlaCredits({ uptimePct: 99.9, speedToLeadP95Sec: 40 }, thresholds, 797);
    expect(c.credits).toHaveLength(0);
    expect(c.totalCreditUsd).toBe(0);
  });

  it("credits an uptime miss", () => {
    const c = computeSlaCredits({ uptimePct: 98.0 }, thresholds, 800);
    expect(c.credits).toHaveLength(1);
    expect(c.totalCreditPct).toBe(10);
    expect(c.totalCreditUsd).toBe(80);
  });

  it("credits both misses and caps the total", () => {
    const c = computeSlaCredits({ uptimePct: 95, speedToLeadP95Sec: 300 }, thresholds, 1000);
    expect(c.credits).toHaveLength(2);
    expect(c.totalCreditPct).toBe(20);
    expect(c.totalCreditUsd).toBe(200);
  });
});
