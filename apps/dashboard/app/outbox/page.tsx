"use client";

// /outbox (spec §8.3): the approval queue, calls due, replies, sent log — plus the mock dev panel
// (simulate reply / booking). The approval card is modeled on the 21st.dev "Email Client Card"
// pattern (from/subject + body preview + action slot). Approve/reject POST to the API; the worker
// gate-checks + sends. Voice-lint shown inline.
import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, SectionTitle, Empty } from "@/components/ui";

interface Email { id: string; direction: string; kind: string; subject: string | null; body_text: string | null; status: string; company_name: string; lead_id: string; contact_email: string | null }
interface Call { lead_id: string; company_name: string; contact_phone: string | null; city: string | null }
interface Outbox { awaiting: Email[]; sent: Email[]; replies: Email[]; callsDue: Call[] }

const BANNED = ["i hope this email finds you well", "i wanted to reach out", "circle back", "touch base", "just following up", "synergy", "game-changer", "leverage", "cutting-edge", "elevate", "seamless", "unlock", "reach out"];
function voiceIssues(text: string): string[] {
  const out: string[] = [];
  if (/[—–]/.test(text)) out.push("em dash");
  const l = text.toLowerCase();
  for (const b of BANNED) if (l.includes(b)) out.push(b);
  return out;
}

async function post(url: string, body: any) { await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }); }

export default function OutboxPage() {
  const [o, setO] = useState<Outbox | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [devTools, setDevTools] = useState(false);

  useEffect(() => {
    let live = true;
    const tick = async () => { const res = await fetch("/api/outbox", { cache: "no-store" }); if (res.ok) { const d = await res.json(); if (live) setO(d); } };
    tick();
    const t = setInterval(tick, 3000);
    fetch("/api/dev/enabled").then((r) => r.json()).then((d) => { if (live) setDevTools(Boolean(d.enabled)); }).catch(() => undefined);
    return () => { live = false; clearInterval(t); };
  }, []);
  if (!o) return <div className="animate-pulse text-sm text-zinc-600">Loading outbox…</div>;

  const act = async (fn: () => Promise<void>) => { setBusy(true); await fn(); setBusy(false); };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-bold">Outbox</h1>
        <p className="mt-1 text-sm text-zinc-500">Approve outreach, work your calls, track replies. Sending is gated (suppression, caps, CAN-SPAM).</p>
      </div>

      {/* Approval queue — the 21st Email Client Card pattern */}
      <section>
        <SectionTitle>Awaiting approval ({o.awaiting.length})</SectionTitle>
        <div className="mt-2 space-y-2">
          {o.awaiting.length === 0 && <Empty>nothing to approve</Empty>}
          {o.awaiting.map((e) => {
            const issues = voiceIssues(`${e.subject}\n${e.body_text ?? ""}`);
            const expanded = open === e.id;
            return (
              <Card key={e.id} className="overflow-hidden">
                <button onClick={() => setOpen(expanded ? null : e.id)} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-zinc-900/40">
                  <span className="font-semibold text-zinc-100">{e.company_name}</span>
                  <span className="truncate text-zinc-500">{e.subject}</span>
                  <span className={`ml-auto shrink-0 rounded px-1.5 py-0.5 text-xs ${issues.length ? "bg-rose-500/15 text-rose-300" : "bg-emerald-500/15 text-emerald-300"}`}>
                    {issues.length ? `voice: ${issues.length}` : "voice ✓"}
                  </span>
                </button>
                {expanded && (
                  <div className="border-t border-zinc-800 px-3 py-3">
                    <p className="mb-2 text-xs text-zinc-500">to {e.contact_email ?? "[no email]"}</p>
                    <pre className="max-h-72 overflow-auto whitespace-pre-wrap rounded-lg bg-zinc-950 p-3 text-xs leading-relaxed text-zinc-300">{e.body_text}</pre>
                    {issues.length > 0 && <p className="mt-2 text-xs text-rose-400">voice issues: {issues.join(", ")}</p>}
                    <div className="mt-3 flex gap-2">
                      <button disabled={busy} onClick={() => act(() => post("/api/outbox/approve", { emailId: e.id }))}
                        className="rounded-md bg-emerald-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50">Approve &amp; send</button>
                      <button disabled={busy} onClick={() => act(() => post("/api/outbox/reject", { emailId: e.id }))}
                        className="rounded-md border border-zinc-700 px-4 py-1.5 text-sm text-zinc-300 hover:bg-zinc-800 disabled:opacity-50">Reject</button>
                      <Link href={`/leads/${e.lead_id}`} className="ml-auto self-center text-xs text-sky-400 underline">lead ↗</Link>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </section>

      <section>
        <SectionTitle>Calls due today ({o.callsDue.length})</SectionTitle>
        <div className="mt-2 space-y-2">
          {o.callsDue.length ? o.callsDue.map((c) => (
            <Card key={c.lead_id} className="flex flex-wrap items-center gap-2 px-3 py-2 text-sm">
              <Link href={`/leads/${c.lead_id}`} className="font-medium text-zinc-100 hover:text-sky-400">{c.company_name}</Link>
              <span className="text-zinc-500">{c.city}</span>
              {c.contact_phone && <span className="ml-auto font-mono text-emerald-400">{c.contact_phone}</span>}
              {/* mock: simulate the outcome of the call landing a booking */}
              <button disabled={busy} onClick={() => act(() => post("/api/dev/simulate-booking", { leadId: c.lead_id }))}
                className="rounded border border-zinc-700 px-2 py-1 text-xs text-zinc-400 hover:bg-zinc-800">simulate booking</button>
            </Card>
          )) : <Empty>no Touch-2 calls pending</Empty>}
        </div>
      </section>

      <section>
        <SectionTitle>Replies ({o.replies.length})</SectionTitle>
        <div className="mt-2 space-y-2">{o.replies.length ? o.replies.map((e) => (
          <Card key={e.id} className="flex flex-wrap items-center gap-2 px-3 py-2 text-sm">
            <Link href={`/leads/${e.lead_id}`} className="font-medium text-sky-400">{e.company_name}</Link>
            <span className="truncate text-zinc-400">{e.body_text ?? e.subject}</span>
          </Card>
        )) : <Empty>no replies yet</Empty>}</div>
      </section>

      <section>
        <SectionTitle>Sent ({o.sent.length})</SectionTitle>
        <div className="mt-2 space-y-2">{o.sent.length ? o.sent.map((e) => (
          <Card key={e.id} className="flex flex-wrap items-center gap-2 px-3 py-2 text-sm">
            <Link href={`/leads/${e.lead_id}`} className="font-medium text-zinc-100 hover:text-sky-400">{e.company_name}</Link>
            <span className="text-zinc-500">{e.subject}</span><span className="ml-auto text-xs text-emerald-400">sent</span>
          </Card>
        )) : <Empty>no sends yet</Empty>}</div>
      </section>

      {/* Mock dev panel (spec §11): inject replies to exercise the sequence without real email.
          Hidden on hosted deployments (the API also 403s there). */}
      {devTools && (
      <section className="rounded-xl border border-dashed border-zinc-800 p-3">
        <SectionTitle>Dev panel (mock)</SectionTitle>
        <p className="mt-1 text-xs text-zinc-600">Inject a reply for the most recently contacted lead to exercise the flow.</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {["interested", "not_interested", "unsubscribe"].map((cls) => (
            <button key={cls} disabled={busy || o.callsDue.length === 0}
              onClick={() => act(() => post("/api/dev/simulate-reply", { leadId: o.callsDue[0]?.lead_id, classification: cls }))}
              className="rounded border border-zinc-700 px-2.5 py-1 text-xs text-zinc-300 hover:bg-zinc-800 disabled:opacity-40">
              reply: {cls.replace("_", " ")}
            </button>
          ))}
        </div>
      </section>
      )}
    </div>
  );
}
