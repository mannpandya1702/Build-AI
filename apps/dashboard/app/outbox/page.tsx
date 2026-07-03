"use client";

// /outbox (spec §8.3): approval queue, calls due, sent log, inbound replies. The heart of Phase 5;
// scaffolded now with live (currently empty) data + honest empty states.
import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, SectionTitle, Empty } from "@/components/ui";

interface Email { id: string; direction: string; kind: string; subject: string | null; status: string; company_name: string; lead_id: string }
interface Call { lead_id: string; company_name: string; contact_phone: string | null; city: string | null }
interface Outbox { awaiting: Email[]; sent: Email[]; replies: Email[]; callsDue: Call[] }

export default function OutboxPage() {
  const [o, setO] = useState<Outbox | null>(null);
  useEffect(() => {
    let live = true;
    const tick = async () => { const res = await fetch("/api/outbox", { cache: "no-store" }); if (res.ok) { const d = await res.json(); if (live) setO(d); } };
    tick();
    const t = setInterval(tick, 4000);
    return () => { live = false; clearInterval(t); };
  }, []);
  if (!o) return <div className="animate-pulse text-sm text-zinc-600">Loading outbox…</div>;

  const Row = ({ e }: { e: Email }) => (
    <Card className="flex flex-wrap items-center gap-2 px-3 py-2 text-sm">
      <Link href={`/leads/${e.lead_id}`} className="font-medium text-zinc-100 hover:text-sky-400">{e.company_name}</Link>
      <span className="text-zinc-500">{e.subject ?? e.kind}</span>
      <span className="ml-auto text-xs text-zinc-500">{e.status}</span>
    </Card>
  );

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-xl font-bold">Outbox</h1>
        <p className="mt-1 text-sm text-zinc-500">Approve outreach, work your call list, track replies. Sending goes live with Phase 5.</p>
      </div>

      <section>
        <SectionTitle>Awaiting approval ({o.awaiting.length})</SectionTitle>
        <div className="mt-2 space-y-2">{o.awaiting.length ? o.awaiting.map((e) => <Row key={e.id} e={e} />) : <Empty>nothing to approve</Empty>}</div>
      </section>

      <section>
        <SectionTitle>Calls due today ({o.callsDue.length})</SectionTitle>
        <div className="mt-2 space-y-2">
          {o.callsDue.length ? o.callsDue.map((c) => (
            <Card key={c.lead_id} className="flex flex-wrap items-center gap-2 px-3 py-2 text-sm">
              <Link href={`/leads/${c.lead_id}`} className="font-medium text-zinc-100 hover:text-sky-400">{c.company_name}</Link>
              <span className="text-zinc-500">{c.city}</span>
              {c.contact_phone && <span className="ml-auto font-mono text-emerald-400">{c.contact_phone}</span>}
            </Card>
          )) : <Empty>no Touch-2 calls pending</Empty>}
        </div>
      </section>

      <section>
        <SectionTitle>Replies ({o.replies.length})</SectionTitle>
        <div className="mt-2 space-y-2">{o.replies.length ? o.replies.map((e) => <Row key={e.id} e={e} />) : <Empty>no replies yet</Empty>}</div>
      </section>

      <section>
        <SectionTitle>Sent ({o.sent.length})</SectionTitle>
        <div className="mt-2 space-y-2">{o.sent.length ? o.sent.map((e) => <Row key={e.id} e={e} />) : <Empty>no sends yet</Empty>}</div>
      </section>
    </div>
  );
}
