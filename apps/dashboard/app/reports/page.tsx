"use client";

// /reports (spec §8.7): pipeline funnel + spend trend + unit economics. Chart types per the
// ui-ux-pro-max skill: Funnel (conversion % per stage, biggest drop highlighted) and Area for spend.
// Hand-built SVG/CSS (skill's "Custom SVG" + "linear list fallback" guidance) to stay dependency-light.
import { useEffect, useState } from "react";
import { Card, SectionTitle, StatTile, Empty } from "@/components/ui";

interface Report {
  funnel: { stage: string; count: number }[];
  spend: { day: string; usd: number }[];
  tiles: { total_spend: number; cost_per_demo: number; cost_per_qualified: number; demos_deployed: number; qualified: number; reply_rate: number };
}

function Funnel({ data }: { data: { stage: string; count: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.count));
  // biggest drop = largest proportional fall between consecutive non-zero stages (skill: highlight it)
  let worst = -1, worstDrop = 0;
  for (let i = 1; i < data.length; i++) {
    if (data[i - 1].count > 0) {
      const drop = 1 - data[i].count / data[i - 1].count;
      if (drop > worstDrop) { worstDrop = drop; worst = i; }
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
            <span className="w-24 shrink-0 text-right text-zinc-400">{d.stage}</span>
            <div className="relative h-7 flex-1 overflow-hidden rounded bg-zinc-900">
              <div className={`flex h-full items-center rounded ${isDrop ? "bg-amber-500/30" : "bg-sky-500/25"}`} style={{ width: `${Math.max(2, (d.count / max) * 100)}%` }}>
                <span className="px-2 text-xs font-semibold tabular-nums text-zinc-100">{d.count}</span>
              </div>
            </div>
            <span className={`w-16 shrink-0 text-right text-xs tabular-nums ${isDrop ? "font-semibold text-amber-400" : "text-zinc-500"}`}>
              {conv != null ? `${conv}%` : "—"}
            </span>
          </div>
        );
      })}
      {worst > 0 && <p className="pt-1 text-xs text-amber-400/80">Biggest drop-off: {data[worst - 1].stage} → {data[worst].stage}</p>}
    </div>
  );
}

function SpendArea({ data }: { data: { day: string; usd: number }[] }) {
  if (data.length < 2) return <Empty>not enough spend history yet</Empty>;
  const w = 560, h = 120, pad = 6;
  const max = Math.max(0.01, ...data.map((d) => d.usd));
  const x = (i: number) => pad + (i / (data.length - 1)) * (w - 2 * pad);
  const y = (v: number) => h - pad - (v / max) * (h - 2 * pad);
  const line = data.map((d, i) => `${x(i)},${y(d.usd)}`).join(" ");
  const area = `${x(0)},${h - pad} ${line} ${x(data.length - 1)},${h - pad}`;
  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full min-w-[420px]">
        <polygon points={area} fill="rgb(56 189 248 / 0.15)" />
        <polyline points={line} fill="none" stroke="rgb(56 189 248)" strokeWidth="2" />
        {data.map((d, i) => <circle key={i} cx={x(i)} cy={y(d.usd)} r="2" fill="rgb(56 189 248)" />)}
      </svg>
      <div className="flex justify-between text-[10px] text-zinc-600">
        <span>{data[0].day}</span><span>${max.toFixed(2)} max/day</span><span>{data[data.length - 1].day}</span>
      </div>
    </div>
  );
}

export default function ReportsPage() {
  const [r, setR] = useState<Report | null>(null);
  useEffect(() => {
    let live = true;
    const tick = async () => { const res = await fetch("/api/reports", { cache: "no-store" }); if (res.ok) { const d = await res.json(); if (live) setR(d); } };
    tick();
    const t = setInterval(tick, 5000);
    return () => { live = false; clearInterval(t); };
  }, []);
  if (!r) return <div className="animate-pulse text-sm text-zinc-600">Loading reports…</div>;

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-xl font-bold">Reports</h1>
      <p className="mt-1 text-sm text-zinc-500">Funnel, spend, and unit economics from live pipeline data.</p>

      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile label="AI spend" value={`$${r.tiles.total_spend.toFixed(2)}`} tone="amber" />
        <StatTile label="Cost / demo" value={`$${r.tiles.cost_per_demo.toFixed(2)}`} sub={`${r.tiles.demos_deployed} demos`} tone="sky" />
        <StatTile label="Cost / qualified" value={`$${r.tiles.cost_per_qualified.toFixed(2)}`} sub={`${r.tiles.qualified} qualified`} />
        <StatTile label="Reply rate" value={`${Math.round(r.tiles.reply_rate * 100)}%`} tone="emerald" />
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card className="p-4"><SectionTitle>Pipeline funnel</SectionTitle><div className="mt-4"><Funnel data={r.funnel} /></div></Card>
        <Card className="p-4"><SectionTitle>AI spend (14 days)</SectionTitle><div className="mt-4"><SpendArea data={r.spend} /></div></Card>
      </div>
    </div>
  );
}
