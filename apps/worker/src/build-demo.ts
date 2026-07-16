// The Phase 4 "one command" (spec §13): take a solution_ready lead all the way to a live,
// watermarked, noindexed demo that passes the QA bar, driving uiux -> builder -> qa and following
// the QA fix loop exactly as the worker's scheduler would. Runs the REAL agents; adapters are mock
// when MOCK_MODE=true (local deploy, no spend), real when MOCK_MODE=false (Vercel deploy).
//
//   MOCK_MODE=true  pnpm exec tsx src/build-demo.ts "James Kate Roofing & Restoration"
//   MOCK_MODE=false pnpm exec tsx src/build-demo.ts <leadId>
//   ... add --break to intentionally corrupt build #1 and prove QA catches + the loop fixes it.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { realBuilder, realQa, realUiux } from "@autopilot/agents";
import { closePool, getPool } from "@autopilot/core";

const args = process.argv.slice(2);
const doBreak = args.includes("--break");
const ident = args
  .filter((a) => a !== "--break")
  .join(" ")
  .trim();
if (!ident) {
  console.error('usage: tsx src/build-demo.ts "<company name or leadId>" [--break]');
  process.exit(1);
}

const pool = getPool();
const isUuid = /^[0-9a-f-]{36}$/i.test(ident);
const found = await pool.query<{ id: string; company_name: string; status: string }>(
  isUuid
    ? "select id, company_name, status from leads where id=$1"
    : "select id, company_name, status from leads where company_name=$1 limit 1",
  [ident],
);
if (found.rowCount === 0) {
  console.error(`lead not found: ${ident}`);
  process.exit(1);
}
const { id: leadId, company_name } = found.rows[0];
const status = async () =>
  (await pool.query<{ status: string }>("select status from leads where id=$1", [leadId])).rows[0].status;

/** Corrupt the current build so QA has something to catch (proves the fix loop). */
async function injectBreak(): Promise<void> {
  const b = (
    await pool.query<{ repo_path: string }>(
      "select repo_path from builds where lead_id=$1 order by created_at desc limit 1",
      [leadId],
    )
  ).rows[0];
  const p = resolve(b.repo_path, "content.json");
  if (!existsSync(p)) return;
  const c = JSON.parse(readFileSync(p, "utf8"));
  c.services = [
    { name: "Lorem ipsum service", blurb: "[NEEDS: real service copy] placeholder text" },
    ...(c.services ?? []),
  ];
  writeFileSync(p, JSON.stringify(c, null, 2));
  console.log("  (injected a placeholder into build #1's content.json)");
}

console.log(`\n=== build-demo: ${company_name} (${await status()}) ${doBreak ? "[--break]" : ""} ===`);
let broke = false;
for (let step = 0; step < 8; step++) {
  const s = await status();
  if (s === "outreach_ready") {
    console.log(`\nDONE. ${company_name} is outreach_ready (demo passed QA).`);
    break;
  }
  if (s === "delivered" || s === "delivery_approval") {
    console.log(`\nDONE. final at ${s}.`);
    break;
  }

  if (s === "solution_ready") {
    console.log("uiux ...");
    await realUiux(leadId);
  } else if (s === "design_ready" || s === "demo_building" || s === "final_building") {
    console.log(`builder (${s}) ...`);
    await realBuilder(leadId);
    if (doBreak && !broke) {
      broke = true;
      await injectBreak();
    }
  } else if (s === "demo_qa" || s === "final_qa") {
    console.log("qa ...");
    await realQa(leadId);
  } else {
    console.log(`  stopped at ${s} (held or terminal).`);
    break;
  }
}

// Report artifacts
const design = (
  await pool.query(
    "select brand->>'preset' preset, look_id from designs where lead_id=$1 order by created_at desc limit 1",
    [leadId],
  )
).rows[0];
const look = design?.look_id
  ? (await pool.query<{ name: string }>("select name from looks where id=$1", [design.look_id])).rows[0]?.name
  : null;
const builds = (
  await pool.query(
    "select kind, status, iteration, deploy_url from builds where lead_id=$1 order by created_at asc",
    [leadId],
  )
).rows;
const qaRows = (
  await pool.query(
    "select r.passed, r.iteration, jsonb_array_length(coalesce(r.issues,'[]')) nissues from qa_reports r join builds b on b.id=r.build_id where b.lead_id=$1 order by r.created_at asc",
    [leadId],
  )
).rows;
console.log(`\nfinal status: ${await status()}`);
console.log(`design: preset=${design?.preset} look=${look}`);
console.log("builds:");
console.table(builds);
console.log("qa reports:");
console.table(qaRows);
await closePool();
