"use client";

// /builds (spec §8.5): gallery of deployed demos + finals with live iframe previews, QA badges,
// deploy links. Skill: card grid, data-dense, empty state.
import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, SectionTitle, StatusPill, Empty } from "@/components/ui";

interface Build {
  id: string; kind: string; status: string; deploy_url: string; iteration: number;
  lead_id: string; company_name: string; city: string | null; region: string | null; lead_status: string;
  qa_passed: boolean | null; qa_issues: any[] | null;
}

export default function BuildsPage() {
  const [builds, setBuilds] = useState<Build[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let live = true;
    const tick = async () => {
      const res = await fetch("/api/builds", { cache: "no-store" });
      if (res.ok) { const d = await res.json(); if (live) { setBuilds(d.builds); setLoaded(true); } }
    };
    tick();
    const t = setInterval(tick, 5000);
    return () => { live = false; clearInterval(t); };
  }, []);

  return (
    <div>
      <h1 className="text-xl font-bold">Builds</h1>
      <p className="mt-1 text-sm text-zinc-500">{builds.length} deployed demo{builds.length === 1 ? "" : "s"}. Live previews below.</p>

      {loaded && builds.length === 0 && <div className="mt-6"><Empty>No demos deployed yet. Build one with the pipeline or `build-demo.ts`.</Empty></div>}

      <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-2 xl:grid-cols-3">
        {builds.map((b) => (
          <Card key={b.id} className="overflow-hidden">
            <div className="flex items-center justify-between gap-2 border-b border-zinc-800 px-3 py-2">
              <Link href={`/leads/${b.lead_id}`} className="min-w-0">
                <p className="truncate text-sm font-semibold text-zinc-100 hover:text-sky-400">{b.company_name}</p>
                <p className="truncate text-xs text-zinc-500">{b.city ?? "?"}, {b.region ?? "?"} · {b.kind} #{b.iteration}</p>
              </Link>
              {b.qa_passed != null && (
                <span className={`shrink-0 rounded px-1.5 py-0.5 text-xs ${b.qa_passed ? "bg-emerald-500/15 text-emerald-300" : "bg-rose-500/15 text-rose-300"}`}>
                  {b.qa_passed ? "QA ✓" : `QA ✗ ${b.qa_issues?.length ?? ""}`}
                </span>
              )}
            </div>
            {/* Live preview: the demo is public + noindexed, safe to iframe. Scaled down. */}
            <div className="relative h-64 overflow-hidden bg-white">
              <iframe src={b.deploy_url} title={b.company_name} loading="lazy"
                className="absolute left-0 top-0 origin-top-left"
                style={{ width: "200%", height: "200%", transform: "scale(0.5)" }} />
            </div>
            <div className="flex items-center justify-between px-3 py-2">
              <StatusPill status={b.lead_status} />
              <a href={b.deploy_url} target="_blank" className="text-xs text-sky-400 underline">open ↗</a>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
