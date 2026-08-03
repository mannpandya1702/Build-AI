// Typed access to /config/*.yaml (spec §2.3: ICP is configuration).
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";

const CONFIG_DIR = resolve(dirname(fileURLToPath(import.meta.url)), "../../../config");

export interface IcpConfig {
  country: string;
  active_vertical: string;
  verticals: Record<string, { keywords: string[] }>;
  cities: string[];
  qualify_threshold: number;
  rubric: Record<string, number>;
  disqualify: { chain_markers: string[] };
}

export interface CapsConfig {
  places_calls_per_day: number;
  mailbox_daily_send_cap: number;
  total_daily_sends: number;
  concurrent_demo_builds: number;
  anthropic_usd_per_lead_demo_phase: number;
  anthropic_usd_per_day: number;
  build_budget: { usd_per_lead: number; usd_per_day: number };
  crawl: { per_domain_min_interval_ms: number; max_pages_per_site: number };
}

export function loadIcp(): IcpConfig {
  return parse(readFileSync(resolve(CONFIG_DIR, "icp.yaml"), "utf8")) as IcpConfig;
}

export function loadCaps(): CapsConfig {
  return parse(readFileSync(resolve(CONFIG_DIR, "caps.yaml"), "utf8")) as CapsConfig;
}

export interface AgencyFacts {
  identity: {
    name: string;
    from_email: string;
    domain: string;
    address: string;
    operator_first_name: string;
    based_in: string;
  };
  deploy: { vercel_team_id: string; vercel_scope: string; demo_base_domain: string };
  booking: { provider: string; event_type_slug: string; event_type_id: number; booking_link: string };
  offer: Record<string, string>;
  trust: { years_in_business: number | null; licenses: string[]; portfolio_clients: string[] };
}

// The ONLY facts demo/website + outreach copy may claim about the AGENCY (spec §4.1). Values that
// still read as "[NEEDS: ...]" are unconfirmed and must be treated as unknown by any consumer.
export function loadAgencyFacts(): AgencyFacts {
  return parse(readFileSync(resolve(CONFIG_DIR, "agency-facts.yaml"), "utf8")) as AgencyFacts;
}

/** True when a yaml value is still an unconfirmed placeholder ("[NEEDS: ...]") or empty. */
export function isUnconfirmed(v: unknown): boolean {
  return v === null || v === undefined || v === "" || (typeof v === "string" && /\[NEEDS:/i.test(v));
}

export const MOCK = (): boolean => process.env.MOCK_MODE !== "false";

// Build mode (MASTER_SPEC §2): `review` (default, permanent) queues every lead for operator approval
// before any paid build; `auto` builds top-scored leads within budget without a per-lead click. Env
// override first (BUILD_MODE), else the settings row, else review. `auto` is meant to be a deliberate
// per-session operator opt-in, never the resting default.
export type BuildMode = "review" | "auto";
export function resolveBuildMode(settingValue?: unknown): BuildMode {
  const raw = String(process.env.BUILD_MODE ?? settingValue ?? "review").toLowerCase();
  return raw === "auto" ? "auto" : "review";
}
