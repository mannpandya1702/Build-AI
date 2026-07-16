import { describe, expect, it } from "vitest";
import { ContractValidationError, generateContract } from "../src/contract.js";
import { loadPricing } from "../src/pricing.js";

const AGENCY = { name: "TradeCraft Sites", address: "123 Main St, Dallas, TX" };
const CLIENT = { name: "Acme Roofing", address: "5 Oak Ave, Plano, TX" };

describe("contract generator (MASTER_SPEC §4 Phase 3)", () => {
  it("generates a valid website contract at ladder pricing", () => {
    const c = generateContract({
      client: CLIENT,
      agency: AGENCY,
      productKey: "website",
      setupUsd: 1500,
      monthlyUsd: 99,
    });
    expect(c.markdown).toContain("Service Agreement — Website");
    expect(c.markdown).toContain("$1,500");
    // correct IP clause: client owns deliverables, agency owns platform
    expect(c.markdown).toMatch(/Agency retains all right/i);
    expect(c.markdown).not.toMatch(/platform.*owned exclusively by the Client/i);
  });

  it("REFUSES contradictory pricing (setup not on the ladder)", () => {
    expect(() =>
      generateContract({
        client: CLIENT,
        agency: AGENCY,
        productKey: "website",
        setupUsd: 999,
        monthlyUsd: 99,
      }),
    ).toThrow(ContractValidationError);
  });

  it("REFUSES a blank required field", () => {
    expect(() =>
      generateContract({
        client: { name: "", address: "x" },
        agency: AGENCY,
        productKey: "website",
        setupUsd: 1500,
        monthlyUsd: 99,
      }),
    ).toThrow(/client name is blank/);
  });

  it("allows the high-ticket niche within its range but not outside", () => {
    expect(
      generateContract({
        client: CLIENT,
        agency: AGENCY,
        productKey: "high_ticket_niche",
        setupUsd: 7500,
        monthlyUsd: 1800,
      }).setupUsd,
    ).toBe(7500);
    expect(() =>
      generateContract({
        client: CLIENT,
        agency: AGENCY,
        productKey: "high_ticket_niche",
        setupUsd: 20000,
        monthlyUsd: 1800,
      }),
    ).toThrow(/outside/);
  });

  it("honors the chatbot setup waiver (setup 0 allowed when bundled)", () => {
    expect(
      generateContract({
        client: CLIENT,
        agency: AGENCY,
        productKey: "chatbot",
        setupUsd: 0,
        monthlyUsd: 197,
      }).setupUsd,
    ).toBe(0);
  });

  it("refuses an unknown product", () => {
    expect(() =>
      generateContract({ client: CLIENT, agency: AGENCY, productKey: "nope", setupUsd: 1, monthlyUsd: 1 }),
    ).toThrow(/unknown product/);
  });

  it("the configured IP clause is the agency-owns-platform one (never ClinicPro's)", () => {
    expect(loadPricing().contract.ip_clause).toBe("client_owns_deliverables_agency_owns_platform");
  });
});
