// Dev tools (mock lead, simulated replies/bookings, discovery trigger) are for LOCAL development.
// On a hosted deployment they fabricate data in the production database (exactly what happened when
// "Run mock lead" was clicked on the live dashboard), so they are disabled wherever Vercel runs the
// app unless explicitly re-enabled with ALLOW_DEV_TOOLS=1.
// Fail CLOSED (MASTER_SPEC §9, audit H): dev tools that fabricate data into the DB are OFF
// everywhere unless a developer explicitly opts in with ALLOW_DEV_TOOLS=1 in their local env. The
// previous `!VERCEL` default failed OPEN on any non-Vercel host (Docker/Fly/VPS/exposed localhost).
export function devToolsEnabled(): boolean {
  return process.env.ALLOW_DEV_TOOLS === "1";
}
