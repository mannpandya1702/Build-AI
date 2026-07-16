#!/usr/bin/env node
// Set the worker on/off switch in BOTH databases at once: local Postgres (the worker's brain)
// and hosted Neon (what the dashboard start/stop button writes). Writing only one side loses:
// the bridge syncs settings last-write-wins by updated_at, and the dashboard writes hosted
// directly, so a local-only toggle can be overwritten on the next sync cycle (observed live
// 2026-07-13). Raw TCP :5432 to Neon is blocked in the worker container (RUNBOOK §2b), so the
// hosted write rides the Neon serverless HTTPS driver, same as the bridge.
//
// Usage: node scripts/set-worker-enabled.cjs true|false
//   env: DATABASE_URL (defaults to local dev), DATABASE_URL_NEON (hosted; skipped if unset)
const path = require("node:path");
const { createRequire } = require("node:module");
// Resolve drivers from @autopilot/core's dependency tree regardless of where this script lives.
const coreRequire = createRequire(path.join(__dirname, "..", "packages", "core", "package.json"));

const value = process.argv[2];
if (value !== "true" && value !== "false") {
  console.error("usage: set-worker-enabled.cjs true|false");
  process.exit(2);
}
const SQL = "update settings set value=$1::jsonb, updated_at=now() where key='worker_enabled'";
const localUrl =
  process.env.DATABASE_URL ?? "postgres://autopilot:autopilot_local_dev@localhost:5432/agency_autopilot";
const neonUrl = process.env.DATABASE_URL_NEON;

(async () => {
  let failed = false;
  try {
    const pg = coreRequire("pg");
    const local = new pg.Pool({ connectionString: localUrl, max: 1 });
    await local.query(SQL, [value]);
    await local.end();
    console.log(`local worker_enabled=${value}`);
  } catch (e) {
    failed = true;
    console.error("local update failed:", e.message);
  }
  if (neonUrl) {
    try {
      const neon = coreRequire("@neondatabase/serverless");
      neon.neonConfig.poolQueryViaFetch = true;
      const hosted = new neon.Pool({ connectionString: neonUrl, max: 1 });
      await hosted.query(SQL, [value]);
      await hosted.end();
      console.log(`hosted worker_enabled=${value}`);
    } catch (e) {
      failed = true;
      console.error("hosted update failed:", e.message);
    }
  } else {
    console.log("DATABASE_URL_NEON unset; hosted skipped");
  }
  process.exit(failed ? 1 : 0);
})();
