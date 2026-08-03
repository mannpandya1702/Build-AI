// CLI: `pnpm --filter @autopilot/worker finance` — the financer's report for the operator.
import { funnelEconomics, loadUnitCosts, pricingFloors } from "@autopilot/agents";
import { closePool } from "@autopilot/core";

const f = await funnelEconomics(30);
const p = await pricingFloors();
const u = loadUnitCosts();

console.log("=== FINANCE REPORT (last 30 days) ===");
console.log(
  `funnel: ${f.leads_discovered} discovered -> ${f.leads_qualified} qualified -> ${f.demos_built} demos -> ${f.contacted} contacted -> ${f.replied} replied -> ${f.closed_won} closed`,
);
console.log(`measured spend: llm $${f.measured.llm_usd} | places $${f.measured.places_usd}`);
console.log(
  `cost per qualified lead: ${f.cost_per_qualified_usd != null ? `$${f.cost_per_qualified_usd}` : "n/a"} (measured)`,
);
console.log(
  `cost per demo (pipeline): ${f.cost_per_demo_usd != null ? `$${f.cost_per_demo_usd}` : "n/a (no demos in window)"}`,
);
console.log(
  `est. all-in cost per CLOSE: ${f.est_cost_per_close_usd != null ? `$${f.est_cost_per_close_usd}` : "n/a"} (reply ${f.reply_rate.value} ${f.reply_rate.basis}, close ${f.close_rate.value} ${f.close_rate.basis})`,
);
console.log("");
console.log(`=== PRICING FLOORS (at ${u.targets.gross_margin * 100}% target margin) ===`);
console.log(
  `site retainer floor:       $${p.retainer_floor_site_usd}/mo   (cost to serve $${p.monthly_cost_to_serve_site_usd}/mo)`,
);
console.log(
  `full-stack retainer floor: $${p.retainer_floor_full_stack_usd}/mo   (cost to serve $${p.monthly_cost_to_serve_full_stack_usd}/mo)`,
);
console.log(
  `setup fee floor:           ${p.setup_floor_usd != null ? `$${p.setup_floor_usd}` : "n/a until demos flow"}`,
);
console.log("");
console.log(`assumptions: ${p.assumptions.join(" | ")}`);
await closePool();
