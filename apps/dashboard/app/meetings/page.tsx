"use client";

// /meetings (spec §8.4): booked intro calls. Scaffolded with live (currently empty) data; lights up
// when Phase 5 Cal.com booking is wired.
import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, StatusPill, Empty } from "@/components/ui";

interface Meeting { id: string; title: string | null; start_time: string | null; timezone: string | null; status: string; attendee: any; lead_id: string; company_name: string; city: string | null }

export default function MeetingsPage() {
  const [m, setM] = useState<Meeting[] | null>(null);
  useEffect(() => {
    let live = true;
    const tick = async () => { const res = await fetch("/api/meetings", { cache: "no-store" }); if (res.ok) { const d = await res.json(); if (live) setM(d.meetings); } };
    tick();
    const t = setInterval(tick, 5000);
    return () => { live = false; clearInterval(t); };
  }, []);
  if (!m) return <div className="animate-pulse text-sm text-zinc-600">Loading meetings…</div>;

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-xl font-bold">Meetings</h1>
      <p className="mt-1 text-sm text-zinc-500">Booked intro calls. Booking goes live with Phase 5 (Cal.com).</p>
      <div className="mt-6 space-y-2">
        {m.length === 0 && <Empty>no meetings booked yet</Empty>}
        {m.map((mt) => (
          <Card key={mt.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
            <div>
              <Link href={`/leads/${mt.lead_id}`} className="font-semibold text-zinc-100 hover:text-sky-400">{mt.company_name}</Link>
              <p className="text-xs text-zinc-500">{mt.title ?? "Intro call"} · {mt.city}</p>
            </div>
            <div className="ml-auto text-right">
              <p className="text-sm text-zinc-200">{mt.start_time ? new Date(mt.start_time).toLocaleString() : "—"}</p>
              <StatusPill status={mt.status} />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
