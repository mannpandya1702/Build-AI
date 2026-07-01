// config.ts — generated from SETUP.md §1 CONFIG. Single source of truth; nothing is hardcoded
// across modules. Business-identity fields left as [NEEDS: ...] read as placeholders on purpose,
// so it is impossible to send an email or deploy a demo with a fake address in it (CLAUDE.md §0).

const NEEDS = (field: string) => `[NEEDS: ${field}]`;

// --- Targeting (required to build) ---
export const NICHE = "roofers";
export const METRO = "Dallas, TX";

// --- Studio identity (required before first send / first deploy, for CAN-SPAM + honest NAP) ---
export const STUDIO_NAME = NEEDS("STUDIO_NAME");
export const STUDIO_ADDRESS = NEEDS("STUDIO_ADDRESS — real physical mailing address, required by CAN-SPAM");
export const STUDIO_US_PHONE = NEEDS("STUDIO_US_PHONE — US number (Google Voice/Twilio) for call CTAs + signatures");
export const FROM_EMAIL = NEEDS("FROM_EMAIL — the address outreach sends from");

// --- Deploy (required before first deploy) ---
export const VERCEL_SCOPE = "mann-pandyas-projects";
// On the free .vercel.app domain, demos land at a flat URL: <slug>-<base>.vercel.app
// (e.g. myriad-roofing-buildai.vercel.app). A custom domain would allow <slug>.<base>.com.
export const DEMO_DOMAIN_BASE = "buildai";

// --- Cost guardrails (safe defaults) ---
export const MAX_CANDIDATES_PER_RUN = 60; // cap Places lookups per run to control spend
export const DEMO_SCORE_THRESHOLD = 60;   // only build demos for leads scoring this or higher (CLAUDE.md §4)

/** True when a value is still an unfilled [NEEDS: ...] placeholder. */
export function isPlaceholder(v: string): boolean {
  return typeof v === "string" && v.startsWith("[NEEDS:");
}

/** Names of the identity/deploy fields still unfilled. Empty array = safe to send/deploy. */
export function missingIdentityFields(): string[] {
  const fields: Record<string, string> = {
    STUDIO_NAME,
    STUDIO_ADDRESS,
    STUDIO_US_PHONE,
    FROM_EMAIL,
    VERCEL_SCOPE,
    DEMO_DOMAIN_BASE,
  };
  return Object.entries(fields)
    .filter(([, v]) => isPlaceholder(v))
    .map(([k]) => k);
}

export const config = {
  NICHE,
  METRO,
  STUDIO_NAME,
  STUDIO_ADDRESS,
  STUDIO_US_PHONE,
  FROM_EMAIL,
  VERCEL_SCOPE,
  DEMO_DOMAIN_BASE,
  MAX_CANDIDATES_PER_RUN,
  DEMO_SCORE_THRESHOLD,
};

export default config;
