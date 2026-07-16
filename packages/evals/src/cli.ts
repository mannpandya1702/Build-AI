// CI entrypoint (`pnpm --filter @autopilot/evals eval:ci`). Loads every golden set, runs its scorer,
// and exits non-zero if any set scores below (100 - regressionThreshold) while it is a `frozen` set.
// Placeholder sets only warn — they exist so the harness is wired end-to-end before real data lands.
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { type GoldenSet, GoldenSetSchema, type Scorer, runGoldenSet } from "./index.js";
import { scorerFor } from "./scorers.js";

const here = dirname(fileURLToPath(import.meta.url));
const goldensDir = join(here, "..", "goldens");

function loadSets(): GoldenSet[] {
  return readdirSync(goldensDir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => GoldenSetSchema.parse(JSON.parse(readFileSync(join(goldensDir, f), "utf8"))));
}

async function main(): Promise<void> {
  const sets = loadSets();
  if (sets.length === 0) {
    console.log("[evals] no golden sets found");
    return;
  }
  let failed = false;
  for (const set of sets) {
    const scorer: Scorer = scorerFor(set.name);
    const r = await runGoldenSet(set, scorer);
    const floor = 100 - set.regressionThreshold;
    const ok = r.score >= floor;
    const tag = set.provenance === "placeholder" ? "PLACEHOLDER" : ok ? "PASS" : "FAIL";
    console.log(
      `[evals] ${r.set}@${r.version} (${set.provenance}): ${r.passed}/${r.total} = ${r.score}% ` +
        `(floor ${floor}%) -> ${tag}`,
    );
    // Only a `frozen` set can fail CI. Placeholder sets warn until real data is provided.
    if (!ok && set.provenance === "frozen") failed = true;
  }
  if (failed) {
    console.error("[evals] a frozen golden set regressed beyond its threshold");
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("[evals]", (err as Error).message);
  process.exit(1);
});
