// Finance agent: realistic unit economics from MEASURED data first, explicit assumptions second.
// Sources: agent_events.cost_usd (every LLM call), metered API events (places.call), and
// config/unit-costs.yaml for infra allocations + operator time. Output: per-lead cost, funnel
// cost-per-close, and PRICING FLOORS (min setup + retainer at target margin). Nothing invisible:
// every number is tagged measured | allocated | estimated.
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";
import { getPool } from "@autopilot/core";

const CONFIG = resolve(dirname(fileURLToPath(import.meta.url)), "../../../../config/unit-costs.yaml");

interface UnitCosts {
  api_prices_usd: { places_search: number; places_details: number; pagespeed: number };
  infra_monthly_usd: Record<string, number>;
  automation_usage_usd: { twilio_sms_each: number; est_sms_per_client_month: number; email_per_client_month: number };
  operator: { hourly_rate_usd: number; est_hours_demo: number; est_hours_close: number; est_hours_maintenance_month: number };
  targets: { gross_margin: number; funnel_reply_rate: number; funnel_close_rate: number };
}

export function loadUnitCosts(): UnitCosts {
  return parse(readFileSync(CONFIG, "utf8")) as UnitCosts;
}

export interface LeadCost {
  leadId: string;
  llm_usd_measured: number;
  places_usd_measured: number;
  operator_usd_estimated: number;
  total_usd: number;
}

/** Real cost of one lead so far: measured LLM spend + metered API calls priced at list. */
export async function costOfLead(leadId: string): Promise<LeadCost> {
  const u = loadUnitCosts();
  const pool = getPool();
  const llm = await pool.query<{ s: string | null }>(
    "select coalesce(sum(cost_usd),0)::text as s from agent_events where lead_id = $1 and cost_usd is not null",
    [leadId],
  );
  const places = await pool.query<{ searches: string; details: string }>(
    `select count(*) filter (where message like 'searchText%')::text as searches,
            count(*) filter (where message like 'details%')::text as details
     from agent_events where lead_id = $1 and type = 'places.call'`,
    [leadId],
  );
  // research-phase search calls are not lead-attributed; allocate the average share below instead
  const llmUsd = parseFloat(llm.rows[0].s ?? "0");
  const placesUsd =
    parseInt(places.rows[0].details, 10) * u.api_prices_usd.places_details +
    parseInt(places.rows[0].searches, 10) * u.api_prices_usd.places_search;
  const operatorUsd = u.operator.est_hours_demo * u.operator.hourly_rate_usd;
  return {
    leadId,
    llm_usd_measured: round4(llmUsd),
    places_usd_measured: round4(placesUsd),
    operator_usd_estimated: round4(operatorUsd),
    total_usd: round4(llmUsd + placesUsd + operatorUsd),
  };
}

export interface FunnelEconomics {
  window_days: number;
  leads_discovered: number;
  leads_qualified: number;
  demos_built: number;
  contacted: number;
  replied: number;
  closed_won: number;
  measured: { llm_usd: number; places_usd: number };
  reply_rate: { value: number; basis: "measured" | "benchmark" };
  close_rate: { value: number; basis: "measured" | "benchmark" };
  cost_per_qualified_usd: number | null;
  cost_per_demo_usd: number | null;
  est_cost_per_close_usd: number | null; // pipeline cost + operator close time, at current rates
}

export async function funnelEconomics(windowDays = 30): Promise<FunnelEconomics> {
  const u = loadUnitCosts();
  const pool = getPool();
  const since = `now() - interval '${windowDays} days'`;

  const counts = await pool.query<Record<string, string>>(`
    select
      (select count(*) from leads where source <> 'mock' and created_at >= ${since}) as discovered,
      (select count(*) from leads where source <> 'mock' and score is not null and created_at >= ${since} and score >= 60) as qualified,
      (select count(*) from builds b join leads l on l.id = b.lead_id where l.source <> 'mock' and b.kind='demo' and b.status='deployed' and b.created_at >= ${since}) as demos,
      (select count(*) from leads where source <> 'mock' and status in ('contacted','replied','negotiating','meeting_booked','closed_won','nurture') and updated_at >= ${since}) as contacted,
      (select count(*) from leads where source <> 'mock' and status in ('replied','negotiating','meeting_booked','closed_won') and updated_at >= ${since}) as replied,
      (select count(*) from leads where source <> 'mock' and status = 'closed_won' and updated_at >= ${since}) as closed
  `);
  const c = counts.rows[0];
  const spend = await pool.query<{ llm: string; searches: string; details: string }>(`
    select coalesce(sum(cost_usd),0)::text as llm,
           count(*) filter (where type='places.call' and message like 'searchText%')::text as searches,
           count(*) filter (where type='places.call' and message like 'details%')::text as details
    from agent_events where created_at >= ${since}
  `);
  const llmUsd = parseFloat(spend.rows[0].llm);
  const placesUsd =
    parseInt(spend.rows[0].searches, 10) * u.api_prices_usd.places_search +
    parseInt(spend.rows[0].details, 10) * u.api_prices_usd.places_details;

  const contacted = parseInt(c.contacted, 10);
  const replied = parseInt(c.replied, 10);
  const closed = parseInt(c.closed, 10);
  const qualified = parseInt(c.qualified, 10);
  const demos = parseInt(c.demos, 10);

  // measured rates only when the sample is honest (contract §9: never dress it up)
  const replyRate =
    contacted >= 100
      ? { value: round4(replied / contacted), basis: "measured" as const }
      : { value: u.targets.funnel_reply_rate, basis: "benchmark" as const };
  const closeRate =
    replied >= 20
      ? { value: round4(closed / Math.max(replied, 1)), basis: "measured" as const }
      : { value: u.targets.funnel_close_rate, basis: "benchmark" as const };

  const pipelineUsd = llmUsd + placesUsd;
  const perDemoPipeline = demos > 0 ? pipelineUsd / demos : null;
  // demos needed per close = 1 / (reply * close); each close also costs operator close-hours
  const demosPerClose = 1 / (replyRate.value * closeRate.value);
  const estCostPerClose =
    perDemoPipeline != null
      ? (perDemoPipeline + u.operator.est_hours_demo * u.operator.hourly_rate_usd) * demosPerClose +
        u.operator.est_hours_close * u.operator.hourly_rate_usd
      : null;

  return {
    window_days: windowDays,
    leads_discovered: parseInt(c.discovered, 10),
    leads_qualified: qualified,
    demos_built: demos,
    contacted,
    replied,
    closed_won: closed,
    measured: { llm_usd: round4(llmUsd), places_usd: round4(placesUsd) },
    reply_rate: replyRate,
    close_rate: closeRate,
    cost_per_qualified_usd: qualified > 0 ? round4(pipelineUsd / qualified) : null,
    cost_per_demo_usd: perDemoPipeline != null ? round4(perDemoPipeline) : null,
    est_cost_per_close_usd: estCostPerClose != null ? round2(estCostPerClose) : null,
  };
}

export interface PricingFloors {
  monthly_cost_to_serve_site_usd: number;
  monthly_cost_to_serve_full_stack_usd: number;
  retainer_floor_site_usd: number;       // cost-to-serve / (1 - margin)
  retainer_floor_full_stack_usd: number;
  setup_floor_usd: number | null;         // recover acquisition + build at margin
  assumptions: string[];
}

export async function pricingFloors(): Promise<PricingFloors> {
  const u = loadUnitCosts();
  const f = await funnelEconomics(30);
  const infra = Object.values(u.infra_monthly_usd).reduce((a, b) => a + b, 0);
  const maintain = u.operator.est_hours_maintenance_month * u.operator.hourly_rate_usd;
  const siteServe = infra + maintain;
  const automationUsage =
    u.automation_usage_usd.twilio_sms_each * u.automation_usage_usd.est_sms_per_client_month +
    u.automation_usage_usd.email_per_client_month;
  const fullServe = siteServe + automationUsage + maintain; // automation adds its own attention
  const margin = u.targets.gross_margin;
  return {
    monthly_cost_to_serve_site_usd: round2(siteServe),
    monthly_cost_to_serve_full_stack_usd: round2(fullServe),
    retainer_floor_site_usd: round2(siteServe / (1 - margin)),
    retainer_floor_full_stack_usd: round2(fullServe / (1 - margin)),
    setup_floor_usd: f.est_cost_per_close_usd != null ? round2(f.est_cost_per_close_usd / (1 - margin)) : null,
    assumptions: [
      `gross margin target ${margin * 100}%`,
      `operator rate $${u.operator.hourly_rate_usd}/h (config/unit-costs.yaml)`,
      `reply rate ${f.reply_rate.value} (${f.reply_rate.basis}), close rate ${f.close_rate.value} (${f.close_rate.basis})`,
      "infra allocations per client from config/unit-costs.yaml",
    ],
  };
}

const round4 = (n: number) => Math.round(n * 10000) / 10000;
const round2 = (n: number) => Math.round(n * 100) / 100;
