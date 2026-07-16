import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { GoldenSetSchema, runGoldenSet } from "../src/index.js";
import { scorerFor } from "../src/scorers.js";

const here = dirname(fileURLToPath(import.meta.url));

describe("eval harness", () => {
  it("loads and scores the qualify_v1 golden set at 100%", async () => {
    const set = GoldenSetSchema.parse(
      JSON.parse(readFileSync(join(here, "..", "goldens", "qualify_v1.json"), "utf8")),
    );
    const r = await runGoldenSet(set, scorerFor(set.name));
    expect(r.total).toBe(3);
    expect(r.score).toBe(100);
  });

  it("an unknown set gets a no-op scorer (all pass)", async () => {
    const r = await runGoldenSet(
      {
        name: "unknown",
        version: "0",
        provenance: "placeholder",
        regressionThreshold: 2,
        cases: [{ id: "x", input: {}, expected: {} }],
      },
      scorerFor("unknown"),
    );
    expect(r.score).toBe(100);
  });
});
