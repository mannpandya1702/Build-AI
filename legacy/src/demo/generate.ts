// src/demo/generate.ts — Module 3 entrypoint: build ONE demo for a place_id, then QA, then deploy.
// Run: `npm run build-demo <place_id>`
//
// Builds strictly to CLAUDE.md §5: fills the reusable templates/<niche> site with the lead's REAL
// Places data. Every fact comes from Places; anything missing becomes a [NEEDS: ...] marker, never
// invented (CLAUDE.md §0). The generated site is written to demos/<slug>/, then handed to qa.ts and
// deploy.ts.

import "../env";
import { cpSync, existsSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { NICHE } from "../../config";
import { getLead, upsertLead, advanceStage, readLeads } from "../crm/leads";
import { placeDetails, fetchPhotoBytes } from "../discovery/places";
import { runQa } from "./qa";
import { deployDemo } from "./deploy";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "../..");
const TEMPLATE_DIR = resolve(ROOT, "templates", NICHE);
const DEMOS_DIR = resolve(ROOT, "demos");

const MAX_PHOTOS = 6;

// Near-universal roofing categories (things essentially every roofer does), used only as a starting
// menu. These are the KIND of work, not specific claims about this business, and the exact menu still
// needs owner confirmation, which is surfaced to the operator via a [NEEDS] flag before any send.
// Blurbs describe the work type generically; they never assert business-specific facts.
const DEFAULT_ROOFER_SERVICES: { name: string; blurb: string }[] = [
  { name: "Roof Repair", blurb: "Leaks, missing shingles, flashing. Fixed before small problems become big ones." },
  { name: "Roof Replacement", blurb: "A full tear-off and a new roof, done once and done right." },
  { name: "Storm & Hail Damage", blurb: "Damage checked and documented properly after the weather hits." },
  { name: "Roof Inspections", blurb: "A straight answer on what your roof needs, with photos to prove it." },
];

export interface DemoReview {
  author: string;
  rating: number;
  text: string;
}

export interface DemoTheme {
  id: string;
  // RGB channel triplets ("r g b") so Tailwind alpha modifiers work (see globals.css).
  palette: { brand: string; brandInk: string; ink: string; paper: string; paper2: string };
  fontPair: "bricolage" | "archivo" | "grotesk";
  heroVariant: "photo" | "split" | "bold" | "frame" | "paper";
  heroSubline?: string | null;
  niche?: string;
}

// Four curated looks (CLAUDE.md §5d: per-lead differentiation, same bones different skin).
// Every palette keeps the anti-slop rules: warm/cool off-whites, deep inks, one sharp CTA accent.
// A look is assigned once per lead and stored in the CRM, so rebuilds never reshuffle it, and no
// two active demos share a look while free looks remain (two leads in the same building must
// never receive the same-looking site).
export const LOOKS: DemoTheme[] = [
  {
    id: "brick-classic",
    palette: { brand: "180 56 13", brandInk: "255 255 255", ink: "16 24 31", paper: "250 247 242", paper2: "241 235 226" },
    fontPair: "bricolage",
    heroVariant: "photo",
  },
  {
    id: "steel-modern",
    palette: { brand: "29 78 216", brandInk: "255 255 255", ink: "15 23 42", paper: "247 250 252", paper2: "233 239 246" },
    fontPair: "archivo",
    heroVariant: "split",
  },
  {
    id: "moss-craft",
    palette: { brand: "21 128 61", brandInk: "255 255 255", ink: "18 26 20", paper: "249 248 242", paper2: "237 236 225" },
    fontPair: "grotesk",
    heroVariant: "bold",
  },
  {
    id: "ember-storm",
    palette: { brand: "202 96 6", brandInk: "255 255 255", ink: "26 20 14", paper: "251 248 243", paper2: "243 236 226" },
    fontPair: "archivo",
    heroVariant: "photo",
  },
];

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

/** Assign a look: keep the stored one; else pick by hash and probe past looks other demos use. */
function assignLook(placeId: string): DemoTheme {
  const lead = getLead(placeId);
  if (lead?.demo_theme) {
    const kept = LOOKS.find((l) => l.id === lead.demo_theme);
    if (kept) return kept;
  }
  const used = new Set(
    readLeads()
      .filter((l) => l.place_id !== placeId && l.demo_url && l.demo_theme)
      .map((l) => l.demo_theme as string),
  );
  let idx = hashString(placeId) % LOOKS.length;
  for (let step = 0; step < LOOKS.length; step++) {
    const candidate = LOOKS[(idx + step) % LOOKS.length];
    if (!used.has(candidate.id)) {
      idx = (idx + step) % LOOKS.length;
      break;
    }
  }
  const chosen = LOOKS[idx];
  upsertLead({ place_id: placeId, demo_theme: chosen.id });
  return chosen;
}

export interface DemoContent {
  placeId: string;
  businessName: string;
  city: string;
  state: string;
  phone: string | null;
  primaryService: string;
  services: { name: string; blurb: string }[];
  reviews: DemoReview[];
  photos: { src: string; alt: string }[];
  heroPhoto: string | null;
  address: string;
  mapQuery: string;
  rating: number | null;
  reviewCount: number | null;
  brandColor: string;
  theme: DemoTheme;
  stormBand: boolean; // niche-need band (CLAUDE.md §5a): storm/insurance moment for roofers
  faq: { q: string; a: string }[]; // fact-safe only: built from known data
  needs: string[]; // surfaced [NEEDS: ...] items for this demo
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "demo";
}

async function savePhotos(placeId: string, photoNames: string[], destDir: string): Promise<{ photos: { src: string; alt: string }[]; needs: string[] }> {
  const needs: string[] = [];
  const photos: { src: string; alt: string }[] = [];
  if (photoNames.length === 0) {
    needs.push("[NEEDS: photos] no GBP photos found; demo uses tasteful placeholders");
    return { photos, needs };
  }
  let sharp: typeof import("sharp") | null = null;
  try {
    sharp = (await import("sharp")).default as unknown as typeof import("sharp");
  } catch {
    sharp = null;
  }
  const photosDir = resolve(destDir, "public/photos");
  mkdirSync(photosDir, { recursive: true });
  for (let i = 0; i < Math.min(photoNames.length, MAX_PHOTOS); i++) {
    try {
      const bytes = await fetchPhotoBytes(photoNames[i], 1280);
      const buf = Buffer.from(bytes);
      const outName = `photo-${i + 1}.webp`;
      const outPath = resolve(photosDir, outName);
      if (sharp) {
        await sharp(buf).resize({ width: 1280, withoutEnlargement: true }).webp({ quality: 78 }).toFile(outPath);
      } else {
        writeFileSync(outPath.replace(/\.webp$/, ".jpg"), buf);
      }
      photos.push({ src: `/photos/${outName}`, alt: "Real photo of the team's work" });
    } catch (err) {
      needs.push(`[NEEDS: photo] failed to fetch a GBP photo (${(err as Error).message})`);
    }
  }
  if (photos.length === 0) needs.push("[NEEDS: photos] could not download any GBP photo");
  return { photos, needs };
}

async function buildContent(placeId: string): Promise<{ content: DemoContent; slug: string }> {
  const lead = getLead(placeId);
  if (!lead) throw new Error(`No lead for place_id ${placeId}. Run \`npm run find\` first.`);
  if (lead.stage === "found") {
    console.warn(`Warning: ${lead.business_name} is not 'qualified' (score ${lead.score}). Building anyway because you asked for this place_id.`);
  }

  const details = await placeDetails(placeId, true); // cache-first; pulls reviews
  const slug = slugify(lead.business_name || details.displayName?.text || placeId);
  const destDir = resolve(DEMOS_DIR, slug);

  if (!existsSync(TEMPLATE_DIR)) throw new Error(`Template not found at ${TEMPLATE_DIR}`);
  if (existsSync(destDir)) rmSync(destDir, { recursive: true, force: true });
  cpSync(TEMPLATE_DIR, destDir, {
    recursive: true,
    filter: (src) => !/node_modules|\.next|[/\\]out([/\\]|$)/.test(src),
  });

  const needs: string[] = [];

  // The demo shows the business at its best: REAL reviews only, curated to positive (4+ stars).
  // Google's "most relevant" set can include 1-star complaints, and a sales demo must never
  // showcase the owner's own complaints back at them. Curation is not fabrication: every review
  // shown is real and attributed. Shorter reviews read better on cards, so prefer them; hard-trim
  // extreme lengths at a word boundary (the card also line-clamps visually).
  const reviews: DemoReview[] = (details.reviews ?? [])
    .map((r) => ({
      author: r.authorAttribution?.displayName ?? "Google reviewer",
      rating: r.rating ?? 5,
      text: (r.text?.text ?? "").trim(),
    }))
    .filter((r) => r.text.length > 0 && r.rating >= 4)
    .sort((a, b) => b.rating - a.rating || a.text.length - b.text.length)
    .slice(0, 4)
    .map((r) =>
      r.text.length > 420
        ? { ...r, text: r.text.slice(0, 400).replace(/\s+\S*$/, "").trimEnd() + "..." }
        : r,
    );
  if (reviews.length === 0) needs.push("[NEEDS: reviews] no positive review text available from GBP");

  const photoNames = (details.photos ?? []).map((p) => p.name);
  const { photos, needs: photoNeeds } = await savePhotos(placeId, photoNames, destDir).catch((err) => {
    return { photos: [], needs: [`[NEEDS: photos] ${(err as Error).message}`] };
  });
  needs.push(...photoNeeds);

  if (!lead.phone) needs.push("[NEEDS: phone] no phone number on the GBP; tap-to-call cannot be wired");
  needs.push("[NEEDS: confirm services & pricing] service menu is a standard roofer default, confirm with owner");
  needs.push("[NEEDS: license/insurance/years] add real trust facts once confirmed");
  needs.push("[NEEDS: confirm storm/insurance work] storm band assumes they handle storm damage jobs; confirm with owner before send");

  const city = lead.city || "your area";

  // FAQ, fact-safe: answers use only data we actually have (city, phone, form). No invented
  // pricing, timelines, warranties, or credentials (CLAUDE.md §5b).
  const faq: { q: string; a: string }[] = [
    { q: "What areas do you cover?", a: `${city} and the surrounding area.` },
    {
      q: "How do I get a quote?",
      a: lead.phone
        ? `Call ${lead.phone} or use the form above. It takes under a minute.`
        : "Use the form above. It takes under a minute.",
    },
    { q: "What should I do after a storm?", a: "Get the roof inspected and the damage photographed before you file anything. Then you know exactly what you're dealing with." },
  ];

  const theme = assignLook(placeId);

  const content: DemoContent = {
    placeId,
    businessName: lead.business_name,
    city,
    state: lead.state,
    phone: lead.phone,
    primaryService: "Roof Repair",
    services: DEFAULT_ROOFER_SERVICES,
    reviews,
    photos,
    heroPhoto: photos[0]?.src ?? null,
    address: details.formattedAddress ?? "",
    mapQuery: [lead.business_name, details.formattedAddress].filter(Boolean).join(", "),
    rating: lead.rating,
    reviewCount: lead.review_count,
    brandColor: "#b4380d",
    theme,
    stormBand: true, // roofers in a hail market: the #1 customer moment (flagged [NEEDS] above)
    faq,
    needs,
  };

  writeFileSync(resolve(destDir, "content.json"), JSON.stringify(content, null, 2) + "\n", "utf8");
  return { content, slug };
}

async function main(): Promise<void> {
  const placeId = process.argv[2];
  if (!placeId) {
    console.error("Usage: npm run build-demo <place_id>");
    process.exit(1);
  }

  console.log(`Building demo for ${placeId}...`);
  const { content, slug } = await buildContent(placeId);
  const destDir = resolve(DEMOS_DIR, slug);
  console.log(`Generated demos/${slug}/ from ${content.businessName}'s real Places data.`);
  if (content.needs.length) {
    console.log(`  ${content.needs.length} [NEEDS] flags (not invented, left as placeholders):`);
    for (const n of content.needs) console.log(`   - ${n}`);
  }

  // QA gate (CLAUDE.md §5e). A demo that fails QA does not deploy.
  const qa = await runQa(destDir);
  console.log(`\nQA: ${qa.passed ? "PASS" : "FAIL"}`);
  for (const c of qa.checks) console.log(`  [${c.ok ? "ok" : "XX"}] ${c.name}: ${c.detail}`);
  if (!qa.passed) {
    console.error("\nQA failed. Fix the above before deploying. Not deploying.");
    process.exit(1);
  }

  // Deploy gate (SETUP.md §9): refuses on the first deploy or if identity/deploy config is unset.
  const deploy = await deployDemo(destDir, slug, content.placeId);
  if (deploy.deployed && deploy.url) {
    upsertLead({ place_id: content.placeId, demo_url: deploy.url, demo_screenshot: deploy.screenshot ?? null });
    advanceStage(content.placeId, "demo_built"); // never regresses a contacted/replied lead
    console.log(`\nLive: ${deploy.url}`);
  } else {
    console.log(`\nNot deployed: ${deploy.reason}`);
    console.log(`Demo is ready at demos/${slug}/. Fill the blocked config, then re-run.`);
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
