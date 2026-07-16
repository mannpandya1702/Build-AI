// Niche-Expansion Engine (IMPLEMENTATION_PLAN.md Amendment A). A niche is targeting config + a
// compliance profile + a price tier + a playbook skill. "Target any vertical" is a one-flip
// capability, but a HIGH-COMPLIANCE niche (healthcare, legal) cannot be ACTIVATED until its
// compliance profile is satisfied — so the spec's healthcare-off-by-default stance (§10) holds:
// healthcare is reachable only through a satisfied BAA/insurance/PHI profile. This module is pure +
// tested; the activation gate is checked before discovery/outreach runs for a niche.
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";
import { z } from "zod";

const CONFIG_DIR = resolve(dirname(fileURLToPath(import.meta.url)), "../../../config");

export const ComplianceRegimeSchema = z.enum(["baseline", "healthcare", "legal"]);
export type ComplianceRegime = z.infer<typeof ComplianceRegimeSchema>;

export const NicheProfileSchema = z.object({
  niche: z.string(),
  vertical: z.string(),
  display_name: z.string(),
  tier: z.enum(["volume", "high_ticket"]).default("volume"),
  compliance: z
    .object({
      regime: ComplianceRegimeSchema.default("baseline"),
      requires_baa: z.boolean().default(false),
      phi_handling: z.boolean().default(false),
      insurance_required: z.array(z.string()).default([]),
    })
    .default({ regime: "baseline", requires_baa: false, phi_handling: false, insurance_required: [] }),
  pricing_tier: z.string().default("volume"),
  playbook_skill: z.string().optional(),
});
export type NicheProfile = z.infer<typeof NicheProfileSchema>;

export function loadNicheProfile(niche: string): NicheProfile {
  const safe = niche.replace(/[^a-z0-9_-]/gi, "");
  if (!safe) throw new Error(`invalid niche name: ${niche}`);
  const raw = readFileSync(resolve(CONFIG_DIR, "niches", `${safe}.yaml`), "utf8");
  return NicheProfileSchema.parse(parse(raw));
}

// What the operator has actually put in place (read from settings/DB at activation time).
export interface ComplianceState {
  baaTemplateOnFile: boolean;
  insuranceOnFile: boolean;
  phiHandlingEnabled: boolean;
  legalAdReviewAck: boolean;
}

export interface ActivationDecision {
  activatable: boolean;
  missing: string[];
}

/**
 * The niche-activation gate. Baseline niches (home services) always activate. A healthcare niche
 * requires the BAA template, insurance, and PHI handling; a legal niche requires an
 * attorney-advertising review acknowledgement. Returns the specific missing requirements so the
 * dashboard can tell the operator exactly what to provide.
 */
export function assertNicheActivatable(profile: NicheProfile, state: ComplianceState): ActivationDecision {
  const missing: string[] = [];
  const c = profile.compliance;
  if (c.regime === "healthcare") {
    if (c.requires_baa && !state.baaTemplateOnFile) missing.push("BAA template on file");
    if (c.phi_handling && !state.phiHandlingEnabled) missing.push("PHI handling enabled");
    if (c.insurance_required.length > 0 && !state.insuranceOnFile)
      missing.push(`insurance on file (${c.insurance_required.join(", ")})`);
  } else if (c.regime === "legal") {
    if (!state.legalAdReviewAck) missing.push("attorney-advertising review acknowledged");
  }
  return { activatable: missing.length === 0, missing };
}
