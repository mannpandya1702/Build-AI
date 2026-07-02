"use client";

// /leads/[id] (spec §8.2, Phase 1 scope): overview + builds + emails + full event timeline.
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

interface Detail {
  lead: Record<string, unknown> & { company_name: string; status: string; score: number | null };
  events: { id: string; agent: string; level: string; type: string; message: string | null; created_at: string }[];
  builds: { id: string; kind: string; status: string; deploy_url: string | null; created_at: string }[];
  emails: { id: string; direction: string; kind: string; subject: string | null; status: string; created_at: string }[];
}

export default function LeadPage() {
  const { id } = useParams<{ id: string }>();
  const [d, setD] = useState<Detail | null>(null);

  useEffect(() => {
    let live = true;
    const tick = async () => {
      const res = await fetch(`/api/leads/${id}`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (live) setD(data);
      }
    };
    tick();
    const t = setInterval(tick, 2000);
    return () => {
      live = false;
      clearInterval(t);
    };
  }, [id]);

  if (!d) return <p className="text-sm text-zinc-500">Loading...</p>;
  const L = d.lead;

  return (
    <div>
      <h1 className="text-xl font-bold">{L.company_name}</h1>
      <p className="mt-1 text-sm text-zinc-500">
        status <span className="font-mono text-emerald-400">{L.status}</span>
        {L.score != null && <> · score {String(L.score)}</>}
      </p>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <section>
          <h2 className="text-sm font-bold uppercase tracking-wide text-zinc-400">Builds</h2>
          <div className="mt-2 space-y-2">
            {d.builds.map((b) => (
              <div key={b.id} className="rounded border border-zinc-800 bg-zinc-900/40 px-3 py-2 text-sm">
                <span className="font-mono text-zinc-300">{b.kind}</span> · {b.status} ·{" "}
                {b.deploy_url && (
                  <a className="text-emerald-400 underline" href={b.deploy_url} target="_blank">
                    {b.deploy_url}
                  </a>
                )}
              </div>
            ))}
            {d.builds.length === 0 && <p className="text-sm text-zinc-600">none yet</p>}
          </div>

          <h2 className="mt-6 text-sm font-bold uppercase tracking-wide text-zinc-400">Emails</h2>
          <div className="mt-2 space-y-2">
            {d.emails.map((e) => (
              <div key={e.id} className="rounded border border-zinc-800 bg-zinc-900/40 px-3 py-2 text-sm">
                <span className={e.direction === "inbound" ? "text-sky-400" : "text-zinc-300"}>{e.direction}</span> ·{" "}
                {e.kind} · {e.subject ?? "(no subject)"} · <span className="text-zinc-500">{e.status}</span>
              </div>
            ))}
            {d.emails.length === 0 && <p className="text-sm text-zinc-600">none yet</p>}
          </div>
        </section>

        <section>
          <h2 className="text-sm font-bold uppercase tracking-wide text-zinc-400">Timeline</h2>
          <div className="mt-2 space-y-1 font-mono text-xs">
            {d.events.map((e) => (
              <div key={e.id} className="flex gap-3 rounded border border-zinc-900 bg-zinc-900/40 px-3 py-1.5">
                <span className="w-20 shrink-0 text-zinc-500">{new Date(e.created_at).toLocaleTimeString()}</span>
                <span className="w-20 shrink-0 text-zinc-300">{e.agent}</span>
                <span className="w-44 shrink-0 text-zinc-400">{e.type}</span>
                <span className="text-zinc-200">{e.message}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
