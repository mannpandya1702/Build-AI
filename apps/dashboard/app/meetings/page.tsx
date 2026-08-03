"use client";

// /meetings (spec §8.4): booked intro calls. Lights up when Phase 5 Cal.com booking goes live.
// Migrated to TanStack Query: no hand-rolled poller, pauses on hidden tabs, real error state.
import { Card, Empty, PageHeader, Skeleton, StatusPill } from "@/components/ui";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

interface Meeting {
  id: string;
  title: string | null;
  start_time: string | null;
  timezone: string | null;
  status: string;
  attendee: unknown;
  lead_id: string;
  company_name: string;
  city: string | null;
}

async function fetchMeetings(): Promise<Meeting[]> {
  const res = await fetch("/api/meetings", { cache: "no-store" });
  if (!res.ok) throw new Error(`meetings ${res.status}`);
  return (await res.json()).meetings as Meeting[];
}

export default function MeetingsPage() {
  const {
    data: meetings,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["meetings"],
    queryFn: fetchMeetings,
    refetchInterval: 5000,
  });

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Meetings" description="Booked intro calls, straight from the Cal.com webhook." />
      {isLoading && <Skeleton rows={3} />}
      {isError && (
        <Card className="flex items-center justify-between gap-3 px-4 py-3">
          <p className="text-sm text-muted">Couldn't load meetings.</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Retry
          </Button>
        </Card>
      )}
      <div className="space-y-1.5">
        {meetings && meetings.length === 0 && (
          <Empty hint="Bookings arrive automatically once outreach is live.">no meetings booked yet</Empty>
        )}
        {(meetings ?? []).map((mt) => (
          <Card
            key={mt.id}
            className="flex flex-wrap items-center gap-3 px-4 py-3 transition-colors duration-150 hover:border-faint/40"
          >
            <div className="min-w-0">
              <Link
                href={`/leads/${mt.lead_id}`}
                className="cursor-pointer font-medium text-ink transition-colors duration-150 hover:text-data"
              >
                {mt.company_name}
              </Link>
              <p className="truncate text-xs text-faint">
                {mt.title ?? "Intro call"} · {mt.city}
              </p>
            </div>
            <div className="ml-auto text-right">
              <p className="font-display text-[13px] text-ink">
                {mt.start_time ? new Date(mt.start_time).toLocaleString() : "—"}
              </p>
              <StatusPill status={mt.status} />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
