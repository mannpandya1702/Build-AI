"use client";

import { Empty, FilterChip, PageHeader, Skeleton } from "@/components/ui";
// /activity (spec §8.6): live tail of agent_events with level filters (skill: dashboards need
// filtering). Poll-based locally; Supabase Realtime in production.
import { useEffect, useMemo, useState } from "react";

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

export default function ActivityPage() {
  const [events, setEvents] = useState<Ev[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [level, setLevel] = useState<(typeof LEVELS)[number]>("all");

  useEffect(() => {
    let live = true;
    const tick = async () => {
      try {
        const res = await fetch("/api/events", { cache: "no-store" });
        const data = await res.json();
        if (live) {
          setEvents(data.events);
          setError(null);
        }
      } catch (e) {
        if (live) setError((e as Error).message);
      }
    };
    tick();
    const t = setInterval(tick, 2000);
    return () => {
      live = false;
      clearInterval(t);
    };
  }, []);

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

      {error && <p className="mb-3 text-sm text-danger">DB error: {error}</p>}
      {!events && <Skeleton rows={6} />}
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
