"use client";

// /pipeline (spec §8.1): kanban by lead status. Poll-based locally; Realtime in production.
import { useEffect, useState } from "react";
import Link from "next/link";

interface LeadCard {
  id: string;
  company_name: string;
  slug: string | null;
  industry: string | null;
  city: string | null;
  region: string | null;
  status: string;
  score: number | null;
  seconds_in_stage: number;
}

const COLUMNS: readonly string[] = [
  "discovered",
  "enriched",
  "qualified",
  "analyzed",
  "solution_ready",
  "design_ready",
  "demo_building",
  "demo_qa",
  "outreach_ready",
  "awaiting_approval",
  "contacted",
  "replied",
  "negotiating",
  "meeting_booked",
  "closed_won",
  "final_building",
  "final_qa",
  "delivery_approval",
  "delivered",
  "nurture",
  "disqualified",
  "closed_lost",
  "suppressed",
];

function age(seconds: number): string {
  if (seconds < 90) return `${Math.round(seconds)}s`;
  if (seconds < 5400) return `${Math.round(seconds / 60)}m`;
  if (seconds < 129600) return `${Math.round(seconds / 3600)}h`;
  return `${Math.round(seconds / 86400)}d`;
}

export default function PipelinePage() {
  const [leads, setLeads] = useState<LeadCard[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let live = true;
    const tick = async () => {
      const res = await fetch("/api/leads", { cache: "no-store" });
      const data = await res.json();
      if (live) setLeads(data.leads);
    };
    tick();
    const t = setInterval(tick, 2000);
    return () => {
      live = false;
      clearInterval(t);
    };
  }, []);

  async function runMockLead() {
    setBusy(true);
    await fetch("/api/dev/run-mock-lead", { method: "POST" });
    setBusy(false);
  }

  async function discover() {
    setBusy(true);
    const count = parseInt(prompt("How many leads to discover?", "50") ?? "0", 10);
    if (count > 0) {
      await fetch("/api/dev/discover", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ count }),
      });
    }
    setBusy(false);
  }

  const byStatus = new Map<string, LeadCard[]>();
  for (const l of leads) {
    const arr = byStatus.get(l.status) ?? [];
    arr.push(l);
    byStatus.set(l.status, arr);
  }
  const visible = COLUMNS.filter((c) => (byStatus.get(c) ?? []).length > 0);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Pipeline</h1>
          <p className="mt-1 text-sm text-zinc-500">{leads.length} leads. Columns appear as leads reach them.</p>
        </div>
        <div className="flex gap-2">
        <button
          onClick={discover}
          disabled={busy}
          className="rounded-md bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-500 disabled:opacity-50"
        >
          Discover leads
        </button>
        <button
          onClick={runMockLead}
          disabled={busy}
          className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
        >
          {busy ? "Working..." : "Run mock lead"}
        </button>
        </div>
      </div>

      <div className="mt-6 flex gap-3 overflow-x-auto pb-4">
        {visible.length === 0 && <p className="text-sm text-zinc-600">No leads yet. Click "Run mock lead".</p>}
        {visible.map((col) => (
          <div key={col} className="w-60 shrink-0 rounded-lg border border-zinc-800 bg-zinc-900/40">
            <p className="border-b border-zinc-800 px-3 py-2 text-xs font-bold uppercase tracking-wide text-zinc-400">
              {col.replace(/_/g, " ")} <span className="text-zinc-600">({(byStatus.get(col) ?? []).length})</span>
            </p>
            <div className="space-y-2 p-2">
              {(byStatus.get(col) ?? []).map((l) => (
                <Link
                  key={l.id}
                  href={`/leads/${l.id}`}
                  className="block rounded-md border border-zinc-800 bg-zinc-950 p-3 hover:border-zinc-600"
                >
                  <p className="text-sm font-semibold text-zinc-100">{l.company_name}</p>
                  <p className="mt-1 text-xs text-zinc-500">
                    {l.industry ?? "?"} · {l.city ?? "?"}, {l.region ?? "?"}
                  </p>
                  <p className="mt-1 flex justify-between text-xs">
                    <span className="text-zinc-400">{l.score != null ? `score ${l.score}` : "unscored"}</span>
                    <span className="text-zinc-600">{age(l.seconds_in_stage)} in stage</span>
                  </p>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
