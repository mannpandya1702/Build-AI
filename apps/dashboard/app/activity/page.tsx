"use client";

// /activity (spec §8.6): live tail of agent_events. Poll-based in local dev (2s), swaps to
// Supabase Realtime channels when SUPABASE_URL is configured.
import { useEffect, useState } from "react";

interface Ev {
  id: string;
  agent: string;
  lead_id: string | null;
  level: "debug" | "info" | "warn" | "error";
  type: string;
  message: string | null;
  created_at: string;
}

const LEVEL_STYLES: Record<Ev["level"], string> = {
  debug: "text-zinc-500",
  info: "text-emerald-400",
  warn: "text-amber-400",
  error: "text-red-400",
};

export default function ActivityPage() {
  const [events, setEvents] = useState<Ev[]>([]);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <div>
      <h1 className="text-xl font-bold">Activity</h1>
      <p className="mt-1 text-sm text-zinc-500">Live tail of agent_events (2s poll in local dev).</p>
      {error && <p className="mt-4 text-sm text-red-400">DB error: {error}</p>}
      <div className="mt-6 space-y-1 font-mono text-xs">
        {events.map((e) => (
          <div key={e.id} className="flex gap-3 rounded border border-zinc-900 bg-zinc-900/40 px-3 py-2">
            <span className="w-40 shrink-0 text-zinc-500">{new Date(e.created_at).toLocaleTimeString()}</span>
            <span className={`w-14 shrink-0 uppercase ${LEVEL_STYLES[e.level]}`}>{e.level}</span>
            <span className="w-24 shrink-0 text-zinc-300">{e.agent}</span>
            <span className="w-48 shrink-0 text-zinc-400">{e.type}</span>
            <span className="text-zinc-200">{e.message}</span>
          </div>
        ))}
        {events.length === 0 && !error && <p className="text-zinc-600">No events yet. Seed one: pnpm seed-event</p>}
      </div>
    </div>
  );
}
