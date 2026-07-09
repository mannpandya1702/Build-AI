"use client";

// /builds (spec §8.5): gallery of deployed demos with live scaled iframe previews + QA badges.
import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, PageHeader, StatusPill, Empty, Skeleton } from "@/components/ui";

interface Build {
  id: string; kind: string; status: string; deploy_url: string; iteration: number;
  lead_id: string; company_name: string; city: string | null; region: string | null; lead_status: string;
  qa_passed: boolean | null; qa_issues: any[] | null;
}

export default function BuildsPage() {
  const [builds, setBuilds] = useState<Build[] | null>(null);

  useEffect(() => {
    let live = true;
    const tick = async () => {
      const res = await fetch("/api/builds", { cache: "no-store" });
      if (res.ok) { const d = await res.json(); if (live) setBuilds(d.builds); }
    };
    tick();
    const t = setInterval(tick, 5000);
    return () => { live = false; clearInterval(t); };
  }, []);

  return (
    <div>
      <PageHeader title="Builds" description={builds ? `${builds.length} deployed demo${builds.length === 1 ? "" : "s"} · live previews` : "loading…"} />

      {!builds && <Skeleton rows={3} />}
      {builds && builds.length === 0 && <Empty hint="The builder deploys demos as leads reach design_ready.">No demos deployed yet.</Empty>}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {(builds ?? []).map((b) => (
          <Card key={b.id} className="overflow-hidden transition-colors duration-150 hover:border-faint/40">
            <div className="flex items-center justify-between gap-2 border-b border-line px-3 py-2">
              <Link href={`/leads/${b.lead_id}`} className="min-w-0 cursor-pointer">
                <p className="truncate text-sm font-medium text-ink transition-colors duration-150 hover:text-data">{b.company_name}</p>
                <p className="truncate font-display text-[11px] text-faint">{b.city ?? "?"}, {b.region ?? "?"} · {b.kind} #{b.iteration}</p>
              </Link>
              {b.qa_passed != null && (
                <span className={`shrink-0 rounded-md px-1.5 py-0.5 font-display text-[11px] ${b.qa_passed ? "bg-ok/10 text-ok" : "bg-danger/10 text-danger"}`}>
                  {b.qa_passed ? "QA ✓" : `QA ✗ ${b.qa_issues?.length ?? ""}`}
                </span>
              )}
            </div>
            {/* Live preview: the demo is public + noindexed, safe to iframe. Scaled to fit. */}
            <div className="relative h-60 overflow-hidden bg-white">
              <iframe src={b.deploy_url} title={b.company_name} loading="lazy"
                className="absolute left-0 top-0 origin-top-left"
                style={{ width: "200%", height: "200%", transform: "scale(0.5)" }} />
            </div>
            <div className="flex items-center justify-between px-3 py-2">
              <StatusPill status={b.lead_status} />
              <a href={b.deploy_url} target="_blank" className="cursor-pointer font-display text-[11px] text-data underline underline-offset-2 hover:opacity-80">open ↗</a>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
