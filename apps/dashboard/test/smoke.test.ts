import { afterEach, describe, expect, it } from "vitest";
import { devToolsEnabled } from "../lib/devtools";

// Phase 0 smoke: the dev-tools gate is security-relevant (it must fail closed on hosts). Real
// dashboard e2e (login -> approve-shortlist -> approve-outbox) lands in Phase F per MASTER_SPEC §11.
describe("dev-tools gate", () => {
  const saved = process.env;

  // Build a fresh env with the given keys absent. Never assign `undefined` to a process.env key —
  // Node coerces it to the string "undefined" (truthy), which would invert this security check.
  function envWithout(...keys: string[]): NodeJS.ProcessEnv {
    return Object.fromEntries(Object.entries(saved).filter(([k]) => !keys.includes(k))) as NodeJS.ProcessEnv;
  }

  afterEach(() => {
    process.env = saved;
  });

  it("is enabled off-Vercel (local dev)", () => {
    process.env = envWithout("VERCEL", "ALLOW_DEV_TOOLS");
    expect(devToolsEnabled()).toBe(true);
  });

  it("is disabled on Vercel unless explicitly allowed", () => {
    process.env = { ...envWithout("ALLOW_DEV_TOOLS"), VERCEL: "1" };
    expect(devToolsEnabled()).toBe(false);
    process.env.ALLOW_DEV_TOOLS = "1";
    expect(devToolsEnabled()).toBe(true);
  });
});
