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

const NICHES = ["roofing", "plumbing", "hvac", "dental", "custom"] as const;
const COUNTRIES = ["United States", "Canada", "United Kingdom", "Australia", "India", "other"] as const;

export default function PipelinePage() {
  const [leads, setLeads] = useState<LeadCard[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [devTools, setDevTools] = useState(false);
  const [q, setQ] = useState("");
  const [group, setGroup] = useState<keyof typeof GROUPS>("All");

  // Discover panel (targeting: niche + cities + country, spec §2.3 "expansion is a config change")
  const [showDiscover, setShowDiscover] = useState(false);
  const [niche, setNiche] = useState<string>("roofing");
  const [customNiche, setCustomNiche] = useState("");
  const [citiesText, setCitiesText] = useState("");
  const [country, setCountry] = useState<string>("United States");
  const [customCountry, setCustomCountry] = useState("");
  const [count, setCount] = useState(25);
  const [discoverMsg, setDiscoverMsg] = useState<string>("");

  useEffect(() => {
    let live = true;
    const tick = async () => {
      const res = await fetch("/api/leads", { cache: "no-store" });
      const data = await res.json();
      if (live) setLeads(data.leads);
    };
    tick();
    const t = setInterval(tick, 2000);
    // dev-only fabricators (mock lead) render only where dev tools are enabled
    fetch("/api/dev/enabled").then((r) => r.json()).then((d) => { if (live) setDevTools(Boolean(d.enabled)); }).catch(() => undefined);
    // prefill the discover panel with the saved targeting
    fetch("/api/settings", { cache: "no-store" }).then((r) => r.json()).then((d) => {
      if (!live) return;
      const o = d.settings?.icp_overrides ?? {};
      if (typeof o.active_vertical === "string") {
        if ((NICHES as readonly string[]).includes(o.active_vertical)) setNiche(o.active_vertical);
        else { setNiche("custom"); setCustomNiche(o.active_vertical); }
      }
      if (Array.isArray(o.cities) && o.cities.length) setCitiesText(o.cities.join(", "));
      if (typeof o.country === "string" && o.country) {
        if ((COUNTRIES as readonly string[]).includes(o.country)) setCountry(o.country);
        else if (o.country.toUpperCase() === "US") setCountry("United States");
        else { setCountry("other"); setCustomCountry(o.country); }
      }
    }).catch(() => undefined);
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

  async function submitDiscover() {
    const vertical = niche === "custom" ? customNiche.trim() : niche;
    const finalCountry = country === "other" ? customCountry.trim() : country === "United States" ? "US" : country;
    const cities = citiesText.split(/[,\n;]+/).map((c) => c.trim()).filter(Boolean);
    if (!vertical) { setDiscoverMsg("pick or type a niche"); return; }
    if (cities.length === 0) { setDiscoverMsg("add at least one city"); return; }
    if (!finalCountry) { setDiscoverMsg("pick or type a country"); return; }
    setBusy(true);
    setDiscoverMsg("");
    const res = await fetch("/api/discover", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ count, vertical, cities, country: finalCountry }),
    });
    const d = await res.json().catch(() => ({}));
    setBusy(false);
    if (res.ok) {
      setDiscoverMsg(`queued: ${d.count} ${d.vertical} leads in ${cities.length} cit${cities.length === 1 ? "y" : "ies"} (${finalCountry}). The worker picks it up within a minute.`);
    } else {
      setDiscoverMsg(`error: ${d.error ?? res.status}`);
    }
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
          <button onClick={runMockLead} disabled={busy} className="h-9 cursor-pointer rounded-lg border border-line px-3 text-sm text-muted transition-colors duration-150 hover:bg-surface2 hover:text-ink disabled:opacity-50">
            Run mock lead
          </button>
        )}
        <button onClick={() => setShowDiscover(!showDiscover)} aria-expanded={showDiscover}
          className="h-9 cursor-pointer rounded-lg bg-accent px-3 font-display text-sm font-semibold text-accentink transition-opacity duration-150 hover:opacity-90">
          {showDiscover ? "Close" : "Discover leads"}
        </button>
      </PageHeader>

      {showDiscover && (
        <div className="mb-4 rounded-card border border-line bg-surface p-4">
          <p className="font-display text-[11px] font-semibold uppercase tracking-[0.14em] text-faint">Discover new leads</p>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label htmlFor="niche" className="block text-xs text-muted">Niche</label>
              <select id="niche" value={niche} onChange={(e) => setNiche(e.target.value)}
                className="mt-1 h-10 w-full cursor-pointer rounded-lg border border-line bg-surface2 px-2.5 text-sm text-ink outline-none transition-colors duration-150 focus:border-data/60">
                {NICHES.map((n) => <option key={n} value={n}>{n === "custom" ? "custom…" : n}</option>)}
              </select>
              {niche === "custom" && (
                <input value={customNiche} onChange={(e) => setCustomNiche(e.target.value)} placeholder="e.g. landscapers"
                  aria-label="Custom niche"
                  className="mt-1.5 h-10 w-full rounded-lg border border-line bg-surface2 px-2.5 text-sm text-ink outline-none placeholder:text-faint focus:border-data/60" />
              )}
            </div>
            <div>
              <label htmlFor="cities" className="block text-xs text-muted">Cities (comma-separated)</label>
              <input id="cities" value={citiesText} onChange={(e) => setCitiesText(e.target.value)} placeholder="Dallas, TX, Plano, TX"
                className="mt-1 h-10 w-full rounded-lg border border-line bg-surface2 px-2.5 text-sm text-ink outline-none placeholder:text-faint focus:border-data/60" />
              <p className="mt-1 text-[11px] text-faint">US cities work best as “City, ST”.</p>
            </div>
            <div>
              <label htmlFor="country" className="block text-xs text-muted">Country</label>
              <select id="country" value={country} onChange={(e) => setCountry(e.target.value)}
                className="mt-1 h-10 w-full cursor-pointer rounded-lg border border-line bg-surface2 px-2.5 text-sm text-ink outline-none transition-colors duration-150 focus:border-data/60">
                {COUNTRIES.map((c) => <option key={c} value={c}>{c === "other" ? "other…" : c}</option>)}
              </select>
              {country === "other" && (
                <input value={customCountry} onChange={(e) => setCustomCountry(e.target.value)} placeholder="e.g. Germany"
                  aria-label="Custom country"
                  className="mt-1.5 h-10 w-full rounded-lg border border-line bg-surface2 px-2.5 text-sm text-ink outline-none placeholder:text-faint focus:border-data/60" />
              )}
            </div>
            <div>
              <label htmlFor="count" className="block text-xs text-muted">How many</label>
              <input id="count" type="number" min={1} max={200} value={count} onChange={(e) => setCount(Math.min(200, Math.max(1, parseInt(e.target.value || "1", 10))))}
                className="mt-1 h-10 w-full rounded-lg border border-line bg-surface2 px-2.5 font-display text-sm text-ink outline-none focus:border-data/60" />
              <p className="mt-1 text-[11px] text-faint">Places cap: 200 calls/day.</p>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button onClick={submitDiscover} disabled={busy}
              className="h-10 cursor-pointer rounded-lg bg-accent px-5 font-display text-sm font-semibold text-accentink transition-opacity duration-150 hover:opacity-90 disabled:opacity-50">
              {busy ? "Queuing…" : "Start discovery"}
            </button>
            {discoverMsg && <span className={`text-sm ${discoverMsg.startsWith("error") ? "text-danger" : "text-muted"}`} role="status">{discoverMsg}</span>}
          </div>
        </div>
      )}

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
