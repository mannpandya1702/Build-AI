"use client";

// /leads/[id] (spec §8.2): the full lead story in tabs — Overview, Audit, Solution, Design,
// Builds+QA, Emails, Timeline. Styled to the skill design system (data-dense, blue data, amber
// active indicators, Fira Code for figures). Migrated to TanStack Query (no poller, real error
// state); a transient poll failure keeps the last-good data on screen instead of flashing an error.
import {
  Card,
  Empty,
  PaletteSwatches,
  ScoreDial,
  SectionTitle,
  Skeleton,
  StatTile,
  StatusPill,
  severityTone,
} from "@/components/ui";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { useState } from "react";

interface Finding {
  category: string;
  severity: string;
  evidence: string;
  why_it_costs_them: string;
}
interface Detail {
  lead: Record<string, any> & { company_name: string; status: string; score: number | null };
  audit: {
    lighthouse: any;
    findings: Finding[];
    summary: string | null;
    screenshots: any[];
    created_at: string;
  } | null;
  solution: {
    pitch_angle: string | null;
    features: string[];
    differentiators: string[];
    estimated_impact: string | null;
    call_sheet_md: string | null;
  } | null;
  design: {
    brand: any;
    sitemap: string[];
    page_specs: any[];
    look_locked: boolean;
    look_name: string | null;
  } | null;
  builds: {
    id: string;
    kind: string;
    status: string;
    deploy_url: string | null;
    iteration: number;
    created_at: string;
  }[];
  qa: {
    passed: boolean;
    iteration: number;
    checks: any[];
    issues: any[];
    kind: string;
    created_at: string;
  }[];
  emails: { id: string; direction: string; kind: string; subject: string | null; status: string }[];
  events: {
    id: string;
    agent: string;
    level: string;
    type: string;
    message: string | null;
    cost_usd: string | null;
    created_at: string;
  }[];
  opportunities: {
    id: string;
    service_type: string;
    status: string;
    score: number | null;
    created_at: string;
    updated_at: string;
  }[];
  spend: number;
}

const TABS = ["Overview", "Services", "Audit", "Solution", "Design", "Builds", "Emails", "Timeline"] as const;

// Service-line presentation (the agency's four products). Website is the cold pitch; the rest are
// expansion revenue sold after the close (CLAUDE.md §1). Kept in sync with SERVICE_TYPES in core.
const SERVICE_META: Record<string, { label: string; blurb: string; expansion: boolean }> = {
  website: { label: "Website", blurb: "The cold-pitch product", expansion: false },
  ai_automation: {
    label: "AI Automation",
    blurb: "Missed-call text-back, review engine, follow-ups",
    expansion: true,
  },
  chatbot: { label: "Chatbot", blurb: "Site lead-capture widget", expansion: true },
  voice_agent: { label: "Voice Agent", blurb: "Inbound / after-hours reception", expansion: true },
};

async function fetchDetail(id: string): Promise<Detail> {
  const res = await fetch(`/api/leads/${id}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`lead ${res.status}`);
  return (await res.json()) as Detail;
}

export default function LeadPage() {
  const { id } = useParams<{ id: string }>();
  const [tab, setTab] = useState<(typeof TABS)[number]>("Overview");

  const {
    data: d,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["lead", id],
    queryFn: () => fetchDetail(id),
    refetchInterval: 3000,
  });

  // Once `d` is loaded it survives a failed background poll, so this branch only shows on the very
  // first fetch: retry on a hard error, otherwise the skeleton.
  if (!d) {
    if (isError) {
      return (
        <div className="mx-auto max-w-6xl">
          <Card className="flex items-center justify-between gap-3 px-4 py-3">
            <p className="text-sm text-muted">Couldn't load this lead.</p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Retry
            </Button>
          </Card>
        </div>
      );
    }
    return <Skeleton rows={5} />;
  }
  const L = d.lead;
  const demo = d.builds.find((b) => b.kind === "demo" && b.deploy_url);
  const count = (t: string) =>
    t === "Builds"
      ? d.builds.length
      : t === "Emails"
        ? d.emails.length
        : t === "Services"
          ? d.opportunities.length
          : 0;

  return (
    <div className="mx-auto max-w-6xl">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-display text-xl font-semibold tracking-tight text-ink">{L.company_name}</h1>
            <StatusPill status={L.status} />
            {d.design?.look_locked && (
              <span className="rounded-full bg-surface2 px-2 py-0.5 font-display text-[11px] text-muted">
                look locked
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-muted">
            {L.industry ?? "?"} · {L.city ?? "?"}, {L.region ?? "?"}
            {L.website_url && (
              <>
                {" "}
                ·{" "}
                <a
                  href={L.website_url}
                  target="_blank"
                  className="cursor-pointer text-data underline underline-offset-2 hover:opacity-80"
                  rel="noreferrer"
                >
                  current site
                </a>
              </>
            )}
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2.5">
          <StatTile label="Score" value={L.score ?? "—"} tone={(L.score ?? 0) >= 60 ? "ok" : "ink"} />
          <StatTile
            label="Reviews"
            value={L.review_count ?? "—"}
            sub={L.rating ? `${L.rating}★` : undefined}
            tone="data"
          />
          <StatTile label="AI spend" value={`$${d.spend.toFixed(2)}`} sub="this lead" tone="warn" />
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-5 flex gap-1 overflow-x-auto border-b border-line" role="tablist">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            role="tab"
            aria-selected={tab === t}
            className={`shrink-0 cursor-pointer border-b-2 px-3 py-2 text-sm transition-colors duration-150 ${tab === t ? "border-accent font-medium text-ink" : "border-transparent text-muted hover:text-ink"}`}
          >
            {t}
            {["Builds", "Emails", "Services"].includes(t) && count(t) > 0 && (
              <span className="ml-1.5 font-display text-[11px] text-faint">{count(t)}</span>
            )}
          </button>
        ))}
      </div>

      <div className="mt-5">
        {tab === "Overview" && (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <Card className="p-4">
              <SectionTitle>Contact</SectionTitle>
              <dl className="mt-3 space-y-1.5 text-sm">
                {[
                  ["Name", L.contact_name],
                  ["Phone", L.contact_phone],
                  ["Email", L.contact_email],
                  ["GBP", L.gbp_url],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-4">
                    <dt className="shrink-0 text-faint">{k}</dt>
                    <dd className="truncate text-ink">{v || <span className="text-faint">—</span>}</dd>
                  </div>
                ))}
              </dl>
            </Card>
            <Card className="p-4">
              <SectionTitle>Score breakdown</SectionTitle>
              <div className="mt-3 space-y-1.5 text-sm">
                {L.score_breakdown ? (
                  Object.entries(L.score_breakdown).map(([k, v]) => (
                    <div key={k} className="flex items-center justify-between gap-4">
                      <span className="text-muted">{k.replace(/_/g, " ")}</span>
                      <span className="font-display text-[13px] text-ink">+{String(v)}</span>
                    </div>
                  ))
                ) : (
                  <Empty>not scored yet</Empty>
                )}
              </div>
            </Card>
          </div>
        )}

        {tab === "Services" &&
          (d.opportunities.length ? (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {d.opportunities.map((o) => {
                const meta = SERVICE_META[o.service_type] ?? {
                  label: o.service_type,
                  blurb: "",
                  expansion: true,
                };
                return (
                  <Card key={o.id} className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-display text-sm font-semibold text-ink">{meta.label}</p>
                        {meta.blurb && <p className="mt-0.5 text-xs text-faint">{meta.blurb}</p>}
                      </div>
                      <span
                        className={`shrink-0 rounded-md px-2 py-0.5 font-display text-[11px] ${meta.expansion ? "bg-data/10 text-data" : "bg-accent/15 text-accent"}`}
                      >
                        {meta.expansion ? "expansion" : "cold pitch"}
                      </span>
                    </div>
                    <div className="mt-3 flex items-center justify-between border-t border-line pt-2.5">
                      <span className="font-display text-[13px] text-muted">
                        {o.status.replace(/_/g, " ")}
                      </span>
                      {o.score != null && (
                        <span className="font-display text-[11px] text-faint">score {o.score}</span>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Empty hint="Website is the cold pitch; expansion lines are added after the close.">
              no service lines yet
            </Empty>
          ))}

        {tab === "Audit" &&
          (d.audit ? (
            <div className="space-y-3">
              {d.audit.lighthouse && (
                <Card className="p-4">
                  <SectionTitle>Lighthouse (mobile)</SectionTitle>
                  <div className="mt-3 flex flex-wrap items-center gap-6">
                    <ScoreDial label="perf" score={d.audit.lighthouse.performance ?? null} />
                    <ScoreDial label="seo" score={d.audit.lighthouse.seo ?? null} />
                    <ScoreDial label="a11y" score={d.audit.lighthouse.accessibility ?? null} />
                    <ScoreDial label="best pr." score={d.audit.lighthouse.best_practices ?? null} />
                    {d.audit.lighthouse.lcp_ms > 0 && (
                      <div className="flex flex-col items-center gap-1.5">
                        <span className="font-display text-lg font-semibold text-ink">
                          {(d.audit.lighthouse.lcp_ms / 1000).toFixed(1)}s
                        </span>
                        <span className="font-display text-[10px] uppercase tracking-[0.12em] text-faint">
                          LCP
                        </span>
                      </div>
                    )}
                  </div>
                </Card>
              )}
              {d.audit.summary && (
                <Card className="p-4 text-sm text-ink">
                  <SectionTitle>Summary</SectionTitle>
                  <p className="mt-2 leading-relaxed">{d.audit.summary}</p>
                </Card>
              )}
              <Card className="p-4">
                <SectionTitle>Findings ({d.audit.findings?.length ?? 0})</SectionTitle>
                <div className="mt-3 space-y-3">
                  {(d.audit.findings ?? []).map((f, i) => (
                    <div key={i} className="border-l-2 border-line pl-3">
                      <p className="font-display text-[11px] uppercase tracking-wide">
                        <span className={`font-semibold ${severityTone(f.severity)}`}>{f.severity}</span>{" "}
                        <span className="text-faint">· {f.category}</span>
                      </p>
                      <p className="mt-1 text-sm leading-relaxed text-ink">{f.evidence}</p>
                      <p className="mt-0.5 text-xs leading-relaxed text-muted">{f.why_it_costs_them}</p>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          ) : (
            <Empty>no audit yet</Empty>
          ))}

        {tab === "Solution" &&
          (d.solution ? (
            <div className="space-y-3">
              {d.solution.pitch_angle && (
                <Card className="p-4">
                  <SectionTitle>Pitch angle</SectionTitle>
                  <p className="mt-2 text-sm leading-relaxed text-ink">{d.solution.pitch_angle}</p>
                </Card>
              )}
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <Card className="p-4">
                  <SectionTitle>Features</SectionTitle>
                  <ul className="mt-2 space-y-1.5 text-sm text-ink">
                    {(d.solution.features ?? []).map((f, i) => (
                      <li key={i} className="flex gap-2 leading-snug">
                        <span className="text-data">›</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                </Card>
                <Card className="p-4">
                  <SectionTitle>Differentiators</SectionTitle>
                  <ul className="mt-2 space-y-1.5 text-sm text-ink">
                    {(d.solution.differentiators ?? []).map((f, i) => (
                      <li key={i} className="flex gap-2 leading-snug">
                        <span className="text-ok">✓</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                </Card>
              </div>
              {d.solution.call_sheet_md && (
                <Card className="p-4">
                  <SectionTitle>Call sheet</SectionTitle>
                  <pre className="mt-2 max-h-96 overflow-auto whitespace-pre-wrap rounded-lg bg-bg p-3 font-display text-xs leading-relaxed text-muted">
                    {d.solution.call_sheet_md}
                  </pre>
                </Card>
              )}
            </div>
          ) : (
            <Empty>no solution yet</Empty>
          ))}

        {tab === "Design" &&
          (d.design ? (
            <div className="space-y-3">
              <Card className="p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <SectionTitle>Look: {d.design.look_name ?? d.design.brand?.preset}</SectionTitle>
                  <span className="font-display text-[11px] text-faint">
                    {d.design.brand?.fonts?.display} / {d.design.brand?.fonts?.body}
                    {d.design.brand?.skill_grounded && " · skill-grounded"}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-6">
                  {d.design.brand?.palette && <PaletteSwatches palette={d.design.brand.palette} />}
                  <div className="text-sm">
                    <p className="text-faint">tone</p>
                    <p className="text-ink">{d.design.brand?.tone}</p>
                    {d.design.brand?.hero?.headline && (
                      <>
                        <p className="mt-2 text-faint">hero</p>
                        <p className="text-ink">{d.design.brand.hero.headline}</p>
                      </>
                    )}
                  </div>
                </div>
              </Card>
              <Card className="p-4">
                <SectionTitle>Blocks</SectionTitle>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {(d.design.page_specs?.[0]?.blocks ?? []).map((b: any, i: number) => (
                    <span
                      key={i}
                      className="rounded-md bg-surface2 px-2 py-0.5 font-display text-[11px] text-muted"
                    >
                      {b.block}
                    </span>
                  ))}
                </div>
              </Card>
            </div>
          ) : (
            <Empty>no design yet</Empty>
          ))}

        {tab === "Builds" &&
          (d.builds.length ? (
            <div className="space-y-3">
              {demo && (
                <Card className="overflow-hidden">
                  <div className="flex items-center justify-between border-b border-line px-4 py-2">
                    <SectionTitle>Live demo preview</SectionTitle>
                    <a
                      href={demo.deploy_url!}
                      target="_blank"
                      className="cursor-pointer font-display text-[11px] text-data underline underline-offset-2 hover:opacity-80"
                      rel="noreferrer"
                    >
                      open ↗
                    </a>
                  </div>
                  <iframe
                    src={demo.deploy_url!}
                    className="h-[560px] w-full bg-white"
                    title="demo preview"
                    loading="lazy"
                  />
                </Card>
              )}
              <Card className="p-4">
                <SectionTitle>Build history</SectionTitle>
                <div className="mt-2 space-y-1.5">
                  {d.builds.map((b) => {
                    const q = d.qa.find((x) => x.kind === b.kind && x.iteration === b.iteration);
                    return (
                      <div
                        key={b.id}
                        className="flex flex-wrap items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm"
                      >
                        <span className="font-display text-[13px] text-ink">
                          {b.kind} #{b.iteration}
                        </span>
                        <span className="text-faint">{b.status}</span>
                        {q && (
                          <span
                            className={`rounded-md px-1.5 py-0.5 font-display text-[11px] ${q.passed ? "bg-ok/10 text-ok" : "bg-danger/10 text-danger"}`}
                          >
                            QA {q.passed ? "pass" : `fail (${q.issues?.length ?? 0})`}
                          </span>
                        )}
                        {b.deploy_url && (
                          <a
                            href={b.deploy_url}
                            target="_blank"
                            className="ml-auto cursor-pointer truncate text-data underline underline-offset-2 hover:opacity-80"
                            rel="noreferrer"
                          >
                            {b.deploy_url.replace("https://", "")}
                          </a>
                        )}
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>
          ) : (
            <Empty>no builds yet</Empty>
          ))}

        {tab === "Emails" &&
          (d.emails.length ? (
            <div className="space-y-1.5">
              {d.emails.map((e) => (
                <Card key={e.id} className="flex flex-wrap items-center gap-2 px-3 py-2 text-sm">
                  <span
                    className={`font-display text-[11px] uppercase ${e.direction === "inbound" ? "text-data" : "text-faint"}`}
                  >
                    {e.direction}
                  </span>
                  <span className="text-faint">{e.kind}</span>
                  <span className="text-ink">{e.subject ?? "(no subject)"}</span>
                  <span className="ml-auto font-display text-[11px] text-faint">{e.status}</span>
                </Card>
              ))}
            </div>
          ) : (
            <Empty hint="Outreach goes live with Phase 5 sending.">no emails yet</Empty>
          ))}

        {tab === "Timeline" && (
          <div className="space-y-1 font-display text-xs">
            {d.events.map((e) => (
              <div
                key={e.id}
                className="flex gap-3 rounded-md border border-line/50 bg-surface/60 px-3 py-1.5"
              >
                <span className="w-16 shrink-0 text-faint">
                  {new Date(e.created_at).toLocaleTimeString()}
                </span>
                <span
                  className={`w-16 shrink-0 ${e.level === "error" ? "text-danger" : e.level === "warn" ? "text-warn" : "text-muted"}`}
                >
                  {e.agent}
                </span>
                <span className="w-44 shrink-0 truncate text-faint">{e.type}</span>
                <span className="min-w-0 flex-1 truncate text-muted">{e.message}</span>
                {e.cost_usd && <span className="shrink-0 text-faint">${Number(e.cost_usd).toFixed(3)}</span>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
