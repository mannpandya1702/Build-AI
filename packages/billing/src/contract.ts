// Programmatic contract generation (MASTER_SPEC §4, §14 Phase 3). A contract with a blank field or
// pricing that contradicts the ladder is IMPOSSIBLE to generate — generateContract validates every
// input and the rendered output, throwing ContractValidationError with the exact reasons. The IP
// clause is fixed: client owns their deliverables, the agency owns the platform (never the ClinicPro
// clause that assigns platform IP to the client).
import { type Pricing, isRangeProduct, loadPricing } from "./pricing.js";

export const EXPECTED_IP_CLAUSE = "client_owns_deliverables_agency_owns_platform";
const IP_CLAUSE_TEXT =
  "Client owns their website, content, data, and configurations. The Agency retains all right, " +
  "title, and interest in the platform, templates, block library, and skills, licensed to the " +
  "Client for the term. No platform intellectual property transfers to the Client.";

export interface ContractInput {
  client: { name: string; address: string };
  agency: { name: string; address: string };
  productKey: string;
  setupUsd: number;
  monthlyUsd: number;
  termMonths?: number;
}

export class ContractValidationError extends Error {
  constructor(public reasons: string[]) {
    super(`contract cannot be generated: ${reasons.join("; ")}`);
    this.name = "ContractValidationError";
  }
}

export interface GeneratedContract {
  productName: string;
  setupUsd: number;
  monthlyUsd: number;
  markdown: string;
}

function money(n: number): string {
  return `$${n.toLocaleString("en-US")}`;
}

export function generateContract(input: ContractInput, pricing: Pricing = loadPricing()): GeneratedContract {
  const reasons: string[] = [];

  // 1) No blank required fields.
  if (!input.client?.name?.trim()) reasons.push("client name is blank");
  if (!input.client?.address?.trim()) reasons.push("client address is blank");
  if (!input.agency?.name?.trim()) reasons.push("agency name is blank");
  if (!input.agency?.address?.trim()) reasons.push("agency address is blank");

  // 2) Known product.
  const product = pricing.products[input.productKey];
  if (!product) {
    reasons.push(`unknown product '${input.productKey}'`);
    throw new ContractValidationError(reasons); // can't price-check without a product
  }

  // 3) Pricing must match the ladder (fixed) or fall inside the range (high-ticket).
  if (isRangeProduct(product)) {
    if (input.setupUsd < product.setup_min || input.setupUsd > product.setup_max)
      reasons.push(
        `setup ${money(input.setupUsd)} outside ${money(product.setup_min)}–${money(product.setup_max)}`,
      );
    if (input.monthlyUsd < product.monthly_min || input.monthlyUsd > product.monthly_max)
      reasons.push(
        `monthly ${money(input.monthlyUsd)} outside ${money(product.monthly_min)}–${money(product.monthly_max)}`,
      );
  } else {
    const setupOk =
      input.setupUsd === product.setup || (product.setup_waived_with_website && input.setupUsd === 0);
    if (!setupOk) reasons.push(`setup ${money(input.setupUsd)} contradicts ladder ${money(product.setup)}`);
    if (input.monthlyUsd !== product.monthly)
      reasons.push(`monthly ${money(input.monthlyUsd)} contradicts ladder ${money(product.monthly)}`);
  }

  // 4) IP clause guard — refuse to generate under the wrong ownership model.
  if (pricing.contract.ip_clause !== EXPECTED_IP_CLAUSE)
    reasons.push(
      `refusing: configured IP clause '${pricing.contract.ip_clause}' is not the agency-owns-platform clause`,
    );

  if (reasons.length > 0) throw new ContractValidationError(reasons);

  const g = pricing.contract.guarantees;
  const term = input.termMonths ?? 12;
  const markdown = [
    `# Service Agreement — ${product.name}`,
    "",
    `**Agency:** ${input.agency.name}, ${input.agency.address}`,
    `**Client:** ${input.client.name}, ${input.client.address}`,
    "",
    "## 1. Services",
    product.includes,
    "",
    "## 2. Fees",
    `- One-time setup: ${money(input.setupUsd)}`,
    `- Monthly: ${money(input.monthlyUsd)}`,
    ...("included_minutes" in product && product.included_minutes
      ? [
          `- Included minutes: ${product.included_minutes}/mo${"overage_per_minute" in product && product.overage_per_minute ? ` (overage ${money(product.overage_per_minute)}/min)` : ""}`,
        ]
      : []),
    `- Setup fees are ${pricing.contract.setup_nonrefundable_after_delivery ? "non-refundable after delivery" : "refundable per terms"}.`,
    "",
    "## 3. Guarantees",
    `- Uptime: ${g.uptime_pct}%`,
    `- Speed-to-lead response: under ${g.speed_to_lead_seconds} seconds`,
    "Backed by service credits, proven monthly from system telemetry (measured numbers only).",
    "",
    "## 4. Ownership",
    IP_CLAUSE_TEXT,
    "",
    "## 5. Term & Termination",
    `- Term: ${term} months.`,
    `- Either party may terminate with ${pricing.contract.termination_notice_days} days written notice.`,
  ].join("\n");

  // 5) Rendered-output guard: no unresolved placeholder / NaN may reach a client.
  if (/\[NEEDS|\[BLANK|undefined|NaN|\$NaN/.test(markdown))
    throw new ContractValidationError(["rendered contract contains an unresolved value"]);

  return { productName: product.name, setupUsd: input.setupUsd, monthlyUsd: input.monthlyUsd, markdown };
}
