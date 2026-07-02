// Typed access to /config/*.yaml (spec §2.3: ICP is configuration).
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
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
  crawl: { per_domain_min_interval_ms: number; max_pages_per_site: number };
}

export function loadIcp(): IcpConfig {
  return parse(readFileSync(resolve(CONFIG_DIR, "icp.yaml"), "utf8")) as IcpConfig;
}

export function loadCaps(): CapsConfig {
  return parse(readFileSync(resolve(CONFIG_DIR, "caps.yaml"), "utf8")) as CapsConfig;
}

export const MOCK = (): boolean => process.env.MOCK_MODE !== "false";
