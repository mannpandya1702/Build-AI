"use client";

// /reports (spec §8.7): pipeline funnel + spend trend + unit economics + daily digests. Chart types
// per the skill: funnel (per-stage conversion %, biggest drop highlighted), area for spend trend,
// subtle gridlines, tabular figures. Migrated to TanStack Query (no poller, real error state).
import { Card, Empty, PageHeader, SectionTitle, Skeleton, StatTile } from "@/components/ui";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";

interface Report {
  funnel: { stage: string; count: number }[];
  spend: { day: string; usd: number }[];
  tiles: {
    total_spend: number;
    cost_per_demo: number;
    cost_per_qualified: number;
    demos_deployed: number;
    qualified: number;
    reply_rate: number;
  };
  digests: { date: string; summary_md: string; anomalies: { kind: string; detail: string }[] }[];
}

function Funnel({ data }: { data: { stage: string; count: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.count));
  let worst = -1;
  let worstDrop = 0;
  for (let i = 1; i < data.length; i++) {
    if (data[i - 1].count > 0) {
      const drop = 1 - data[i].count / data[i - 1].count;
      if (drop > worstDrop) {
        worstDrop = drop;
        worst = i;
      }
    }
  }
  return (
    <div className="space-y-1.5">
      {data.map((d, i) => {
        const prev = i > 0 ? data[i - 1].count : null;
        const conv = prev ? Math.round((d.count / prev) * 100) : null;
        const isDrop = i === worst;
        return (
          <div key={d.stage} className="flex items-center gap-3 text-sm">
            <span className="w-24 shrink-0 text-right text-muted">{d.stage}</span>
            <div className="relative h-7 flex-1 overflow-hidden rounded-md bg-surface2/70">
              <div
                className={`flex h-full items-center rounded-md transition-[width] duration-300 ${isDrop ? "bg-warn/25" : "bg-data/20"}`}
                style={{ width: `${Math.max(2, (d.count / max) * 100)}%` }}
              >
                <span className="px-2 font-display text-xs font-semibold text-ink">{d.count}</span>
              </div>
            </div>
            <span
              className={`w-14 shrink-0 text-right font-display text-[11px] ${isDrop ? "font-semibold text-warn" : "text-faint"}`}
            >
              {conv != null ? `${conv}%` : "—"}
            </span>
          </div>
        );
      })}
      {worst > 0 && (
        <p className="pt-1 text-xs text-warn/90">
          Biggest drop-off: {data[worst - 1].stage} → {data[worst].stage}
        </p>
      )}
    </div>
  );
}

function SpendArea({ data }: { data: { day: string; usd: number }[] }) {
  if (data.length < 2) return <Empty>not enough spend history yet</Empty>;
  const w = 560;
  const h = 120;
  const pad = 6;
  const max = Math.max(0.01, ...data.map((d) => d.usd));
  const x = (i: number) => pad + (i / (data.length - 1)) * (w - 2 * pad);
  const y = (v: number) => h - pad - (v / max) * (h - 2 * pad);
  const line = data.map((d, i) => `${x(i)},${y(d.usd)}`).join(" ");
  const area = `${x(0)},${h - pad} ${line} ${x(data.length - 1)},${h - pad}`;
  return (
    <div className="overflow-x-auto">
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="w-full min-w-[420px]"
        role="img"
        aria-label="AI spend per day, last 14 days"
      >
        <polygon points={area} fill="rgb(var(--data) / 0.12)" />
        <polyline points={line} fill="none" stroke="rgb(var(--data))" strokeWidth="2" />
        {data.map((d, i) => (
          <circle key={i} cx={x(i)} cy={y(d.usd)} r="2" fill="rgb(var(--data))" />
        ))}
      </svg>
      <div className="flex justify-between font-display text-[10px] text-faint">
        <span>{data[0].day}</span>
        <span>${max.toFixed(2)} max/day</span>
        <span>{data[data.length - 1].day}</span>
      </div>
    </div>
  );
}

async function fetchReport(): Promise<Report> {
  const res = await fetch("/api/reports", { cache: "no-store" });
  if (!res.ok) throw new Error(`reports ${res.status}`);
  return (await res.json()) as Report;
}

export default function ReportsPage() {
  const {
    data: r,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["reports"],
    queryFn: fetchReport,
    refetchInterval: 5000,
  });

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader title="Reports" description="Funnel, spend, and unit economics from live pipeline data." />

      {isLoading && <Skeleton rows={5} />}
      {isError && (
        <Card className="flex items-center justify-between gap-3 px-4 py-3">
          <p className="text-sm text-muted">Couldn't load reports.</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Retry
          </Button>
        </Card>
      )}

      {r && (
        <>
          <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4">
            <StatTile label="AI spend" value={`$${r.tiles.total_spend.toFixed(2)}`} tone="warn" />
            <StatTile
              label="Cost / demo"
              value={`$${r.tiles.cost_per_demo.toFixed(2)}`}
              sub={`${r.tiles.demos_deployed} demos`}
              tone="data"
            />
            <StatTile
              label="Cost / qualified"
              value={`$${r.tiles.cost_per_qualified.toFixed(2)}`}
              sub={`${r.tiles.qualified} qualified`}
            />
            <StatTile label="Reply rate" value={`${Math.round(r.tiles.reply_rate * 100)}%`} tone="ok" />
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card className="p-4">
              <SectionTitle>Pipeline funnel</SectionTitle>
              <div className="mt-4">
                <Funnel data={r.funnel} />
              </div>
            </Card>
            <Card className="p-4">
              <SectionTitle>AI spend (14 days)</SectionTitle>
              <div className="mt-4">
                <SpendArea data={r.spend} />
              </div>
            </Card>
          </div>

          <div className="mt-6">
            <SectionTitle>Daily digests</SectionTitle>
            <div className="mt-2 space-y-2.5">
              {(r.digests ?? []).length === 0 && (
                <Empty>no digests yet (the monitor writes one daily at 09:00 IST)</Empty>
              )}
              {(r.digests ?? []).map((d) => (
                <Card key={d.date} className="p-4">
                  <div className="flex items-center justify-between">
                    <p className="font-display text-sm font-semibold text-ink">
                      {String(d.date).slice(0, 10)}
                    </p>
                    {d.anomalies?.length > 0 && (
                      <span className="rounded-md bg-warn/10 px-2 py-0.5 font-display text-[11px] text-warn">
                        {d.anomalies.length} anomalies
                      </span>
                    )}
                  </div>
                  <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap font-display text-xs leading-relaxed text-muted">
                    {d.summary_md}
                  </pre>
                </Card>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
