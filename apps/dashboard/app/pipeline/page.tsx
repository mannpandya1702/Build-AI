"use client";

// /pipeline (spec §8.1): kanban by lead status, with search + stage-group filtering (the skill's
// dashboard anti-pattern list literally names "No filtering"). Poll-based locally.
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { PageHeader, SearchInput, FilterChip, Skeleton, Empty, statusTone } from "@/components/ui";

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
  "discovered", "enriched", "qualified", "analyzed", "solution_ready", "design_ready",
  "demo_building", "demo_qa", "outreach_ready", "awaiting_approval", "contacted", "replied",
  "negotiating", "meeting_booked", "closed_won", "final_building", "final_qa",
  "delivery_approval", "delivered", "nurture", "disqualified", "closed_lost", "suppressed",
];

const GROUPS: Record<string, readonly string[]> = {
  All: COLUMNS,
  Sourcing: ["discovered", "enriched", "qualified", "disqualified"],
  Building: ["analyzed", "solution_ready", "design_ready", "demo_building", "demo_qa"],
  Selling: ["outreach_ready", "awaiting_approval", "contacted", "replied", "negotiating", "meeting_booked", "nurture"],
  Won: ["closed_won", "final_building", "final_qa", "delivery_approval", "delivered"],
};

function age(seconds: number): string {
  if (seconds < 90) return `${Math.round(seconds)}s`;
  if (seconds < 5400) return `${Math.round(seconds / 60)}m`;
  if (seconds < 129600) return `${Math.round(seconds / 3600)}h`;
  return `${Math.round(seconds / 86400)}d`;
}

export default function PipelinePage() {
  const [leads, setLeads] = useState<LeadCard[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [devTools, setDevTools] = useState(false);
  const [q, setQ] = useState("");
  const [group, setGroup] = useState<keyof typeof GROUPS>("All");

  useEffect(() => {
    let live = true;
    const tick = async () => {
      const res = await fetch("/api/leads", { cache: "no-store" });
      const data = await res.json();
      if (live) setLeads(data.leads);
    };
    tick();
    const t = setInterval(tick, 2000);
    // dev buttons (mock lead, discovery trigger) render only where dev tools are enabled (local dev):
    // on a hosted deployment they would fabricate data in the production database.
    fetch("/api/dev/enabled").then((r) => r.json()).then((d) => { if (live) setDevTools(Boolean(d.enabled)); }).catch(() => undefined);
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

  const filtered = useMemo(() => {
    if (!leads) return [];
    const needle = q.trim().toLowerCase();
    return leads.filter(
      (l) =>
        GROUPS[group].includes(l.status) &&
        (!needle || l.company_name.toLowerCase().includes(needle) || (l.city ?? "").toLowerCase().includes(needle)),
    );
  }, [leads, q, group]);

  const byStatus = new Map<string, LeadCard[]>();
  for (const l of filtered) {
    const arr = byStatus.get(l.status) ?? [];
    arr.push(l);
    byStatus.set(l.status, arr);
  }
  const visible = COLUMNS.filter((c) => (byStatus.get(c) ?? []).length > 0);

  return (
    <div>
      <PageHeader title="Pipeline" description={leads ? `${leads.length} leads · ${filtered.length} shown` : "loading…"}>
        {devTools && (
          <>
            <button onClick={discover} disabled={busy} className="h-9 cursor-pointer rounded-lg border border-line px-3 text-sm text-muted transition-colors duration-150 hover:bg-surface2 hover:text-ink disabled:opacity-50">
              Discover leads
            </button>
            <button onClick={runMockLead} disabled={busy} className="h-9 cursor-pointer rounded-lg bg-accent px-3 font-display text-sm font-semibold text-accentink transition-opacity duration-150 hover:opacity-90 disabled:opacity-50">
              {busy ? "Working…" : "Run mock lead"}
            </button>
          </>
        )}
      </PageHeader>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <SearchInput value={q} onChange={setQ} placeholder="Search company or city…" />
        <div className="flex gap-1.5 overflow-x-auto">
          {(Object.keys(GROUPS) as (keyof typeof GROUPS)[]).map((g) => (
            <FilterChip key={g} active={group === g} onClick={() => setGroup(g)}>
              {g}
            </FilterChip>
          ))}
        </div>
      </div>

      {!leads && <Skeleton rows={4} />}
      {leads && visible.length === 0 && <Empty hint="Adjust the search or stage filter.">No leads match.</Empty>}

      <div className="flex gap-3 overflow-x-auto pb-4">
        {visible.map((col) => {
          const tone = statusTone(col);
          const items = byStatus.get(col) ?? [];
          return (
            <div key={col} className="w-64 shrink-0 rounded-card border border-line bg-surface/60">
              <p className="sticky top-0 flex items-center gap-2 rounded-t-card border-b border-line bg-surface px-3 py-2 font-display text-[11px] font-semibold uppercase tracking-[0.1em] text-muted">
                <span className={`h-1.5 w-1.5 rounded-full ${tone.dot}`} aria-hidden />
                {col.replace(/_/g, " ")}
                <span className="ml-auto rounded-full bg-surface2 px-1.5 font-display text-[10px] text-faint">{items.length}</span>
              </p>
              <div className="space-y-1.5 p-1.5">
                {items.map((l) => (
                  <Link
                    key={l.id}
                    href={`/leads/${l.id}`}
                    className="block cursor-pointer rounded-lg border border-transparent bg-surface2/60 p-2.5 transition-colors duration-150 hover:border-line hover:bg-surface2"
                  >
                    <p className="truncate text-[13px] font-medium leading-snug text-ink">{l.company_name}</p>
                    <p className="mt-0.5 truncate text-xs text-faint">
                      {l.industry ?? "?"} · {l.city ?? "?"}, {l.region ?? "?"}
                    </p>
                    <p className="mt-1.5 flex justify-between font-display text-[11px]">
                      <span className={l.score != null && l.score >= 60 ? "text-ok" : "text-muted"}>
                        {l.score != null ? `score ${l.score}` : "unscored"}
                      </span>
                      <span className="text-faint">{age(l.seconds_in_stage)}</span>
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
