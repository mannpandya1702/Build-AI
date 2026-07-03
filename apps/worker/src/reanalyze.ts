// One-off Phase 3 verification helper: run the real analyzer (+ solution) directly on named
// leads, bypassing the scheduler queue order. Used to confirm the vision + retry + fallback fix
// re-audits leads whose PageSpeed previously failed. The agents' idempotency guards make this
// safe to run alongside the worker.
import { getPool, closePool } from "@autopilot/core";
import { realAnalyzer, realSolution } from "@autopilot/agents";

const names = process.argv.slice(2);
if (names.length === 0) {
  console.error("usage: tsx src/reanalyze.ts '<company name>' ['<company name>' ...]");
  process.exit(1);
}

const pool = getPool();
for (const name of names) {
  const r = await pool.query<{ id: string; status: string }>(
    "select id, status from leads where company_name = $1 limit 1",
    [name],
  );
  if (r.rowCount === 0) {
    console.log(`SKIP  ${name}: not found`);
    continue;
  }
  const { id, status } = r.rows[0];
  console.log(`\n=== ${name} (${status}) ===`);
  try {
    if (status === "qualified") await realAnalyzer(id);
    const after = (await pool.query<{ status: string }>("select status from leads where id=$1", [id])).rows[0].status;
    if (after === "analyzed") await realSolution(id);
    const audit = (await pool.query("select lighthouse, jsonb_array_length(coalesce(findings,'[]')) n, summary, jsonb_array_length(coalesce(screenshots,'[]')) shots from audits where lead_id=$1 order by created_at desc limit 1", [id])).rows[0];
    console.log(`  audit: ${audit?.n ?? 0} findings | ${audit?.shots ?? 0} screenshots | lighthouse=${audit?.lighthouse ? "yes" : "none"}`);
    console.log(`  summary: ${audit?.summary ?? "(none)"}`);
    const finalStatus = (await pool.query<{ status: string }>("select status from leads where id=$1", [id])).rows[0].status;
    console.log(`  -> now ${finalStatus}`);
  } catch (e) {
    console.log(`  ERROR: ${(e as Error).message}`);
  }
}
await closePool();
