"use client";

// /activity (spec §8.6): live tail of agent_events with level filters (skill: dashboards need
// filtering). Migrated to TanStack Query: no hand-rolled poller, pauses on hidden tabs, real
// error state with retry (the audit's "silent failures" finding). Supabase Realtime in production.
import { Card, Empty, FilterChip, PageHeader, Skeleton } from "@/components/ui";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";

interface Ev {
  id: string;
  agent: string;
  lead_id: string | null;
  level: "debug" | "info" | "warn" | "error";
  type: string;
  message: string | null;
  created_at: string;
}

const LEVELS = ["all", "info", "warn", "error"] as const;
const LEVEL_STYLES: Record<Ev["level"], string> = {
  debug: "text-faint",
  info: "text-ok",
  warn: "text-warn",
  error: "text-danger",
};

async function fetchEvents(): Promise<Ev[]> {
  const res = await fetch("/api/events", { cache: "no-store" });
  if (!res.ok) throw new Error(`events ${res.status}`);
  return (await res.json()).events as Ev[];
}

export default function ActivityPage() {
  const [level, setLevel] = useState<(typeof LEVELS)[number]>("all");
  const {
    data: events,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["events"],
    queryFn: fetchEvents,
    refetchInterval: 2000,
  });

  const shown = useMemo(() => {
    if (!events) return [];
    if (level === "all") return events.filter((e) => e.level !== "debug");
    return events.filter((e) => e.level === level);
  }, [events, level]);

  return (
    <div>
      <PageHeader title="Activity" description="Live tail of agent events (2s poll in local dev).">
        <div className="flex gap-1.5">
          {LEVELS.map((l) => (
            <FilterChip key={l} active={level === l} onClick={() => setLevel(l)}>
              {l}
            </FilterChip>
          ))}
        </div>
      </PageHeader>

      {isLoading && <Skeleton rows={6} />}
      {isError && (
        <Card className="flex items-center justify-between gap-3 px-4 py-3">
          <p className="text-sm text-muted">Couldn't load the event stream.</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Retry
          </Button>
        </Card>
      )}
      {events && shown.length === 0 && <Empty>no events at this level</Empty>}

      <div className="space-y-1 font-display text-xs">
        {shown.map((e) => (
          <div key={e.id} className="flex gap-3 rounded-md border border-line/50 bg-surface/60 px-3 py-1.5">
            <span className="w-20 shrink-0 text-faint">{new Date(e.created_at).toLocaleTimeString()}</span>
            <span className={`w-12 shrink-0 uppercase ${LEVEL_STYLES[e.level]}`}>{e.level}</span>
            <span className="w-20 shrink-0 text-muted">{e.agent}</span>
            <span className="w-44 shrink-0 truncate text-faint">{e.type}</span>
            <span className="min-w-0 flex-1 truncate text-muted">{e.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
