// zod schemas for agent inputs/outputs (spec §3: validation at every seam).
// These are the shared shapes; each agent module validates with these before writing to the DB.
import { z } from "zod";
import { LEAD_STATUSES } from "./statuses.js";

export const LeadStatusSchema = z.enum(LEAD_STATUSES);

export const LeadSchema = z.object({
  id: z.string().uuid(),
  company_name: z.string().min(1),
  slug: z.string().nullable(),
  industry: z.string().nullable(),
  city: z.string().nullable(),
  region: z.string().nullable(),
  country: z.string().nullable(),
  website_url: z.string().nullable(),
  google_place_id: z.string().nullable(),
  gbp_url: z.string().nullable(),
  review_count: z.number().int().nullable(),
  rating: z.coerce.number().nullable(),
  photos: z.array(z.string()).default([]),
  reviews: z
    .array(z.object({ author: z.string(), rating: z.number(), text: z.string() }))
    .default([]),
  contact_name: z.string().nullable(),
  contact_email: z.string().nullable(),
  contact_phone: z.string().nullable(),
  source: z.string().nullable(),
  status: LeadStatusSchema,
  score: z.number().int().nullable(),
  score_breakdown: z.record(z.number()).nullable(),
  disqualify_reason: z.string().nullable(),
});
export type Lead = z.infer<typeof LeadSchema>;

export const AuditFindingSchema = z.object({
  category: z.enum(["performance", "seo", "design", "content", "trust", "conversion"]),
  severity: z.enum(["low", "medium", "high"]),
  evidence: z.string().min(1), // spec §6.4: every finding must cite evidence
  why_it_costs_them: z.string().min(1),
});
export type AuditFinding = z.infer<typeof AuditFindingSchema>;

export const AuditSchema = z.object({
  lead_id: z.string().uuid(),
  lighthouse: z
    .object({ performance: z.number(), seo: z.number(), accessibility: z.number(), best_practices: z.number() })
    .nullable(),
  screenshots: z.array(z.object({ viewport: z.string(), path: z.string() })).default([]),
  pages_crawled: z.array(z.string()).default([]),
  findings: z.array(AuditFindingSchema).default([]),
  summary: z.string().nullable(),
});
export type Audit = z.infer<typeof AuditSchema>;

export const SolutionSchema = z.object({
  lead_id: z.string().uuid(),
  pitch_angle: z.string().min(1),
  proposed_pages: z.array(z.string()).min(3).max(4),
  features: z.array(z.string()).default([]),
  differentiators: z.array(z.string()).default([]),
  estimated_impact: z.string().nullable(),
  call_sheet_md: z.string().nullable(),
});
export type Solution = z.infer<typeof SolutionSchema>;

export const DesignSchema = z.object({
  lead_id: z.string().uuid(),
  brand: z.object({
    palette: z.record(z.string()),
    fonts: z.object({ display: z.string(), body: z.string() }),
    tone: z.string(),
  }),
  sitemap: z.array(z.string()),
  page_specs: z.array(
    z.object({
      page: z.string(),
      blocks: z.array(z.object({ block: z.string(), props: z.record(z.unknown()) })),
    }),
  ),
  look_id: z.string().uuid().nullable(),
});
export type Design = z.infer<typeof DesignSchema>;

export const QaCheckResultSchema = z.object({
  passed: z.boolean(),
  checks: z.record(z.union([z.boolean(), z.number(), z.string()])),
  issues: z.array(z.object({ check: z.string(), detail: z.string() })).default([]),
});
export type QaCheckResult = z.infer<typeof QaCheckResultSchema>;

export const ReplyClassificationSchema = z.enum([
  "interested",
  "question",
  "not_interested",
  "unsubscribe",
  "auto_reply",
  "other",
]);
export type ReplyClassification = z.infer<typeof ReplyClassificationSchema>;
