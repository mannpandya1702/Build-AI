// src/crm/leads.ts — Module 2, the lead store (CRM). One record per business, deduped by
// place_id, validated with zod. Shape matches CLAUDE.md §2 exactly and is Supabase-ready, so
// swapping the JSON store for a real DB later is a drop-in.

import { z } from "zod";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const LEADS_PATH = resolve(__dirname, "../../data/leads.json");

export const STAGES = [
  "found",
  "qualified",
  "demo_built",
  "contacted",
  "replied",
  "negotiating",
  "closed_won",
  "closed_lost",
  "nurture",
] as const;
export const StageEnum = z.enum(STAGES);
export type Stage = z.infer<typeof StageEnum>;

// Field order mirrors CLAUDE.md §2 / SETUP.md §8.
export const LeadSchema = z.object({
  place_id: z.string().min(1),
  business_name: z.string().default(""),
  niche: z.string().default(""),
  city: z.string().default(""),
  state: z.string().default(""),
  phone: z.string().nullable().default(null),
  email: z.string().nullable().default(null),
  gbp_url: z.string().nullable().default(null),
  review_count: z.number().nullable().default(null),
  rating: z.number().nullable().default(null),
  has_website: z.boolean().default(false),
  current_site_url: z.string().nullable().default(null),
  site_quality_score: z.number().nullable().default(null),
  score: z.number().default(0),
  demo_url: z.string().nullable().default(null),
  demo_screenshot: z.string().nullable().default(null),
  outreach_status: z.string().default(""),
  last_touch_date: z.string().nullable().default(null),
  reply: z.string().nullable().default(null),
  stage: StageEnum.default("found"),
  notes: z.string().default(""),
});
export type Lead = z.infer<typeof LeadSchema>;

function ensureStore(): void {
  const dir = dirname(LEADS_PATH);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  if (!existsSync(LEADS_PATH)) writeFileSync(LEADS_PATH, "[]\n", "utf8");
}

export function readLeads(): Lead[] {
  ensureStore();
  const raw = readFileSync(LEADS_PATH, "utf8").trim() || "[]";
  const parsed = JSON.parse(raw) as unknown;
  return z.array(LeadSchema).parse(parsed);
}

export function writeLeads(leads: Lead[]): void {
  ensureStore();
  writeFileSync(LEADS_PATH, JSON.stringify(leads, null, 2) + "\n", "utf8");
}

export function getLead(place_id: string): Lead | undefined {
  return readLeads().find((l) => l.place_id === place_id);
}

/**
 * Upsert by place_id. Merges a partial update onto an existing record, or inserts a new one.
 * Never duplicates a lead. Re-running `find` updates in place (SETUP.md §8).
 */
export function upsertLead(patch: Partial<Lead> & { place_id: string }): Lead {
  const leads = readLeads();
  const idx = leads.findIndex((l) => l.place_id === patch.place_id);
  let next: Lead;
  if (idx >= 0) {
    next = LeadSchema.parse({ ...leads[idx], ...patch });
    leads[idx] = next;
  } else {
    next = LeadSchema.parse(patch);
    leads.push(next);
  }
  writeLeads(leads);
  return next;
}
