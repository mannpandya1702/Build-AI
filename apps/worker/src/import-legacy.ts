// Legacy import (spec §2.7): existing Web Studio CRM (legacy data/leads.json at repo root /data)
// imports into leads with source='legacy'. Stage mapping documented in PROGRESS.md.
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { getPool, closePool, emitEvent, type LeadStatus } from "@autopilot/core";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const LEADS = resolve(repoRoot, "data/leads.json");

const STAGE_MAP: Record<string, LeadStatus> = {
  found: "discovered",
  qualified: "qualified",
  demo_built: "outreach_ready",
  contacted: "contacted",
  replied: "replied",
  negotiating: "negotiating",
  closed_won: "closed_won",
  closed_lost: "closed_lost",
  nurture: "nurture",
};

const rows = JSON.parse(readFileSync(LEADS, "utf8")) as any[];
const pool = getPool();
let imported = 0;
for (const l of rows) {
  const status = STAGE_MAP[l.stage] ?? "discovered";
  const r = await pool.query(
    `insert into leads (company_name, slug, industry, city, region, country, website_url, google_place_id, gbp_url,
                        review_count, rating, reviews, contact_name, contact_email, contact_phone, source, status, score, score_breakdown)
     values ($1,$2,$3,$4,$5,'US',$6,$7,$8,$9,$10,'[]'::jsonb,$11,$12,$13,'legacy',$14,$15,$16)
     on conflict (google_place_id) do nothing`,
    [
      l.business_name, null, l.niche ?? "roofing", l.city || null, l.state || null,
      l.current_site_url || null, l.place_id, l.gbp_url || null,
      l.review_count ?? null, l.rating ?? null,
      l.owner_name || null, l.email || null, l.phone || null,
      status, l.score ?? null, null,
    ],
  );
  if (r.rowCount) imported++;
}
await emitEvent({ agent: "import", type: "legacy.imported", message: `${imported}/${rows.length} legacy leads imported` });
console.log(`imported ${imported}/${rows.length} legacy leads`);
await closePool();
