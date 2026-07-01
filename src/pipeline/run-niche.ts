// src/pipeline/run-niche.ts — the full loop: find -> build-demo for every qualified lead -> draft.
// Run: `npm run run-niche` (pass --confirm-cost / --confirm-deploy through to scale + go live).
//
// This chains the module entrypoints as child processes so each keeps its own guards (the first-run
// cost check and the first-deploy confirmation both still apply).

import "../env";
import { spawn } from "node:child_process";
import { DEMO_SCORE_THRESHOLD } from "../../config";
import { readLeads } from "../crm/leads";

function run(script: string, args: string[]): Promise<number> {
  return new Promise((resolvePromise) => {
    const child = spawn("tsx", [script, ...args], { stdio: "inherit" });
    child.on("close", (code) => resolvePromise(code ?? 1));
  });
}

async function main(): Promise<void> {
  const passthrough = process.argv.slice(2).filter((a) => a.startsWith("--confirm"));

  console.log("== FIND ==");
  await run("src/discovery/find.ts", passthrough.filter((a) => a === "--confirm-cost"));

  const qualified = readLeads()
    .filter((l) => l.stage === "qualified" && l.score >= DEMO_SCORE_THRESHOLD)
    .sort((a, b) => b.score - a.score);

  console.log(`\n== BUILD DEMOS (${qualified.length} qualified) ==`);
  for (const lead of qualified) {
    console.log(`\n-- ${lead.business_name} (${lead.score}) --`);
    await run("src/demo/generate.ts", [lead.place_id, ...passthrough.filter((a) => a === "--confirm-deploy")]);
  }

  console.log(`\n== DRAFT OUTREACH ==`);
  for (const lead of qualified) {
    await run("src/outreach/draft.ts", [lead.place_id]);
  }

  const built = readLeads().filter((l) => l.stage === "demo_built");
  console.log(`\n== DONE == ${qualified.length} qualified, ${built.length} demos built.`);
  if (built[0]) console.log(`Strongest: ${built.sort((a, b) => b.score - a.score)[0].business_name}`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
