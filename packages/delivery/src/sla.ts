// SLA credit computation (MASTER_SPEC §7.5). When a guaranteed threshold is missed, a service credit
// is computed automatically from MEASURED telemetry (uptime %, speed-to-lead p95). Trust compounds;
// churn drops. Pure + tested.

export interface SlaThresholds {
  uptimePct: number; // e.g. 99.5
  speedToLeadSeconds: number; // e.g. 60 (p95)
}

export interface SlaMeasured {
  uptimePct?: number;
  speedToLeadP95Sec?: number;
}

export interface SlaCredit {
  reason: string;
  creditPct: number; // percent of the monthly fee
}

export interface SlaCreditResult {
  credits: SlaCredit[];
  totalCreditPct: number;
  totalCreditUsd: number;
}

// Credit policy: each missed SLA earns a flat credit; the total is capped so a bad month never
// exceeds the monthly fee. Simple, defensible, and easy for a client to understand.
const CREDIT_PER_MISS_PCT = 10;
const MAX_TOTAL_CREDIT_PCT = 50;

export function computeSlaCredits(
  measured: SlaMeasured,
  thresholds: SlaThresholds,
  monthlyUsd: number,
): SlaCreditResult {
  const credits: SlaCredit[] = [];

  if (typeof measured.uptimePct === "number" && measured.uptimePct < thresholds.uptimePct) {
    credits.push({
      reason: `uptime ${measured.uptimePct}% below the ${thresholds.uptimePct}% guarantee`,
      creditPct: CREDIT_PER_MISS_PCT,
    });
  }
  if (
    typeof measured.speedToLeadP95Sec === "number" &&
    measured.speedToLeadP95Sec > thresholds.speedToLeadSeconds
  ) {
    credits.push({
      reason: `speed-to-lead p95 ${measured.speedToLeadP95Sec}s over the ${thresholds.speedToLeadSeconds}s guarantee`,
      creditPct: CREDIT_PER_MISS_PCT,
    });
  }

  const totalCreditPct = Math.min(
    MAX_TOTAL_CREDIT_PCT,
    credits.reduce((s, c) => s + c.creditPct, 0),
  );
  const totalCreditUsd = Math.round(monthlyUsd * totalCreditPct) / 100;
  return { credits, totalCreditPct, totalCreditUsd };
}
