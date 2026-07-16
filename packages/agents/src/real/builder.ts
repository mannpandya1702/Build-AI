// Builder Agent (spec §6.7): design_ready -> demo_qa (demo) or closed_won -> final_qa (final).
// Composes the demo from @autopilot/blocks by filling the proven roofing template with the lead's
// REAL data (verbatim reviews, real GBP photos, the assigned look), adds the watermark + noindex for
// demos, and deploys via the Vercel adapter. Enforces the per-lead demo-phase budget. Every fact
// comes from the lead's verified data or agency-facts.yaml; unknowns are omitted, never invented
// (CLAUDE.md §0.1, system rule §1: a deployed demo never shows a placeholder).
import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  MOCK,
  deployDir,
  fetchPhotoBytes,
  loadAgencyFacts,
  loadCaps,
  placeDetails,
} from "@autopilot/adapters";
import { PRESET_BY_ID, type Preset, presetForIndustry } from "@autopilot/blocks";
import { advanceLead, emitEvent, getPool, notifyOperator } from "@autopilot/core";
import { type GeneratedCopy, fetchSiteText, generatePersonalizedCopy } from "./copy.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "../../../..");
const BUILDS_DIR = resolve(process.cwd(), "data", "builds");
const MAX_PHOTOS = 6;

const DEFAULT_ROOFER_SERVICES = [
  {
    name: "Roof Repair",
    blurb: "Leaks, missing shingles, flashing. Fixed before small problems become big ones.",
  },
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
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48) || "demo"
  );
}

interface Review {
  author: string;
  rating: number;
  text: string;
}

function curateReviews(raw: unknown): Review[] {
  const arr = Array.isArray(raw) ? raw : [];
  return arr
    .map((r: any) => ({
      author: r.author ?? r.authorAttribution?.displayName ?? "Google reviewer",
      rating: r.rating ?? 5,
      text: String(r.text?.text ?? r.text ?? "").trim(),
    }))
    .filter((r) => r.text.length > 0 && r.rating >= 4)
    .sort((a, b) => b.rating - a.rating || a.text.length - b.text.length)
    .slice(0, 4)
    .map((r) =>
      r.text.length > 420
        ? {
            ...r,
            text: `${r.text
              .slice(0, 400)
              .replace(/\s+\S*$/, "")
              .trimEnd()}...`,
          }
        : r,
    );
}

async function downloadPhotos(
  leadId: string,
  photoNames: string[],
  destDir: string,
): Promise<{ src: string; alt: string }[]> {
  const photos: { src: string; alt: string }[] = [];
  if (photoNames.length === 0) return photos;
  const photosDir = resolve(destDir, "public/photos");
  mkdirSync(photosDir, { recursive: true });
  // Per-lead byte cache OUTSIDE the build dir. Rebuilds used to rmSync the build dir and re-fetch
  // every photo from Places — one fleet rebuild burned the entire 200/day cap re-downloading the
  // SAME photos, and later builds silently shipped photo-less (2026-07-12). Cached bytes survive
  // every rebuild; Places is only touched for photos never fetched before.
  const cacheDir = resolve(process.cwd(), "data", "photos", leadId);
  mkdirSync(cacheDir, { recursive: true });
  for (let i = 0; i < Math.min(photoNames.length, MAX_PHOTOS); i++) {
    const outName = `photo-${i + 1}.jpg`;
    const cachePath = resolve(cacheDir, outName);
    try {
      if (!existsSync(cachePath)) {
        const bytes = await fetchPhotoBytes(photoNames[i], 1280);
        writeFileSync(cachePath, bytes);
      }
      cpSync(cachePath, resolve(photosDir, outName));
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
    await emitEvent({
      agent: "builder",
      leadId,
      level: "debug",
      type: "builder.skipped",
      message: `lead at ${lead.status}`,
    });
    return;
  }
  const isFinal = lead.status === "closed_won" || lead.status === "final_building";
  const kind: "demo" | "final" = isFinal ? "final" : "demo";
  const buildingStatus = isFinal ? "final_building" : "demo_building";

  const design = (
    await pool.query("select * from designs where lead_id = $1 order by created_at desc limit 1", [leadId])
  ).rows[0];
  if (!design) throw new Error(`no design for lead ${leadId}`);

  const preset: Preset = PRESET_BY_ID.get(design.brand?.preset) ?? presetForIndustry(lead.industry);
  if (!preset.live || !preset.templateDir) {
    await notifyOperator({
      type: "preset_not_live",
      title: `${lead.company_name}: no ${preset.label} template yet, cannot build`,
      leadId,
    });
    await emitEvent({
      agent: "builder",
      leadId,
      level: "warn",
      type: "build.blocked",
      message: `preset ${preset.id} has no rendered template`,
    });
    return; // hold at design_ready; never ship a half-built demo
  }

  // Per-lead demo-phase budget (spec §9): sum Sonnet spend across the demo phase for this lead.
  const caps = loadCaps();
  const spentRow = await pool.query<{ s: string }>(
    `select coalesce(sum(cost_usd),0)::text s from agent_events where lead_id = $1 and cost_usd is not null and agent in ('analyzer','solution','uiux','builder')`,
    [leadId],
  );
  const spent = Number.parseFloat(spentRow.rows[0].s);
  if (spent >= caps.anthropic_usd_per_lead_demo_phase) {
    await emitEvent({
      agent: "builder",
      leadId,
      level: "warn",
      type: "budget.exceeded",
      message: `demo-phase spend $${spent.toFixed(2)} >= $${caps.anthropic_usd_per_lead_demo_phase}`,
    });
    await notifyOperator({
      type: "budget_exceeded",
      title: `${lead.company_name}: demo-phase budget hit ($${spent.toFixed(2)})`,
      leadId,
    });
    return;
  }

  const agency = loadAgencyFacts();
  const slug = slugify(lead.company_name);
  const destDir = resolve(BUILDS_DIR, `${slug}-${kind}`);
  const templateDir = resolve(REPO_ROOT, "legacy", "templates", preset.templateDir);
  if (!existsSync(templateDir)) throw new Error(`template missing at ${templateDir}`);

  // Stale-claim recovery (Phase 7 chaos hardening): a worker killed mid-build leaves its 'building'
  // row behind, which would block every future claim for this lead+kind FOREVER. A build that has
  // been 'building' for >30 min is dead (real builds take ~2-4 min); mark it failed so the claim
  // below can proceed. Bounded to this lead+kind: never touches another lead's live build.
  await pool.query(
    `update builds set status='failed' where lead_id=$1 and kind=$2 and status='building' and updated_at < now() - interval '30 minutes'`,
    [leadId, kind],
  );

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
    await emitEvent({
      agent: "builder",
      leadId,
      level: "debug",
      type: "builder.skipped",
      message: "a build is already in flight for this lead",
    });
    return;
  }
  const buildId = claim.rows[0].id;
  const iteration = claim.rows[0].iteration;

  // Fresh trigger advances into the building state; a QA-fix re-entry is already there.
  if (FRESH.has(lead.status)) await advanceLead(leadId, buildingStatus, { agent: "builder" });

  if (existsSync(destDir)) rmSync(destDir, { recursive: true, force: true });
  mkdirSync(BUILDS_DIR, { recursive: true });
  cpSync(templateDir, destDir, {
    recursive: true,
    filter: (src) => !/node_modules|\.next|[/\\]out([/\\]|$)/.test(src),
  });

  // Evidence refresh: legacy-imported leads carry empty reviews/photos even though their Google
  // profile has both (Places returns them; the old import skipped them). One Details call fills
  // the gap so the demo can show REAL reviews and photos instead of empty states.
  let leadReviews = lead.reviews;
  let leadPhotos = lead.photos;
  const reviewsEmpty = !Array.isArray(leadReviews) || leadReviews.length === 0;
  const photosEmpty = !Array.isArray(leadPhotos) || leadPhotos.length === 0;
  if ((reviewsEmpty || photosEmpty) && lead.google_place_id && !MOCK()) {
    try {
      const fresh = await placeDetails(lead.google_place_id);
      if (reviewsEmpty && fresh.reviews?.length) leadReviews = fresh.reviews;
      if (photosEmpty && fresh.photos?.length) leadPhotos = fresh.photos;
      await pool.query("update leads set reviews=$2, photos=$3 where id=$1", [
        leadId,
        JSON.stringify(leadReviews ?? []),
        JSON.stringify(leadPhotos ?? []),
      ]);
      await emitEvent({
        agent: "builder",
        leadId,
        level: "debug",
        type: "evidence.refreshed",
        message: `Places details: ${fresh.reviews?.length ?? 0} reviews, ${fresh.photos?.length ?? 0} photos`,
      });
    } catch (err) {
      await emitEvent({
        agent: "builder",
        leadId,
        level: "debug",
        type: "evidence.refresh_failed",
        message: (err as Error).message,
      });
    }
  }

  const reviews = curateReviews(leadReviews);
  const photoNames = (Array.isArray(leadPhotos) ? leadPhotos : [])
    .map((p: any) => (typeof p === "string" ? p : p?.name))
    .filter(Boolean);
  const photos = await downloadPhotos(leadId, photoNames, destDir);
  if (photos.length === 0 && photoNames.length > 0) {
    // marker for the self-heal loop: this demo shipped photo-less only because fetches failed
    // (usually the daily Places cap); requeue it when headroom returns.
    await emitEvent({
      agent: "builder",
      leadId,
      level: "warn",
      type: "build.no_photos",
      message: `${photoNames.length} photos on the lead, none fetched (cap or fetch failure)`,
    });
  }

  const look = design.brand ?? {};
  const palette = look.palette ?? {
    brand: "180 56 13",
    brandInk: "255 255 255",
    ink: "16 24 31",
    paper: "250 247 242",
    paper2: "241 235 226",
  };
  const heroVariant = look.hero_variant ?? "photo";
  const theme = {
    id: `${preset.id}-${heroVariant}`,
    palette,
    // fontPair is the legacy fallback; displayFont/bodyFont drive the name-based font registry so the
    // look's exact skill-grounded pairing renders (CLAUDE.md §9).
    fontPair: fontPairKey(look.fonts?.display ?? "Bricolage Grotesque"),
    displayFont: look.fonts?.display ?? undefined,
    bodyFont: look.fonts?.body ?? undefined,
    heroVariant,
  };

  const city = lead.city || "your area";
  const needs: string[] = [];
  if (!lead.contact_phone) needs.push("[NEEDS: phone] no phone on the GBP; tap-to-call not wired");
  if (photos.length === 0)
    needs.push("[NEEDS: photos] no GBP photos downloaded; gallery shows an honest preview state");
  if (reviews.length === 0) needs.push("[NEEDS: reviews] no positive review text available");

  // Personalized copy from THIS business's evidence (contract §5a; operator directive 2026-07-11:
  // no more identical template text across demos). Evidence: their reviews, our audit of their
  // current site, that site's own visible text, the sales angle. Falls back to the safe trade
  // defaults on any failure — a build never blocks on copy.
  let copy: GeneratedCopy | null = null;
  if (!MOCK()) {
    const audit = (
      await pool.query(
        "select summary, findings from audits where lead_id=$1 order by created_at desc limit 1",
        [leadId],
      )
    ).rows[0];
    const solution = (
      await pool.query(
        "select pitch_angle from solutions where lead_id=$1 order by created_at desc limit 1",
        [leadId],
      )
    ).rows[0];
    const siteText = await fetchSiteText(lead.website_url ?? null);
    const result = await generatePersonalizedCopy(leadId, {
      companyName: lead.company_name,
      city,
      state: lead.region ?? "",
      industry: lead.industry ?? preset.id,
      rating: lead.rating != null ? Number(lead.rating) : null,
      reviewCount: lead.review_count ?? null,
      phone: lead.contact_phone ?? null,
      reviews: (Array.isArray(leadReviews) ? leadReviews : [])
        .map((r: any) => ({
          rating: Number(r.rating ?? 5),
          text: String(r.text?.text ?? r.text ?? "").trim(),
        }))
        .filter((r: { text: string }) => r.text)
        .slice(0, 10),
      auditSummary: audit?.summary ?? null,
      auditFindings: Array.isArray(audit?.findings)
        ? audit.findings
            .map((f: any) => String(f.evidence ?? ""))
            .filter(Boolean)
            .slice(0, 6)
        : [],
      siteText,
      pitchAngle: solution?.pitch_angle ?? null,
    });
    copy = result.ok ? result.copy : null;
    await emitEvent({
      agent: "builder",
      leadId,
      level: copy ? "info" : "warn",
      type: copy ? "copy.generated" : "copy.fallback",
      message: copy
        ? `personalized copy from evidence (site text: ${siteText ? "yes" : "no"}, reviews: ${Array.isArray(leadReviews) ? leadReviews.length : 0}, audit: ${audit ? "yes" : "no"})`
        : `copy generation failed guards (${result.ok ? "" : result.reason}); using trade defaults`,
    });
  }
  if (copy?.needs.length) needs.push(...copy.needs);
  if (!copy)
    needs.push(
      "[NEEDS: confirm services & storm/insurance work] roofer defaults; confirm with owner before send",
    );

  const content = {
    placeId: lead.google_place_id ?? leadId,
    businessName: lead.company_name,
    city,
    state: lead.region ?? "",
    phone: lead.contact_phone ?? null,
    niche: preset.id,
    primaryService: copy?.primaryService ?? "Roof Repair",
    heroSubline: copy?.heroSubline ?? null,
    services: copy?.services ?? DEFAULT_ROOFER_SERVICES,
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
    faq: copy?.faq ?? [
      { q: "What areas do you cover?", a: `${city} and the surrounding area.` },
      {
        q: "How do I get a quote?",
        a: lead.contact_phone
          ? `Call ${lead.contact_phone} or use the form above. It takes under a minute.`
          : "Use the form above. It takes under a minute.",
      },
      {
        q: "What should I do after a storm?",
        a: "Get the roof inspected and the damage photographed before you file anything. Then you know exactly what you're dealing with.",
      },
    ],
    needs,
    // demo controls (spec §6.7): watermark + noindex on demos; final client site has neither.
    demo: kind === "demo",
    watermark:
      kind === "demo" ? `Demo preview built for ${lead.company_name} by ${agency.identity.name}` : null,
    noindex: kind === "demo",
  };

  writeFileSync(resolve(destDir, "content.json"), `${JSON.stringify(content, null, 2)}\n`, "utf8");

  // Deploy (mock: local URL; real: Vercel builds + serves). Failure marks the build failed and
  // notifies the operator rather than throwing the lead into a retry storm.
  let deploy: { url: string; deploymentId: string; reachable: boolean };
  try {
    deploy = await deployDir(destDir, `${slug}-${kind}`, {
      scope: agency.deploy.vercel_scope,
      aliasBase: "tradecraft",
    });
  } catch (err) {
    await pool.query("update builds set status='failed' where id=$1", [buildId]);
    await emitEvent({
      agent: "builder",
      leadId,
      level: "error",
      type: "build.failed",
      message: (err as Error).message,
    });
    // A REBUILD failing (deploy limit, transient Vercel outage) must never strand or churn the
    // lead: the previous demo is still live, so fall back to it (sales' rebuild guard restores the
    // exact prior stage). Observed 2026-07-12: the Vercel daily deploy cap turned 7 cosmetic
    // rebuilds into a retry+notification storm that also re-burned copy LLM calls per attempt.
    const previous = await pool.query<{ n: string }>(
      "select count(*)::text n from builds where lead_id=$1 and kind=$2 and deploy_url like 'https://%'",
      [leadId, kind],
    );
    if (kind === "demo" && Number(previous.rows[0].n) > 0) {
      await advanceLead(leadId, "outreach_ready", { agent: "builder" });
      await emitEvent({
        agent: "builder",
        leadId,
        level: "warn",
        type: "build.deferred",
        message:
          "rebuild deploy failed; falling back to the existing live demo (will catch up on a later rebuild)",
      });
      return;
    }
    await notifyOperator({
      type: "build_failed",
      title: `${lead.company_name}: ${kind} deploy failed`,
      leadId,
    });
    return; // fresh build stays in *_building; operator sees it. No retry storm.
  }

  await pool.query(
    "update builds set status='deployed', deploy_url=$2, vercel_deployment_id=$3 where id=$1",
    [buildId, deploy.url, deploy.deploymentId],
  );
  await emitEvent({
    agent: "builder",
    leadId,
    type: "build.deployed",
    message: `${kind} #${iteration} live: ${deploy.url}${MOCK() ? " (mock)" : ""}`,
    payload: { url: deploy.url, kind, iteration, reachable: deploy.reachable },
  });
  await advanceLead(leadId, kind === "demo" ? "demo_qa" : "final_qa", { agent: "builder" });
}
