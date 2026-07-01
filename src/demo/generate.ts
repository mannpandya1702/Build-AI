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
import { getLead, upsertLead } from "../crm/leads";
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
// Kept deliberately generic so the demo never asserts a service the business may not offer.
const DEFAULT_ROOFER_SERVICES = [
  "Roof Repair",
  "Roof Replacement",
  "Storm & Hail Damage",
  "Roof Inspections",
];

export interface DemoReview {
  author: string;
  rating: number;
  text: string;
}

export interface DemoContent {
  placeId: string;
  businessName: string;
  city: string;
  state: string;
  phone: string | null;
  primaryService: string;
  services: string[];
  reviews: DemoReview[];
  photos: { src: string; alt: string }[];
  address: string;
  mapQuery: string;
  rating: number | null;
  reviewCount: number | null;
  brandColor: string;
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

  const reviews: DemoReview[] = (details.reviews ?? [])
    .slice(0, 5)
    .map((r) => ({
      author: r.authorAttribution?.displayName ?? "Google reviewer",
      rating: r.rating ?? 5,
      text: (r.text?.text ?? "").trim(),
    }))
    .filter((r) => r.text.length > 0);
  if (reviews.length === 0) needs.push("[NEEDS: reviews] no review text available from GBP");

  const photoNames = (details.photos ?? []).map((p) => p.name);
  const { photos, needs: photoNeeds } = await savePhotos(placeId, photoNames, destDir).catch((err) => {
    return { photos: [], needs: [`[NEEDS: photos] ${(err as Error).message}`] };
  });
  needs.push(...photoNeeds);

  if (!lead.phone) needs.push("[NEEDS: phone] no phone number on the GBP; tap-to-call cannot be wired");
  needs.push("[NEEDS: confirm services & pricing] service menu is a standard roofer default, confirm with owner");
  needs.push("[NEEDS: license/insurance/years] add real trust facts once confirmed");

  const content: DemoContent = {
    placeId,
    businessName: lead.business_name,
    city: lead.city || "your area",
    state: lead.state,
    phone: lead.phone,
    primaryService: "Roof Repair",
    services: DEFAULT_ROOFER_SERVICES,
    reviews,
    photos,
    address: details.formattedAddress ?? "",
    mapQuery: [lead.business_name, details.formattedAddress].filter(Boolean).join(", "),
    rating: lead.rating,
    reviewCount: lead.review_count,
    brandColor: "#b91c1c",
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
    upsertLead({ place_id: content.placeId, demo_url: deploy.url, demo_screenshot: deploy.screenshot ?? null, stage: "demo_built" });
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
