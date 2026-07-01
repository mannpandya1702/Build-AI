// src/discovery/find.ts — Module 1 entrypoint: find + score + write leads.
// Run: `npm run find` (add --confirm-cost to scale past the first-run sample).
//
// First-run cost check (SETUP.md §7): if the details cache is empty and --confirm-cost is not
// passed, this samples a single page (20 results), scores them, prints a cost estimate + the
// qualified count, and STOPS. Re-run with --confirm-cost to scale to MAX_CANDIDATES_PER_RUN.

import "../env";
import { existsSync, readdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { NICHE, METRO, MAX_CANDIDATES_PER_RUN, DEMO_SCORE_THRESHOLD } from "../../config";
import { textSearch, placeDetails, probeSite, type PlaceCandidate } from "./places";
import { scoreLead } from "./score";
import { upsertLead, type Lead } from "../crm/leads";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CACHE_DIR = resolve(__dirname, "../../data/cache");

// ---- Cost estimate constants (ESTIMATES ONLY) ----
// Confirm current Places API (New) pricing in the Google Cloud console and set a HARD billing cap.
// These only drive the printed pre-run estimate; they never gate real spend by themselves.
const EST_TEXTSEARCH_USD = 0.032;
const EST_DETAILS_USD = 0.02;

// Neighborhood/suburb variants widen coverage per metro (SETUP.md §7). Extend as needed.
const SUBURBS: Record<string, string[]> = {
  "dallas, tx": [
    "Plano, TX",
    "Irving, TX",
    "Garland, TX",
    "Arlington, TX",
    "Frisco, TX",
    "McKinney, TX",
    "Mesquite, TX",
    "Richardson, TX",
  ],
};

function metroVariants(metro: string): string[] {
  const key = metro.trim().toLowerCase();
  return [metro, ...(SUBURBS[key] ?? [])];
}

function isFirstRun(): boolean {
  if (!existsSync(CACHE_DIR)) return true;
  return readdirSync(CACHE_DIR).filter((f) => f.endsWith(".json")).length === 0;
}

function stateFromAddress(addr?: string): string {
  const m = (addr ?? "").match(/,\s*([A-Z]{2})\s*\d{5}/);
  return m ? m[1] : "";
}

function cityFromAddress(addr?: string): string {
  if (!addr) return "";
  // Drop empties and a trailing country component, then anchor on the "STATE ZIP" part: the city is
  // the token right before it. Handles both "123 Main St, Plano, TX 75023, USA" and the country-less
  // "123 Main St, Plano, TX 75023" (a very common Places shape for US businesses).
  const parts = addr
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .filter((p) => !/^(USA|United States)$/i.test(p));
  const stateIdx = parts.findIndex((p) => /^[A-Z]{2}\s*\d{5}(-\d{4})?$/.test(p));
  if (stateIdx > 0) return parts[stateIdx - 1];
  if (parts.length >= 2) return parts[parts.length - 2];
  return parts[0] ?? "";
}

function siteQualityScore(probe: Awaited<ReturnType<typeof probeSite>> | null): number | null {
  if (!probe) return null;
  if (!probe.reachable) return 0;
  if (!probe.mobileResponsive) return 30;
  return probe.loadMs != null && probe.loadMs < 2500 ? 90 : 60;
}

async function collectCandidates(cap: number): Promise<PlaceCandidate[]> {
  const found = new Map<string, PlaceCandidate>();
  for (const metro of metroVariants(METRO)) {
    const query = `${NICHE} in ${metro}`;
    let pageToken: string | undefined;
    do {
      const { candidates, nextPageToken } = await textSearch(query, 20, pageToken);
      for (const c of candidates) if (!found.has(c.id)) found.set(c.id, c);
      pageToken = nextPageToken;
      if (found.size >= cap) break;
    } while (pageToken);
    if (found.size >= cap) break;
  }
  return [...found.values()].slice(0, cap);
}

async function processCandidate(c: PlaceCandidate, fetchReviews: boolean): Promise<Lead> {
  const d = await placeDetails(c.id, false);
  const probe = d.websiteUri ? await probeSite(d.websiteUri).catch(() => null) : null;
  const result = scoreLead(d, probe);
  const qualified = !result.disqualified && result.score >= DEMO_SCORE_THRESHOLD;

  // Only pull the higher-billed reviews for leads we will actually build for.
  if (qualified && fetchReviews) await placeDetails(c.id, true);

  const photoCount = d.photos?.length ?? 0;
  const notes = [
    `score ${result.score} (${Object.entries(result.breakdown).map(([k, v]) => `${k}:${v}`).join(", ")})`,
    result.disqualified ? `DISQUALIFIED: ${result.disqualifyReasons.join("; ")}` : "",
    probe ? `site: ${probe.notes}` : "no current website",
    photoCount === 0 ? "[NEEDS: photos] no GBP photos found" : `${photoCount} GBP photos available`,
  ]
    .filter(Boolean)
    .join(" | ");

  return upsertLead({
    place_id: d.id,
    business_name: d.displayName?.text ?? c.displayName?.text ?? "",
    niche: NICHE,
    city: cityFromAddress(d.formattedAddress),
    state: stateFromAddress(d.formattedAddress),
    phone: d.nationalPhoneNumber ?? null,
    gbp_url: d.googleMapsUri ?? null,
    review_count: d.userRatingCount ?? null,
    rating: d.rating ?? null,
    has_website: Boolean(d.websiteUri),
    current_site_url: d.websiteUri ?? null,
    site_quality_score: siteQualityScore(probe),
    score: result.score,
    stage: qualified ? "qualified" : "found",
    notes,
  });
}

async function main(): Promise<void> {
  const confirmed = process.argv.includes("--confirm-cost") || process.env.CONFIRM_COST === "1";
  const firstRun = isFirstRun();
  const cap = firstRun && !confirmed ? 20 : MAX_CANDIDATES_PER_RUN;

  console.log(`Searching "${NICHE}" in ${METRO} (${metroVariants(METRO).length} area variants), cap ${cap}.`);
  const candidates = await collectCandidates(cap);
  console.log(`Found ${candidates.length} unique candidates. Fetching details + scoring...`);

  const processed: Lead[] = [];
  for (const c of candidates) {
    try {
      processed.push(await processCandidate(c, !firstRun || confirmed));
    } catch (err) {
      console.warn(`  skipped ${c.displayName?.text ?? c.id}: ${(err as Error).message}`);
    }
  }

  const qualified = processed
    .filter((l) => l.stage === "qualified")
    .sort((a, b) => b.score - a.score);

  console.log(`\nProcessed ${processed.length}. ${qualified.length} qualified (>= ${DEMO_SCORE_THRESHOLD}).`);
  for (const l of qualified.slice(0, 15)) {
    const site = l.has_website ? l.current_site_url : "NO SITE";
    console.log(`  ${String(l.score).padStart(3)}  ${l.business_name}  (${l.review_count ?? 0} reviews, ${l.rating ?? "?"}star)  ${site}  [${l.place_id}]`);
  }

  if (qualified[0]) {
    console.log(`\nStrongest lead: ${qualified[0].business_name}. Build it first:`);
    console.log(`  npm run build-demo ${qualified[0].place_id}`);
  }

  if (firstRun && !confirmed) {
    const estText = metroVariants(METRO).length * EST_TEXTSEARCH_USD;
    const estFull = MAX_CANDIDATES_PER_RUN * EST_DETAILS_USD;
    console.log(`\n=== COST CHECK (first run, sampled ${candidates.length}) ===`);
    console.log(`Estimated full run (up to ${MAX_CANDIDATES_PER_RUN} details): ~$${(estText + estFull).toFixed(2)} (ESTIMATE ONLY, verify current pricing).`);
    console.log(`Set a HARD billing cap in Google Cloud Console first.`);
    console.log(`Then re-run to scale:  npm run find -- --confirm-cost`);
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
