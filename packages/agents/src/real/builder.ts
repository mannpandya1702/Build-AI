// Builder Agent (spec §6.7): design_ready -> demo_qa (demo) or closed_won -> final_qa (final).
// Composes the demo from @autopilot/blocks by filling the proven roofing template with the lead's
// REAL data (verbatim reviews, real GBP photos, the assigned look), adds the watermark + noindex for
// demos, and deploys via the Vercel adapter. Enforces the per-lead demo-phase budget. Every fact
// comes from the lead's verified data or agency-facts.yaml; unknowns are omitted, never invented
// (CLAUDE.md §0.1, system rule §1: a deployed demo never shows a placeholder).
import { cpSync, existsSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { advanceLead, emitEvent, getPool, notifyOperator } from "@autopilot/core";
import { deployDir, loadAgencyFacts, loadCaps, fetchPhotoBytes, MOCK } from "@autopilot/adapters";
import { presetForIndustry, PRESET_BY_ID, type Preset } from "@autopilot/blocks";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "../../../..");
const BUILDS_DIR = resolve(process.cwd(), "data", "builds");
const MAX_PHOTOS = 6;

const DEFAULT_ROOFER_SERVICES = [
  { name: "Roof Repair", blurb: "Leaks, missing shingles, flashing. Fixed before small problems become big ones." },
  { name: "Roof Replacement", blurb: "A full tear-off and a new roof, done once and done right." },
  { name: "Storm & Hail Damage", blurb: "Damage checked and documented properly after the weather hits." },
  { name: "Roof Inspections", blurb: "A straight answer on what your roof needs, with photos to prove it." },
];

// Map a look's display font to the template's font-pair key (the roofing template ships bricolage,
// archivo, grotesk). Looks were derived from those, so this is a total map for roofing.
function fontPairKey(displayFont: string): "bricolage" | "archivo" | "grotesk" {
  const f = displayFont.toLowerCase();
  if (f.includes("archivo")) return "archivo";
  if (f.includes("space grotesk") || f.includes("grotesk")) return "grotesk";
  return "bricolage";
}

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48) || "demo";
}

interface Review { author: string; rating: number; text: string }

function curateReviews(raw: unknown): Review[] {
  const arr = Array.isArray(raw) ? raw : [];
  return arr
    .map((r: any) => ({ author: r.author ?? r.authorAttribution?.displayName ?? "Google reviewer", rating: r.rating ?? 5, text: String(r.text?.text ?? r.text ?? "").trim() }))
    .filter((r) => r.text.length > 0 && r.rating >= 4)
    .sort((a, b) => b.rating - a.rating || a.text.length - b.text.length)
    .slice(0, 4)
    .map((r) => (r.text.length > 420 ? { ...r, text: r.text.slice(0, 400).replace(/\s+\S*$/, "").trimEnd() + "..." } : r));
}

async function downloadPhotos(photoNames: string[], destDir: string): Promise<{ src: string; alt: string }[]> {
  const photos: { src: string; alt: string }[] = [];
  if (photoNames.length === 0) return photos;
  const photosDir = resolve(destDir, "public/photos");
  mkdirSync(photosDir, { recursive: true });
  for (let i = 0; i < Math.min(photoNames.length, MAX_PHOTOS); i++) {
    try {
      const bytes = await fetchPhotoBytes(photoNames[i], 1280);
      const outName = `photo-${i + 1}.jpg`;
      writeFileSync(resolve(photosDir, outName), bytes);
      photos.push({ src: `/photos/${outName}`, alt: "Real photo of the team's work" });
    } catch {
      // cap hit or fetch failure: skip this photo. The template renders an honest empty-gallery
      // state (never a stock placeholder), so a demo with no photos is still fabrication-free.
      break;
    }
  }
  return photos;
}

export async function builder(leadId: string): Promise<void> {
  const pool = getPool();
  const lead = (await pool.query("select * from leads where id = $1", [leadId])).rows[0];
  if (!lead) throw new Error(`lead ${leadId} missing`);

  // Triggers: fresh (design_ready/closed_won) and QA-fix re-entry (*_building, where the QA agent
  // sent the lead back to rebuild). Any other status = a stale/duplicate job: skip.
  const FRESH = new Set(["design_ready", "closed_won"]);
  const REENTRY = new Set(["demo_building", "final_building"]);
  if (!FRESH.has(lead.status) && !REENTRY.has(lead.status)) {
    await emitEvent({ agent: "builder", leadId, level: "debug", type: "builder.skipped", message: `lead at ${lead.status}` });
    return;
  }
  const isFinal = lead.status === "closed_won" || lead.status === "final_building";
  const kind: "demo" | "final" = isFinal ? "final" : "demo";
  const buildingStatus = isFinal ? "final_building" : "demo_building";

  const design = (await pool.query("select * from designs where lead_id = $1 order by created_at desc limit 1", [leadId])).rows[0];
  if (!design) throw new Error(`no design for lead ${leadId}`);

  const preset: Preset = PRESET_BY_ID.get(design.brand?.preset) ?? presetForIndustry(lead.industry);
  if (!preset.live || !preset.templateDir) {
    await notifyOperator({ type: "preset_not_live", title: `${lead.company_name}: no ${preset.label} template yet, cannot build`, leadId });
    await emitEvent({ agent: "builder", leadId, level: "warn", type: "build.blocked", message: `preset ${preset.id} has no rendered template` });
    return; // hold at design_ready; never ship a half-built demo
  }

  // Per-lead demo-phase budget (spec §9): sum Sonnet spend across the demo phase for this lead.
  const caps = loadCaps();
  const spentRow = await pool.query<{ s: string }>(
    `select coalesce(sum(cost_usd),0)::text s from agent_events where lead_id = $1 and cost_usd is not null and agent in ('analyzer','solution','uiux','builder')`,
    [leadId],
  );
  const spent = parseFloat(spentRow.rows[0].s);
  if (spent >= caps.anthropic_usd_per_lead_demo_phase) {
    await emitEvent({ agent: "builder", leadId, level: "warn", type: "budget.exceeded", message: `demo-phase spend $${spent.toFixed(2)} >= $${caps.anthropic_usd_per_lead_demo_phase}` });
    await notifyOperator({ type: "budget_exceeded", title: `${lead.company_name}: demo-phase budget hit ($${spent.toFixed(2)})`, leadId });
    return;
  }

  const agency = loadAgencyFacts();
  const slug = slugify(lead.company_name);
  const destDir = resolve(BUILDS_DIR, `${slug}-${kind}`);
  const templateDir = resolve(REPO_ROOT, "legacy", "templates", preset.templateDir);
  if (!existsSync(templateDir)) throw new Error(`template missing at ${templateDir}`);

  // Atomically claim a build slot: insert a 'building' row only if none is in flight for this
  // lead+kind. This closes the self-trigger race: a fresh job advances design_ready->demo_building,
  // the scheduler then enqueues a second builder job on demo_building, and that job's claim fails
  // (the first job's 'building' row exists), so it skips instead of building a duplicate.
  const claim = await pool.query<{ id: string; iteration: number }>(
    `insert into builds (lead_id, kind, status, repo_path, iteration)
     select $1,$2,'building',$3,(select count(*) from builds where lead_id=$1 and kind=$2)+1
     where not exists (select 1 from builds where lead_id=$1 and kind=$2 and status='building')
     returning id, iteration`,
    [leadId, kind, destDir],
  );
  if (claim.rowCount === 0) {
    await emitEvent({ agent: "builder", leadId, level: "debug", type: "builder.skipped", message: "a build is already in flight for this lead" });
    return;
  }
  const buildId = claim.rows[0].id;
  const iteration = claim.rows[0].iteration;

  // Fresh trigger advances into the building state; a QA-fix re-entry is already there.
  if (FRESH.has(lead.status)) await advanceLead(leadId, buildingStatus, { agent: "builder" });

  if (existsSync(destDir)) rmSync(destDir, { recursive: true, force: true });
  mkdirSync(BUILDS_DIR, { recursive: true });
  cpSync(templateDir, destDir, { recursive: true, filter: (src) => !/node_modules|\.next|[/\\]out([/\\]|$)/.test(src) });

  const reviews = curateReviews(lead.reviews);
  const photoNames = (Array.isArray(lead.photos) ? lead.photos : []).map((p: any) => (typeof p === "string" ? p : p?.name)).filter(Boolean);
  const photos = await downloadPhotos(photoNames, destDir);

  const look = design.brand ?? {};
  const palette = look.palette ?? { brand: "180 56 13", brandInk: "255 255 255", ink: "16 24 31", paper: "250 247 242", paper2: "241 235 226" };
  const heroVariant = look.hero_variant ?? "photo";
  const theme = {
    id: `${preset.id}-${heroVariant}`,
    palette,
    fontPair: fontPairKey(look.fonts?.display ?? "Bricolage Grotesque"),
    heroVariant,
  };

  const city = lead.city || "your area";
  const needs: string[] = [];
  if (!lead.contact_phone) needs.push("[NEEDS: phone] no phone on the GBP; tap-to-call not wired");
  if (photos.length === 0) needs.push("[NEEDS: photos] no GBP photos downloaded; gallery shows an honest preview state");
  if (reviews.length === 0) needs.push("[NEEDS: reviews] no positive review text available");
  needs.push("[NEEDS: confirm services & storm/insurance work] roofer defaults; confirm with owner before send");

  const content = {
    placeId: lead.google_place_id ?? leadId,
    businessName: lead.company_name,
    city,
    state: lead.region ?? "",
    phone: lead.contact_phone ?? null,
    primaryService: "Roof Repair",
    services: DEFAULT_ROOFER_SERVICES,
    reviews,
    photos,
    heroPhoto: photos[0]?.src ?? null,
    // Scrape does not store a street address, so NAP shows the metro (city + state) it verified.
    address: [city, lead.region].filter(Boolean).join(", "),
    mapQuery: [lead.company_name, city, lead.region].filter(Boolean).join(", "),
    rating: lead.rating != null ? Number(lead.rating) : null,
    reviewCount: lead.review_count ?? null,
    brandColor: "#b4380d",
    theme,
    stormBand: preset.id === "roofing",
    faq: [
      { q: "What areas do you cover?", a: `${city} and the surrounding area.` },
      { q: "How do I get a quote?", a: lead.contact_phone ? `Call ${lead.contact_phone} or use the form above. It takes under a minute.` : "Use the form above. It takes under a minute." },
      { q: "What should I do after a storm?", a: "Get the roof inspected and the damage photographed before you file anything. Then you know exactly what you're dealing with." },
    ],
    needs,
    // demo controls (spec §6.7): watermark + noindex on demos; final client site has neither.
    demo: kind === "demo",
    watermark: kind === "demo" ? `Demo preview built for ${lead.company_name} by ${agency.identity.name}` : null,
    noindex: kind === "demo",
  };

  writeFileSync(resolve(destDir, "content.json"), JSON.stringify(content, null, 2) + "\n", "utf8");

  // Deploy (mock: local URL; real: Vercel builds + serves). Failure marks the build failed and
  // notifies the operator rather than throwing the lead into a retry storm.
  let deploy: { url: string; deploymentId: string; reachable: boolean };
  try {
    deploy = await deployDir(destDir, `${slug}-${kind}`, { scope: agency.deploy.vercel_scope, aliasBase: "tradecraft" });
  } catch (err) {
    await pool.query("update builds set status='failed' where id=$1", [buildId]);
    await emitEvent({ agent: "builder", leadId, level: "error", type: "build.failed", message: (err as Error).message });
    await notifyOperator({ type: "build_failed", title: `${lead.company_name}: ${kind} deploy failed`, leadId });
    return; // stays in *_building; operator sees it. No retry storm.
  }

  await pool.query("update builds set status='deployed', deploy_url=$2, vercel_deployment_id=$3 where id=$1", [buildId, deploy.url, deploy.deploymentId]);
  await emitEvent({ agent: "builder", leadId, type: "build.deployed", message: `${kind} #${iteration} live: ${deploy.url}${MOCK() ? " (mock)" : ""}`, payload: { url: deploy.url, kind, iteration, reachable: deploy.reachable } });
  await advanceLead(leadId, kind === "demo" ? "demo_qa" : "final_qa", { agent: "builder" });
}
