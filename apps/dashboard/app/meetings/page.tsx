"use client";

// /meetings (spec §8.4): booked intro calls. Lights up when Phase 5 Cal.com booking goes live.
import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, PageHeader, StatusPill, Empty, Skeleton } from "@/components/ui";

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

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Meetings" description="Booked intro calls, straight from the Cal.com webhook." />
      {!m && <Skeleton rows={3} />}
      <div className="space-y-1.5">
        {m && m.length === 0 && <Empty hint="Bookings arrive automatically once outreach is live.">no meetings booked yet</Empty>}
        {(m ?? []).map((mt) => (
          <Card key={mt.id} className="flex flex-wrap items-center gap-3 px-4 py-3 transition-colors duration-150 hover:border-faint/40">
            <div className="min-w-0">
              <Link href={`/leads/${mt.lead_id}`} className="cursor-pointer font-medium text-ink transition-colors duration-150 hover:text-data">{mt.company_name}</Link>
              <p className="truncate text-xs text-faint">{mt.title ?? "Intro call"} · {mt.city}</p>
            </div>
            <div className="ml-auto text-right">
              <p className="font-display text-[13px] text-ink">{mt.start_time ? new Date(mt.start_time).toLocaleString() : "—"}</p>
              <StatusPill status={mt.status} />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
