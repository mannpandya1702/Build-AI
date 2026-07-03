"use client";

// /leads/[id] (spec §8.2): the full lead story in tabs — Overview, Audit, Solution, Design,
// Builds+QA, Emails, Timeline. Surfaces the real artifacts the pipeline produces (audit findings,
// Lighthouse scores, the solution + call sheet, the assigned look, the live demo). Skill UX: loading
// state, empty states, overflow-safe.
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, SectionTitle, StatusPill, StatTile, ScoreDial, PaletteSwatches, Empty, severityTone } from "@/components/ui";

interface Finding { category: string; severity: string; evidence: string; why_it_costs_them: string }
interface Detail {
  lead: Record<string, any> & { company_name: string; status: string; score: number | null };
  audit: { lighthouse: any; findings: Finding[]; summary: string | null; screenshots: any[]; created_at: string } | null;
  solution: { pitch_angle: string | null; features: string[]; differentiators: string[]; estimated_impact: string | null; call_sheet_md: string | null } | null;
  design: { brand: any; sitemap: string[]; page_specs: any[]; look_locked: boolean; look_name: string | null } | null;
  builds: { id: string; kind: string; status: string; deploy_url: string | null; iteration: number; created_at: string }[];
  qa: { passed: boolean; iteration: number; checks: any[]; issues: any[]; kind: string; created_at: string }[];
  emails: { id: string; direction: string; kind: string; subject: string | null; status: string }[];
  events: { id: string; agent: string; level: string; type: string; message: string | null; cost_usd: string | null; created_at: string }[];
  spend: number;
}

const TABS = ["Overview", "Audit", "Solution", "Design", "Builds", "Emails", "Timeline"] as const;

export default function LeadPage() {
  const { id } = useParams<{ id: string }>();
  const [d, setD] = useState<Detail | null>(null);
  const [tab, setTab] = useState<(typeof TABS)[number]>("Overview");

  useEffect(() => {
    let live = true;
    const tick = async () => {
      const res = await fetch(`/api/leads/${id}`, { cache: "no-store" });
      if (res.ok) { const data = await res.json(); if (live) setD(data); }
    };
    tick();
    const t = setInterval(tick, 3000);
    return () => { live = false; clearInterval(t); };
  }, [id]);

  if (!d) return <div className="animate-pulse text-sm text-zinc-600">Loading lead…</div>;
  const L = d.lead;
  const demo = d.builds.find((b) => b.kind === "demo" && b.deploy_url);
  const count = (t: string) => (t === "Audit" ? (d.audit ? 1 : 0) : t === "Solution" ? (d.solution ? 1 : 0) : t === "Design" ? (d.design ? 1 : 0) : t === "Builds" ? d.builds.length : t === "Emails" ? d.emails.length : 0);

  return (
    <div className="mx-auto max-w-6xl">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{L.company_name}</h1>
            <StatusPill status={L.status} />
            {d.design?.look_locked && <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[11px] text-zinc-400">look locked</span>}
          </div>
          <p className="mt-1 text-sm text-zinc-500">
            {L.industry ?? "?"} · {L.city ?? "?"}, {L.region ?? "?"}
            {L.website_url && <> · <a href={L.website_url} target="_blank" className="text-sky-400 underline">current site</a></>}
          </p>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <StatTile label="Score" value={L.score ?? "—"} tone={(L.score ?? 0) >= 60 ? "emerald" : "zinc"} />
          <StatTile label="Reviews" value={L.review_count ?? "—"} sub={L.rating ? `${L.rating}★` : undefined} tone="sky" />
          <StatTile label="AI spend" value={`$${d.spend.toFixed(2)}`} sub="this lead" tone="amber" />
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-6 flex gap-1 overflow-x-auto border-b border-zinc-800">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`shrink-0 border-b-2 px-3 py-2 text-sm font-medium transition-colors ${tab === t ? "border-sky-500 text-zinc-100" : "border-transparent text-zinc-500 hover:text-zinc-300"}`}>
            {t}{["Builds", "Emails"].includes(t) && count(t) > 0 && <span className="ml-1.5 text-zinc-600">{count(t)}</span>}
          </button>
        ))}
      </div>

      <div className="mt-5">
        {tab === "Overview" && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Card className="p-4">
              <SectionTitle>Contact</SectionTitle>
              <dl className="mt-3 space-y-1.5 text-sm">
                {[["Name", L.contact_name], ["Phone", L.contact_phone], ["Email", L.contact_email], ["GBP", L.gbp_url]].map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-4"><dt className="text-zinc-500">{k}</dt><dd className="truncate text-zinc-200">{v || <span className="text-zinc-600">—</span>}</dd></div>
                ))}
              </dl>
            </Card>
            <Card className="p-4">
              <SectionTitle>Score breakdown</SectionTitle>
              <div className="mt-3 space-y-1.5 text-sm">
                {L.score_breakdown ? Object.entries(L.score_breakdown).map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between gap-4">
                    <span className="text-zinc-400">{k.replace(/_/g, " ")}</span>
                    <span className="font-mono text-zinc-200">+{String(v)}</span>
                  </div>
                )) : <Empty>not scored yet</Empty>}
              </div>
            </Card>
          </div>
        )}

        {tab === "Audit" && (d.audit ? (
          <div className="space-y-5">
            {d.audit.lighthouse && (
              <Card className="p-4">
                <SectionTitle>Lighthouse (mobile)</SectionTitle>
                <div className="mt-3 flex flex-wrap gap-5">
                  <ScoreDial label="perf" score={d.audit.lighthouse.performance ?? null} />
                  <ScoreDial label="seo" score={d.audit.lighthouse.seo ?? null} />
                  <ScoreDial label="a11y" score={d.audit.lighthouse.accessibility ?? null} />
                  <ScoreDial label="best pr." score={d.audit.lighthouse.best_practices ?? null} />
                  {d.audit.lighthouse.lcp_ms > 0 && (
                    <div className="flex flex-col items-center gap-1"><span className="mt-3 text-lg font-bold tabular-nums text-zinc-200">{(d.audit.lighthouse.lcp_ms / 1000).toFixed(1)}s</span><span className="text-[11px] uppercase tracking-wide text-zinc-500">LCP</span></div>
                  )}
                </div>
              </Card>
            )}
            {d.audit.summary && <Card className="p-4 text-sm text-zinc-300"><SectionTitle>Summary</SectionTitle><p className="mt-2">{d.audit.summary}</p></Card>}
            <Card className="p-4">
              <SectionTitle>Findings ({d.audit.findings?.length ?? 0})</SectionTitle>
              <div className="mt-3 space-y-3">
                {(d.audit.findings ?? []).map((f, i) => (
                  <div key={i} className="border-l-2 border-zinc-800 pl-3">
                    <p className="text-sm"><span className={`font-semibold uppercase ${severityTone(f.severity)}`}>{f.severity}</span> <span className="text-zinc-500">· {f.category}</span></p>
                    <p className="mt-0.5 text-sm text-zinc-200">{f.evidence}</p>
                    <p className="mt-0.5 text-xs text-zinc-500">{f.why_it_costs_them}</p>
                  </div>
                ))}
              </div>
            </Card>
            {d.audit.screenshots?.length > 0 && (
              <Card className="p-4"><SectionTitle>Screenshots</SectionTitle>
                <p className="mt-2 text-sm text-zinc-500">{d.audit.screenshots.map((s: any) => s.viewport).join(" · ")} captured</p>
              </Card>
            )}
          </div>
        ) : <Empty>no audit yet</Empty>)}

        {tab === "Solution" && (d.solution ? (
          <div className="space-y-4">
            {d.solution.pitch_angle && <Card className="p-4"><SectionTitle>Pitch angle</SectionTitle><p className="mt-2 text-sm text-zinc-200">{d.solution.pitch_angle}</p></Card>}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Card className="p-4"><SectionTitle>Features</SectionTitle><ul className="mt-2 space-y-1 text-sm text-zinc-300">{(d.solution.features ?? []).map((f, i) => <li key={i} className="flex gap-2"><span className="text-sky-500">›</span>{f}</li>)}</ul></Card>
              <Card className="p-4"><SectionTitle>Differentiators</SectionTitle><ul className="mt-2 space-y-1 text-sm text-zinc-300">{(d.solution.differentiators ?? []).map((f, i) => <li key={i} className="flex gap-2"><span className="text-emerald-500">✓</span>{f}</li>)}</ul></Card>
            </div>
            {d.solution.call_sheet_md && (
              <Card className="p-4"><SectionTitle>Call sheet</SectionTitle>
                <pre className="mt-2 max-h-96 overflow-auto whitespace-pre-wrap rounded-lg bg-zinc-950 p-3 text-xs leading-relaxed text-zinc-300">{d.solution.call_sheet_md}</pre>
              </Card>
            )}
          </div>
        ) : <Empty>no solution yet</Empty>)}

        {tab === "Design" && (d.design ? (
          <div className="space-y-4">
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <SectionTitle>Look: {d.design.look_name ?? d.design.brand?.preset}</SectionTitle>
                <span className="text-xs text-zinc-500">{d.design.brand?.fonts?.display} / {d.design.brand?.fonts?.body}{d.design.brand?.skill_grounded && " · skill-grounded"}</span>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-6">
                {d.design.brand?.palette && <PaletteSwatches palette={d.design.brand.palette} />}
                <div className="text-sm">
                  <p className="text-zinc-500">tone</p><p className="text-zinc-200">{d.design.brand?.tone}</p>
                  {d.design.brand?.hero?.headline && <><p className="mt-2 text-zinc-500">hero</p><p className="text-zinc-200">{d.design.brand.hero.headline}</p></>}
                </div>
              </div>
            </Card>
            <Card className="p-4"><SectionTitle>Blocks</SectionTitle>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {(d.design.page_specs?.[0]?.blocks ?? []).map((b: any, i: number) => <span key={i} className="rounded bg-zinc-800 px-2 py-0.5 text-xs text-zinc-300">{b.block}</span>)}
              </div>
            </Card>
          </div>
        ) : <Empty>no design yet</Empty>)}

        {tab === "Builds" && (d.builds.length ? (
          <div className="space-y-4">
            {demo && (
              <Card className="overflow-hidden">
                <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-2">
                  <SectionTitle>Live demo preview</SectionTitle>
                  <a href={demo.deploy_url!} target="_blank" className="text-xs text-sky-400 underline">open ↗</a>
                </div>
                <iframe src={demo.deploy_url!} className="h-[600px] w-full bg-white" title="demo preview" />
              </Card>
            )}
            <Card className="p-4"><SectionTitle>Build history</SectionTitle>
              <div className="mt-2 space-y-2">
                {d.builds.map((b) => {
                  const q = d.qa.find((x) => x.kind === b.kind && x.iteration === b.iteration);
                  return (
                    <div key={b.id} className="flex flex-wrap items-center gap-2 rounded-lg border border-zinc-800 px-3 py-2 text-sm">
                      <span className="font-mono text-zinc-300">{b.kind} #{b.iteration}</span>
                      <span className="text-zinc-500">{b.status}</span>
                      {q && <span className={`rounded px-1.5 py-0.5 text-xs ${q.passed ? "bg-emerald-500/15 text-emerald-300" : "bg-rose-500/15 text-rose-300"}`}>QA {q.passed ? "pass" : `fail (${q.issues?.length ?? 0})`}</span>}
                      {b.deploy_url && <a href={b.deploy_url} target="_blank" className="ml-auto truncate text-sky-400 underline">{b.deploy_url.replace("https://", "")}</a>}
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        ) : <Empty>no builds yet</Empty>)}

        {tab === "Emails" && (d.emails.length ? (
          <div className="space-y-2">
            {d.emails.map((e) => (
              <Card key={e.id} className="flex flex-wrap items-center gap-2 px-3 py-2 text-sm">
                <span className={e.direction === "inbound" ? "text-sky-400" : "text-zinc-400"}>{e.direction}</span>
                <span className="text-zinc-500">{e.kind}</span>
                <span className="text-zinc-200">{e.subject ?? "(no subject)"}</span>
                <span className="ml-auto text-xs text-zinc-500">{e.status}</span>
              </Card>
            ))}
          </div>
        ) : <Empty>no emails yet (outreach is Phase 5)</Empty>)}

        {tab === "Timeline" && (
          <div className="space-y-1 font-mono text-xs">
            {d.events.map((e) => (
              <div key={e.id} className="flex gap-3 rounded border border-zinc-900 bg-zinc-900/40 px-3 py-1.5">
                <span className="w-16 shrink-0 text-zinc-600">{new Date(e.created_at).toLocaleTimeString()}</span>
                <span className={`w-16 shrink-0 ${e.level === "error" ? "text-rose-400" : e.level === "warn" ? "text-amber-400" : "text-zinc-400"}`}>{e.agent}</span>
                <span className="w-40 shrink-0 text-zinc-500">{e.type}</span>
                <span className="flex-1 text-zinc-300">{e.message}</span>
                {e.cost_usd && <span className="text-zinc-600">${Number(e.cost_usd).toFixed(3)}</span>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
