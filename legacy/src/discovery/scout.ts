// src/discovery/scout.ts — market scout: measure niche x metro combos BEFORE committing weeks to
// one. For each combo it makes ONE Text Search page (20 businesses, rich fields; ~$0.04) and free
// fetch-probes, then scores the market on what actually matters to this studio:
//
//   gap density     — % with no website, a parked/dead domain, or a non-mobile site (what we sell into)
//   cash-flow       — % with 40+ reviews (CLAUDE.md §1: the review count IS the cash-flow signal)
//   contactability  — % with a phone + % of live sites exposing an email (can we even reach them?)
//   priors          — job value / urgency seasonality per niche (documented below, from field data)
//
// Run: `npm run scout` (first run samples 3 combos and prints a cost estimate; add -- --confirm-cost
// to run the full list). Results cached 24h in data/cache/scout/, report written to data/research/.
// Custom combos: npm run scout -- --combos "hvac@Fort Worth, TX;dentists@Plano, TX" --confirm-cost

import "../env";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { textSearch, type PlaceCandidate } from "./places";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "../..");
const SCOUT_CACHE = resolve(ROOT, "data/cache/scout");
const RESEARCH_DIR = resolve(ROOT, "data/research");

const EST_SCOUT_SEARCH_USD = 0.04; // ESTIMATE ONLY; one enterprise-tier text search per combo
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

// Rich mask: one request carries every scoring field for 20 businesses (vs 20 Details calls).
const SCOUT_FIELD_MASK =
  "places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.websiteUri,places.nationalPhoneNumber,places.businessStatus";

// Niche priors from the studio's field research (CLAUDE.md §1, §9 and the cold-outreach data):
// jobValue: how much one customer is worth (drives what a site is worth to them).
// urgency: emergency-driven niches answer phones and decide fast.
// season(month 1-12): when demand peaks (an HVAC owner in a Texas July feels every missed call).
const NICHE_PRIORS: Record<string, { jobValue: 1 | 2 | 3; urgency: 1 | 2 | 3; peakMonths: number[] }> = {
  roofers: { jobValue: 3, urgency: 3, peakMonths: [3, 4, 5, 6] },
  hvac: { jobValue: 3, urgency: 3, peakMonths: [6, 7, 8, 9] },
  plumbers: { jobValue: 2, urgency: 3, peakMonths: [1, 2, 12] },
  electricians: { jobValue: 2, urgency: 2, peakMonths: [] },
  "med spas": { jobValue: 3, urgency: 1, peakMonths: [4, 5, 11] },
  dentists: { jobValue: 3, urgency: 1, peakMonths: [] },
  chiropractors: { jobValue: 2, urgency: 1, peakMonths: [] },
  landscapers: { jobValue: 2, urgency: 1, peakMonths: [3, 4, 5] },
  "auto repair": { jobValue: 2, urgency: 2, peakMonths: [] },
  "law firms": { jobValue: 3, urgency: 2, peakMonths: [] },
};

const DEFAULT_COMBOS: { niche: string; metro: string }[] = [
  { niche: "hvac", metro: "Dallas, TX" },
  { niche: "plumbers", metro: "Dallas, TX" },
  { niche: "electricians", metro: "Dallas, TX" },
  { niche: "landscapers", metro: "Dallas, TX" },
  { niche: "auto repair", metro: "Dallas, TX" },
  { niche: "roofers", metro: "Fort Worth, TX" },
  { niche: "hvac", metro: "Fort Worth, TX" },
  { niche: "hvac", metro: "Phoenix, AZ" },
  { niche: "roofers", metro: "Tampa, FL" },
  { niche: "plumbers", metro: "San Antonio, TX" },
];

interface SiteVerdict {
  status: "none" | "dead" | "parked" | "not-mobile" | "ok";
  email: string | null;
}

interface ComboReport {
  niche: string;
  metro: string;
  sampled: number;
  avgReviews: number;
  pctCashflow: number; // 40+ reviews
  pctNoSite: number;
  pctDeadOrParked: number;
  pctNotMobile: number;
  pctGap: number; // no site + dead/parked + not mobile
  pctPhone: number;
  pctEmailFindable: number; // among live sites, homepage exposes an email
  opportunity: number; // 0-100
  scoutedAt: string;
}

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

/** Free probe: dead/parked/not-mobile detection + homepage email sniff. */
async function verdictForSite(url: string): Promise<SiteVerdict> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);
  try {
    const res = await fetch(url, {
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Safari/604.1",
      },
    });
    let html = "";
    try {
      html = await res.text();
    } catch {
      /* status alone still informs */
    }
    if (res.status >= 400) return { status: "dead", email: null };
    const parked = html.length < 600 && /window\.location\.href=.{0,4}\/lander|domain.*(for sale|parking)/i.test(html);
    if (parked || (res.status === 200 && html.length < 300)) return { status: "parked", email: null };
    const mobile = /<meta[^>]+name=["']viewport["']/i.test(html);
    const email =
      html
        .match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g)
        ?.filter((e) => !/\.(png|jpg|jpeg|webp|svg|gif)$/i.test(e) && !/sentry|example|wixpress|schema\.org/i.test(e))[0] ?? null;
    return { status: mobile ? "ok" : "not-mobile", email };
  } catch {
    return { status: "dead", email: null };
  } finally {
    clearTimeout(timer);
  }
}

function currentMonth(): number {
  return new Date().getMonth() + 1;
}

/**
 * Opportunity 0-100. Weights (documented so the founder can argue with them):
 *   45% gap density (the product we sell into), 25% cash-flow density (can they pay),
 *   20% contactability (can we reach them), 10% niche priors (job value + in-season urgency).
 */
function scoreCombo(m: Omit<ComboReport, "opportunity" | "scoutedAt">): number {
  const priors = NICHE_PRIORS[m.niche] ?? { jobValue: 2, urgency: 2, peakMonths: [] };
  const inSeason = priors.peakMonths.includes(currentMonth()) ? 1 : 0;
  const priorScore = (priors.jobValue / 3) * 0.5 + (priors.urgency / 3) * 0.3 + inSeason * 0.2;
  const contact = m.pctPhone * 0.6 + m.pctEmailFindable * 0.4;
  const score = m.pctGap * 45 + m.pctCashflow * 25 + contact * 20 + priorScore * 10;
  return Math.round(score);
}

async function scoutCombo(niche: string, metro: string): Promise<ComboReport> {
  mkdirSync(SCOUT_CACHE, { recursive: true });
  const cachePath = resolve(SCOUT_CACHE, `${slugify(niche)}--${slugify(metro)}.json`);
  if (existsSync(cachePath)) {
    const cached = JSON.parse(readFileSync(cachePath, "utf8")) as ComboReport;
    if (Date.now() - new Date(cached.scoutedAt).getTime() < CACHE_TTL_MS) return cached;
  }

  const { candidates } = await textSearch(`${niche} in ${metro}`, 20, undefined, SCOUT_FIELD_MASK);
  const open = candidates.filter((c) => !c.businessStatus || c.businessStatus === "OPERATIONAL");

  const verdicts = await Promise.all(
    open.map(async (c) => (c.websiteUri ? verdictForSite(c.websiteUri) : ({ status: "none", email: null } as SiteVerdict))),
  );

  const n = open.length || 1;
  const withSite = verdicts.filter((v) => v.status !== "none");
  const liveSites = verdicts.filter((v) => v.status === "ok" || v.status === "not-mobile");
  const metrics = {
    niche,
    metro,
    sampled: open.length,
    avgReviews: Math.round(open.reduce((a, c) => a + (c.userRatingCount ?? 0), 0) / n),
    pctCashflow: open.filter((c) => (c.userRatingCount ?? 0) >= 40).length / n,
    pctNoSite: verdicts.filter((v) => v.status === "none").length / n,
    pctDeadOrParked: verdicts.filter((v) => v.status === "dead" || v.status === "parked").length / n,
    pctNotMobile: verdicts.filter((v) => v.status === "not-mobile").length / n,
    pctGap: verdicts.filter((v) => v.status !== "ok").length / n,
    pctPhone: open.filter((c) => c.nationalPhoneNumber).length / n,
    pctEmailFindable: liveSites.length ? liveSites.filter((v) => v.email).length / liveSites.length : 0,
  };
  const report: ComboReport = { ...metrics, opportunity: scoreCombo(metrics), scoutedAt: new Date().toISOString() };
  writeFileSync(cachePath, JSON.stringify(report, null, 2), "utf8");

  // Per-business drill-down from the SAME billed request, so a winner's flagged sites can be
  // hand-verified (probe verdicts lie: WAF/geo-blocks read as "dead") without a second paid search.
  // Side-effect only; does not touch scoring.
  const detailDir = resolve(SCOUT_CACHE, "detail");
  mkdirSync(detailDir, { recursive: true });
  const detail = open.map((c, i) => ({
    name: c.displayName?.text ?? "(unknown)",
    address: c.formattedAddress ?? null,
    reviews: c.userRatingCount ?? 0,
    rating: c.rating ?? null,
    website: c.websiteUri ?? null,
    phone: c.nationalPhoneNumber ?? null,
    verdict: verdicts[i].status,
    email: verdicts[i].email,
  }));
  writeFileSync(resolve(detailDir, `${slugify(niche)}--${slugify(metro)}.json`), JSON.stringify(detail, null, 2), "utf8");
  void withSite; // (superseded by the detail dump above; kept to preserve the metrics shape)
  return report;
}

function parseCombos(): { niche: string; metro: string }[] {
  const i = process.argv.indexOf("--combos");
  if (i === -1) return DEFAULT_COMBOS;
  return process.argv[i + 1]
    .split(";")
    .map((pair) => pair.trim())
    .filter(Boolean)
    .map((pair) => {
      const [niche, metro] = pair.split("@").map((s) => s.trim());
      return { niche, metro };
    });
}

const pct = (x: number) => `${Math.round(x * 100)}%`;

async function main(): Promise<void> {
  const confirmed = process.argv.includes("--confirm-cost") || process.env.CONFIRM_COST === "1";
  const all = parseCombos();
  const combos = confirmed ? all : all.slice(0, 3);

  console.log(`Scouting ${combos.length} niche x metro combos (est. ~$${(combos.length * EST_SCOUT_SEARCH_USD).toFixed(2)}, cached 24h)...`);
  const reports: ComboReport[] = [];
  for (const c of combos) {
    try {
      const r = await scoutCombo(c.niche, c.metro);
      reports.push(r);
      console.log(`  scouted ${c.niche} @ ${c.metro}: gap ${pct(r.pctGap)}, cashflow ${pct(r.pctCashflow)}, opp ${r.opportunity}`);
    } catch (err) {
      console.warn(`  failed ${c.niche} @ ${c.metro}: ${(err as Error).message}`);
    }
  }

  reports.sort((a, b) => b.opportunity - a.opportunity);
  console.log(`\n=== MARKET RANKING (opportunity 0-100) ===`);
  console.log(`  opp | combo                          | gap  | no-site | dead/park | not-mob | 40+rev | phone | email | avg-rev`);
  for (const r of reports) {
    console.log(
      `  ${String(r.opportunity).padStart(3)} | ${(r.niche + " @ " + r.metro).padEnd(30)} | ${pct(r.pctGap).padStart(4)} | ${pct(r.pctNoSite).padStart(7)} | ${pct(r.pctDeadOrParked).padStart(9)} | ${pct(r.pctNotMobile).padStart(7)} | ${pct(r.pctCashflow).padStart(6)} | ${pct(r.pctPhone).padStart(5)} | ${pct(r.pctEmailFindable).padStart(5)} | ${String(r.avgReviews).padStart(7)}`,
    );
  }

  mkdirSync(RESEARCH_DIR, { recursive: true });
  const stamp = new Date().toISOString().slice(0, 10);
  const outPath = resolve(RESEARCH_DIR, `scout-${stamp}.json`);
  writeFileSync(outPath, JSON.stringify(reports, null, 2) + "\n", "utf8");
  console.log(`\nWrote ${outPath}`);

  if (!confirmed && all.length > combos.length) {
    console.log(`\nSampled ${combos.length}/${all.length} combos. Full run: npm run scout -- --confirm-cost`);
  }
  if (reports[0]) {
    const t = reports[0];
    console.log(`\nStrongest market: ${t.niche} @ ${t.metro} (opportunity ${t.opportunity}).`);
    console.log(`Next: point config.ts NICHE/METRO there, or hand this report to the market-scout agent for the qualitative layer.`);
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
