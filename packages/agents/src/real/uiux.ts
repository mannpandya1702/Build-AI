// UI/UX Agent (spec §6.6): solution_ready -> design_ready. Assigns a look (contract §5d: no two
// prospects in the same preset + metro get the same look while free looks remain; stored on the
// design; locked once the demo is sent), then Sonnet writes the hero copy + section intent from
// VERIFIED facts only. Produces the `designs` row: brand (palette/fonts/tone/hero copy), sitemap,
// and page_specs (the block sequence with per-block copy/data-source), all from @autopilot/blocks.
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { advanceLead, emitEvent, getPool, notifyOperator } from "@autopilot/core";
import { llm, MOCK, designGuidance } from "@autopilot/adapters";
import { presetForIndustry, BLOCK_BY_ID, blockDataSatisfied, type Preset } from "@autopilot/blocks";

const PROMPT = readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), "prompts/uiux.md"), "utf8");

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

interface LookRow {
  id: string;
  name: string;
  palette: Record<string, string>;
  type_pairing: { display: string; body: string };
  hero_variant: string;
}

/**
 * Assign a look for this lead (contract §5d). Precedence:
 * 1. If the design already has a LOCKED look (demo was sent), keep it, never reshuffle.
 * 2. Otherwise pick, deterministically by lead-id hash, a look for the preset that is NOT already
 *    used by another active (non-dead) lead's design in the same metro. Probe forward if taken.
 * 3. Only when every look in the preset is taken in this metro is a reuse allowed (hash pick).
 */
async function assignLook(leadId: string, preset: Preset, city: string | null): Promise<LookRow> {
  const pool = getPool();

  const existing = await pool.query<{ look_id: string | null; look_locked: boolean }>(
    "select look_id, look_locked from designs where lead_id = $1 order by created_at desc limit 1",
    [leadId],
  );
  const looks = (await pool.query<LookRow>("select id, name, palette, type_pairing, hero_variant from looks where preset = $1 order by name", [preset.id])).rows;
  if (looks.length === 0) throw new Error(`no looks seeded for preset ${preset.id} (run seed-looks)`);

  if (existing.rows[0]?.look_locked && existing.rows[0].look_id) {
    const kept = looks.find((l) => l.id === existing.rows[0].look_id);
    if (kept) return kept;
  }

  const takenRows = await pool.query<{ look_id: string }>(
    `select distinct d.look_id from designs d
       join leads l2 on l2.id = d.lead_id
      where d.look_id is not null
        and l2.id <> $1
        and lower(coalesce(l2.city,'')) = lower(coalesce($2,''))
        and l2.status not in ('disqualified','closed_lost','suppressed','nurture')
        and d.look_id in (select id from looks where preset = $3)`,
    [leadId, city, preset.id],
  );
  const taken = new Set(takenRows.rows.map((r) => r.look_id));

  const start = hashString(leadId) % looks.length;
  for (let step = 0; step < looks.length; step++) {
    const cand = looks[(start + step) % looks.length];
    if (!taken.has(cand.id)) return cand;
  }
  return looks[start]; // all taken in this metro: reuse is the only option
}

export async function uiux(leadId: string): Promise<void> {
  const pool = getPool();
  const lead = (await pool.query("select * from leads where id = $1", [leadId])).rows[0];
  if (!lead) throw new Error(`lead ${leadId} missing`);

  if (lead.status !== "solution_ready") {
    await emitEvent({ agent: "uiux", leadId, level: "debug", type: "uiux.skipped", message: `lead already at ${lead.status}` });
    return;
  }

  const solution = (await pool.query("select * from solutions where lead_id = $1 order by created_at desc limit 1", [leadId])).rows[0];
  const audit = (await pool.query("select summary, findings from audits where lead_id = $1 order by created_at desc limit 1", [leadId])).rows[0];
  const preset = presetForIndustry(lead.industry);

  // A preset without a rendered template cannot be shipped honestly. Assign the design + look so the
  // lead is not lost, but hold at design_ready and tell the operator (never ship a half-built demo).
  if (!preset.live) {
    await notifyOperator({ type: "preset_not_live", title: `${lead.company_name}: ${preset.label} template not built yet`, leadId });
  }

  const look = await assignLook(leadId, preset, lead.city);

  // Ground the design in the ui-ux-pro-max skill (CLAUDE.md §9): product reasoning, the landing
  // conversion pattern, and UX guidelines for this niche. The skill INFORMS the copy + section
  // intent; the assigned look + the anti-slop contract still GOVERN the visuals. Advisory: empty
  // guidance (skill miss) just means no extra grounding, never a failure.
  const guidance = await designGuidance(preset.label, lead.city);
  const skillGrounded = Boolean(guidance.product || guidance.landing || guidance.ux);

  // Facts the copy may use, all verified. review_signal is the real praise pattern the solution found.
  const reviewSignal = solution?.differentiators?.[0] ?? (lead.review_count ? `${lead.review_count} Google reviews at ${lead.rating ?? "?"}` : null);
  const facts = {
    company: lead.company_name,
    city: lead.city,
    state: lead.region,
    primary_service: preset.id === "roofing" ? "Roof Repair" : preset.label,
    niche_need: preset.nicheNeed,
    review_count: lead.review_count,
    rating: lead.rating,
    review_signal: reviewSignal,
    has_phone: Boolean(lead.contact_phone),
  };

  const raw = await llm({
    tier: "sonnet",
    agent: "uiux",
    leadId,
    maxTokens: 700,
    system: PROMPT,
    prompt: `Verified facts:\n${JSON.stringify(facts, null, 2)}\n\nAudit summary: ${audit?.summary ?? "n/a"}\nPitch: ${solution?.pitch_angle ?? "n/a"}\n\n` +
      (skillGrounded
        ? `Design intelligence for this niche (ui-ux-pro-max skill; use it to inform section intent + copy emphasis, but it does NOT override the verified facts or the assigned visual look):\n` +
          `${[guidance.product, guidance.landing, guidance.ux].filter(Boolean).join("\n\n").slice(0, 2200)}\n\n`
        : "") +
      `Write the copy JSON.`,
    mockResponse: JSON.stringify({
      tone: "direct, local, no-nonsense",
      hero: { headline: `${facts.primary_service} in ${lead.city ?? "your area"}`, subhead: reviewSignal ? `${reviewSignal}. One tap to call.` : "Fast, honest work. One tap to call." },
      niche_need_line: `${preset.nicheNeed}. We answer.`,
      cta_primary: facts.has_phone ? "Call now" : "Get a quote",
      cta_secondary: "Get a free quote",
    }),
  });
  const copy = safeJson(raw) ?? {};

  // Build page_specs: the preset's block sequence, keeping only blocks whose real data exists
  // (no fabrication). Hero + niche-need carry Sonnet copy; the rest name their data source so the
  // builder fills them verbatim from the lead's real data.
  const factBag: Record<string, unknown> = {
    phone: lead.contact_phone, city: lead.city, primaryService: facts.primary_service,
    reviewCount: lead.review_count, rating: lead.rating, services: true, reviews: undefined, photos: undefined, mapQuery: lead.company_name,
  };
  const heroBlockId = `hero-${look.hero_variant}`;
  const blocks = preset.blockSequence
    .map((id) => (id.startsWith("hero-") ? heroBlockId : id))
    .filter((id, i, arr) => arr.indexOf(id) === i)
    .map((id) => {
      const def = BLOCK_BY_ID.get(id);
      if (!def) return null;
      // structural blocks always render; conditional blocks render only if their data will exist.
      // reviews/photos are resolved by the builder from Place Details, so keep them tentatively.
      const dataKnownAtDesign = def.structural || ["reviews", "gallery"].includes(id) || blockDataSatisfied(def, factBag);
      if (!dataKnownAtDesign) return null;
      const block: { block: string; source: string; copy?: unknown } = { block: id, source: def.needs.length ? def.needs.join(",") : "structural" };
      if (id === heroBlockId) block.copy = copy.hero ?? {};
      if (id === "niche-need-band") block.copy = { line: copy.niche_need_line ?? preset.nicheNeed };
      return block;
    })
    .filter(Boolean);

  const brand = {
    tone: copy.tone ?? "direct, local",
    palette: look.palette,
    fonts: look.type_pairing,
    hero_variant: look.hero_variant,
    hero: copy.hero ?? null,
    cta: { primary: copy.cta_primary ?? "Get a quote", secondary: copy.cta_secondary ?? "Get a free quote" },
    preset: preset.id,
    preset_live: preset.live,
    // provenance: whether this design was grounded in the ui-ux-pro-max skill (CLAUDE.md §9).
    skill_grounded: skillGrounded,
  };
  const sitemap = ["Home", "Services", "About", "Contact"];

  await pool.query(
    `insert into designs (lead_id, brand, sitemap, page_specs, look_id, look_locked)
     values ($1,$2,$3,$4,$5,false)`,
    [leadId, JSON.stringify(brand), JSON.stringify(sitemap), JSON.stringify([{ page: "Home", blocks }]), look.id],
  );
  await emitEvent({ agent: "uiux", leadId, type: "design.ready", message: `look '${look.name}' + ${blocks.length} blocks${skillGrounded ? " (skill-grounded)" : ""}${MOCK() ? " (mock)" : ""}`, payload: { look: look.name, preset: preset.id, skill_grounded: skillGrounded } });
  await advanceLead(leadId, "design_ready", { agent: "uiux" });
}

function safeJson(s: string): any {
  try {
    const m = s.match(/\{[\s\S]*\}/);
    return m ? JSON.parse(m[0]) : null;
  } catch {
    return null;
  }
}
