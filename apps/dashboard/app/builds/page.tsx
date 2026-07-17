"use client";

// /builds (spec §8.5): gallery of deployed demos with live scaled iframe previews + QA badges.
// Migrated to TanStack Query (no poller, real error state); demo iframes are now sandboxed.
import { Card, Empty, PageHeader, Skeleton, StatusPill } from "@/components/ui";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

interface Build {
  id: string;
  kind: string;
  status: string;
  deploy_url: string;
  iteration: number;
  lead_id: string;
  company_name: string;
  city: string | null;
  region: string | null;
  lead_status: string;
  qa_passed: boolean | null;
  qa_issues: unknown[] | null;
}

async function fetchBuilds(): Promise<Build[]> {
  const res = await fetch("/api/builds", { cache: "no-store" });
  if (!res.ok) throw new Error(`builds ${res.status}`);
  return (await res.json()).builds as Build[];
}

export default function BuildsPage() {
  const {
    data: builds,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["builds"],
    queryFn: fetchBuilds,
    refetchInterval: 5000,
  });

  return (
    <div>
      <PageHeader
        title="Builds"
        description={
          builds
            ? `${builds.length} deployed demo${builds.length === 1 ? "" : "s"} · live previews`
            : "Deployed demo previews"
        }
      />

      {isLoading && <Skeleton rows={3} />}
      {isError && (
        <Card className="flex items-center justify-between gap-3 px-4 py-3">
          <p className="text-sm text-muted">Couldn't load builds.</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Retry
          </Button>
        </Card>
      )}
      {builds && builds.length === 0 && (
        <Empty hint="The builder deploys demos as leads reach design_ready.">No demos deployed yet.</Empty>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {(builds ?? []).map((b) => (
          <Card key={b.id} className="overflow-hidden transition-colors duration-150 hover:border-faint/40">
            <div className="flex items-center justify-between gap-2 border-b border-line px-3 py-2">
              <Link href={`/leads/${b.lead_id}`} className="min-w-0 cursor-pointer">
                <p className="truncate text-sm font-medium text-ink transition-colors duration-150 hover:text-data">
                  {b.company_name}
                </p>
                <p className="truncate font-display text-[11px] text-faint">
                  {b.city ?? "?"}, {b.region ?? "?"} · {b.kind} #{b.iteration}
                </p>
              </Link>
              {b.qa_passed != null && (
                <span
                  className={`shrink-0 rounded-md px-1.5 py-0.5 font-display text-[11px] ${b.qa_passed ? "bg-ok/10 text-ok" : "bg-danger/10 text-danger"}`}
                >
                  {b.qa_passed ? "QA ✓" : `QA ✗ ${b.qa_issues?.length ?? ""}`}
                </span>
              )}
            </div>
            {/* Live preview: the demo is public + noindexed. Sandboxed so an embedded page can't
                navigate the top window or submit forms out of the frame (audit finding). */}
            <div className="relative h-60 overflow-hidden bg-white">
              <iframe
                src={b.deploy_url}
                title={b.company_name}
                loading="lazy"
                sandbox="allow-scripts allow-same-origin"
                className="absolute left-0 top-0 origin-top-left"
                style={{ width: "200%", height: "200%", transform: "scale(0.5)" }}
              />
            </div>
            <div className="flex items-center justify-between px-3 py-2">
              <StatusPill status={b.lead_status} />
              <a
                href={b.deploy_url}
                target="_blank"
                className="cursor-pointer font-display text-[11px] text-data underline underline-offset-2 hover:opacity-80"
                rel="noreferrer"
              >
                open ↗
              </a>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
