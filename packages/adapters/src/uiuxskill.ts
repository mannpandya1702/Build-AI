// ui-ux-pro-max skill adapter (CLAUDE.md §9 design toolchain). The uiux agent consults the local
// skill (a Python BM25 search over 161 palettes, 74 type pairings, 85 styles, 99 UX guidelines, 162
// product types) to GROUND its design guidance instead of guessing. The skill INFORMS; the anti-slop
// contract (§5b-bis) and the curated looks registry still GOVERN what ships. The skill is a local,
// network-free CLI, so it works in the autonomous worker exactly as it does interactively (unlike the
// 21st.dev MCP, which only surfaces its tools in an interactive Claude Code session). Advisory only:
// a skill miss never blocks a build.
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";

const exec = promisify(execFile);
const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const SEARCH = resolve(REPO_ROOT, ".claude/skills/ui-ux-pro-max/scripts/search.py");

export type SkillDomain = "color" | "style" | "typography" | "ux" | "product" | "landing" | "chart";

/** Query the skill for one design domain; returns its markdown result text, or "" on any failure. */
export async function designSkill(query: string, domain: SkillDomain, maxResults = 2): Promise<string> {
  if (!existsSync(SEARCH)) return "";
  try {
    const { stdout } = await exec(
      "python3",
      [SEARCH, query, "--domain", domain, "--max-results", String(maxResults)],
      { timeout: 15000, maxBuffer: 1024 * 1024 },
    );
    return stdout.trim();
  } catch {
    return ""; // advisory; never block a build on the skill
  }
}

export interface DesignGuidance {
  product: string;
  landing: string;
  ux: string;
}

/** Gather the design guidance a demo build should be grounded in for a given niche + city. */
export async function designGuidance(niche: string, city: string | null): Promise<DesignGuidance> {
  const where = city ? ` ${city}` : "";
  const [product, landing, ux] = await Promise.all([
    designSkill(`${niche} local service business lead generation${where}`, "product", 1),
    designSkill(`${niche} conversion trust local service`, "landing", 1),
    designSkill(`${niche} emergency tap to call mobile trust`, "ux", 3),
  ]);
  return { product, landing, ux };
}
