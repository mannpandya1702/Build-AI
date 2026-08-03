// /delivery (MASTER_SPEC §7.5): the retention engine — the monthly value report + auto SLA credits.
// "Honesty is the moat": the client-facing report shows ONLY measured numbers; anything allocated or
// estimated is withheld. Server component, force-static — the report + credit calc are pure functions
// (no I/O), rendered at build from a labeled sample.
import { Card, PageHeader, SectionTitle } from "@/components/ui";
import { type Metric, computeSlaCredits, generateValueReport } from "@autopilot/delivery";

export const dynamic = "force-static";

// A labeled SAMPLE month: five measured metrics + two non-measured, so the report visibly withholds
// what it can't prove from telemetry. Real reports are built from the client's own system data.
const SAMPLE_METRICS: Metric[] = [
  { label: "New leads captured", value: 47, tag: "measured" },
  { label: "Calls answered by the assistant", value: 128, tag: "measured" },
  { label: "Missed-call texts sent", value: 34, tag: "measured" },
  { label: "Review requests sent", value: 22, tag: "measured" },
  { label: "Avg speed-to-lead", value: 41, unit: "sec", tag: "measured" },
  { label: "Estimated revenue influenced", value: 18400, unit: "USD", tag: "allocated" },
  { label: "Projected annual ROI", value: 6.2, unit: "x", tag: "estimated" },
];

const report = generateValueReport({
  clientName: "Sample Client",
  periodLabel: "July 2026",
  metrics: SAMPLE_METRICS,
});

// A sample BAD month: uptime under the 99.5% guarantee and speed-to-lead p95 over 60s → auto credit.
const SLA = computeSlaCredits(
  { uptimePct: 99.1, speedToLeadP95Sec: 74 },
  { uptimePct: 99.5, speedToLeadSeconds: 60 },
  397, // representative monthly fee
);

export default function DeliveryPage() {
  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Delivery"
        description="The retention engine: a monthly value report proving results from telemetry, and automatic SLA credits when a guarantee is missed. This is what the retainer is worth."
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="p-4">
          <div className="flex items-center justify-between gap-2">
            <SectionTitle>Monthly value report</SectionTitle>
            {report.excludedCount > 0 && (
              <span className="shrink-0 rounded-md bg-warn/10 px-2 py-0.5 font-display text-[11px] text-warn">
                {report.excludedCount} withheld
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-faint">
            Only measured numbers are shown. {report.excludedCount} allocated/estimated figure
            {report.excludedCount === 1 ? " was" : "s were"} withheld — the client never sees a number we
            can't prove.
          </p>
          <div className="mt-3 space-y-1.5">
            {report.lines.map((l) => (
              <div
                key={l.label}
                className="flex items-center justify-between gap-3 border-b border-line/60 pb-1.5 text-sm"
              >
                <span className="text-muted">{l.label}</span>
                <span className="font-display text-[13px] font-semibold text-ink">{l.display}</span>
              </div>
            ))}
          </div>
        </Card>

        <div className="space-y-4">
          <Card className="p-4">
            <div className="flex items-center justify-between gap-2">
              <SectionTitle>Auto SLA credits (sample bad month)</SectionTitle>
              <span className="shrink-0 font-display text-lg font-semibold text-danger">
                {SLA.totalCreditPct}% · ${SLA.totalCreditUsd.toFixed(2)}
              </span>
            </div>
            <div className="mt-3 space-y-1.5">
              {SLA.credits.length === 0 ? (
                <p className="text-sm text-ok">All guarantees met — no credit owed.</p>
              ) : (
                SLA.credits.map((c) => (
                  <div key={c.reason} className="flex items-start gap-2 text-sm">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-danger" aria-hidden />
                    <span className="text-muted">
                      {c.reason} <span className="text-faint">(+{c.creditPct}% credit)</span>
                    </span>
                  </div>
                ))
              )}
            </div>
            <p className="mt-3 font-display text-[11px] text-faint">
              Computed automatically from telemetry: 10% of the monthly fee per missed guarantee, capped at
              50% so a bad month never exceeds the fee.
            </p>
          </Card>

          <Card className="p-4">
            <SectionTitle>Why this protects the retainer</SectionTitle>
            <ul className="mt-2 space-y-1.5 text-sm text-muted">
              <li>A monthly report of real results makes the fee obviously worth keeping.</li>
              <li>Withholding unprovable numbers builds the trust that lowers churn.</li>
              <li>Owning a miss with an automatic credit turns a bad month into a reason to stay.</li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
