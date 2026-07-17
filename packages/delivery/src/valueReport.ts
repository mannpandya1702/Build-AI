// Monthly value report (MASTER_SPEC §7.5, §14 Phase 8). "Honesty is the moat" (§2): every number
// carries a measured|allocated|estimated tag, and the client-facing report includes ONLY `measured`
// numbers. Anything else is excluded, never shown. The AC is literal: a generated report contains
// zero estimated numbers. Pure + tested.

export type MetricTag = "measured" | "allocated" | "estimated";

export interface Metric {
  label: string;
  value: number;
  unit?: string;
  tag: MetricTag;
}

export interface ValueReportInput {
  clientName: string;
  periodLabel: string; // e.g. "July 2026"
  metrics: readonly Metric[];
}

export interface ValueReport {
  clientName: string;
  periodLabel: string;
  /** rendered lines (measured metrics only) */
  lines: { label: string; display: string }[];
  markdown: string;
  /** how many non-measured metrics were withheld */
  excludedCount: number;
}

function fmt(m: Metric): string {
  const n = Number.isInteger(m.value) ? m.value.toLocaleString("en-US") : m.value.toFixed(1);
  return m.unit ? `${n} ${m.unit}` : n;
}

export function generateValueReport(input: ValueReportInput): ValueReport {
  const measured = input.metrics.filter((m) => m.tag === "measured");
  const excludedCount = input.metrics.length - measured.length;

  const lines = measured.map((m) => ({ label: m.label, display: fmt(m) }));
  const markdown = [
    `# ${input.clientName} — Results, ${input.periodLabel}`,
    "",
    "Every number below is measured from your system's own telemetry.",
    "",
    ...lines.map((l) => `- **${l.label}:** ${l.display}`),
  ].join("\n");

  return { clientName: input.clientName, periodLabel: input.periodLabel, lines, markdown, excludedCount };
}
