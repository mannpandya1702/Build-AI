// Pricing ladder loader (MASTER_SPEC §4 + Amendment A). Typed access to config/pricing.yaml; the
// contract generator validates against these numbers so a mispriced agreement can't be produced.
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";
import { z } from "zod";

const CONFIG_DIR = resolve(dirname(fileURLToPath(import.meta.url)), "../../../config");

const FixedProduct = z.object({
  name: z.string(),
  setup: z.number(),
  monthly: z.number(),
  monthly_label: z.string().optional(),
  setup_waived_with_website: z.boolean().optional(),
  included_minutes: z.number().optional(),
  overage_per_minute: z.number().optional(),
  includes: z.string(),
});
const RangeProduct = z.object({
  name: z.string(),
  setup_min: z.number(),
  setup_max: z.number(),
  monthly_min: z.number(),
  monthly_max: z.number(),
  includes: z.string(),
});
const ProductSchema = z.union([FixedProduct, RangeProduct]);
export type FixedProduct = z.infer<typeof FixedProduct>;
export type RangeProduct = z.infer<typeof RangeProduct>;
export type Product = z.infer<typeof ProductSchema>;

export const PricingSchema = z.object({
  currency: z.string(),
  products: z.record(z.string(), ProductSchema),
  contract: z.object({
    ip_clause: z.string(),
    guarantees: z.object({ uptime_pct: z.number(), speed_to_lead_seconds: z.number() }),
    termination_notice_days: z.number(),
    setup_nonrefundable_after_delivery: z.boolean().default(true),
  }),
});
export type Pricing = z.infer<typeof PricingSchema>;

export function isRangeProduct(p: Product): p is RangeProduct {
  return "setup_min" in p;
}

export function loadPricing(): Pricing {
  return PricingSchema.parse(parse(readFileSync(resolve(CONFIG_DIR, "pricing.yaml"), "utf8")));
}
