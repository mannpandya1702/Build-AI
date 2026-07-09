// Dev tools (mock lead, simulated replies/bookings, discovery trigger) are for LOCAL development.
// On a hosted deployment they fabricate data in the production database (exactly what happened when
// "Run mock lead" was clicked on the live dashboard), so they are disabled wherever Vercel runs the
// app unless explicitly re-enabled with ALLOW_DEV_TOOLS=1.
export function devToolsEnabled(): boolean {
  return !process.env.VERCEL || process.env.ALLOW_DEV_TOOLS === "1";
}
