"use client";

// /outbox (spec §8.3): approval queue, calls due, replies, sent log, mock dev panel. Approve is the
// page's one primary (amber) action; everything else is subordinate (skill: primary-action).
// Migrated to TanStack Query: the poller is gone, actions are useMutation + invalidate so the queue
// refreshes the instant you approve/reject instead of waiting up to 3s for the next poll.
import { Card, Empty, PageHeader, SectionTitle, Skeleton } from "@/components/ui";
import { Button } from "@/components/ui/button";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";

interface Email {
  id: string;
  direction: string;
  kind: string;
  subject: string | null;
  body_text: string | null;
  status: string;
  company_name: string;
  lead_id: string;
  contact_email: string | null;
}
interface Call {
  lead_id: string;
  company_name: string;
  contact_phone: string | null;
  city: string | null;
  deploy_url?: string;
}
interface Outbox {
  awaiting: Email[];
  queued: Email[];
  blocked: Email[];
  sent: Email[];
  replies: Email[];
  callsDue: Call[];
  callFirst: Call[];
  blockReasons: Record<string, string>;
}

const BANNED = [
  "i hope this email finds you well",
  "i wanted to reach out",
  "circle back",
  "touch base",
  "just following up",
  "synergy",
  "game-changer",
  "leverage",
  "cutting-edge",
  "elevate",
  "seamless",
  "unlock",
  "reach out",
];
function voiceIssues(text: string): string[] {
  const out: string[] = [];
  if (/[—–]/.test(text)) out.push("em dash");
  const l = text.toLowerCase();
  for (const b of BANNED) if (l.includes(b)) out.push(b);
  return out;
}

async function fetchOutbox(): Promise<Outbox> {
  const res = await fetch("/api/outbox", { cache: "no-store" });
  if (!res.ok) throw new Error(`outbox ${res.status}`);
  return (await res.json()) as Outbox;
}

async function post(url: string, body: Record<string, unknown>) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${url} ${res.status}`);
}

export default function OutboxPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState<string | null>(null);

  const {
    data: o,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["outbox"],
    queryFn: fetchOutbox,
    refetchInterval: 3000,
  });
  const { data: devTools } = useQuery({
    queryKey: ["dev-enabled"],
    queryFn: async () => {
      const r = await fetch("/api/dev/enabled");
      if (!r.ok) return false;
      return Boolean((await r.json()).enabled);
    },
    staleTime: Number.POSITIVE_INFINITY,
    refetchOnWindowFocus: false,
  });

  // One shared action mutation: approve/reject/simulate all POST + invalidate the queue.
  const action = useMutation({
    mutationFn: ({ url, body }: { url: string; body: Record<string, unknown> }) => post(url, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["outbox"] }),
  });
  const busy = action.isPending;
  const act = (url: string, body: Record<string, unknown>) => action.mutate({ url, body });

  const Row = ({ e, note, tone }: { e: Email; note?: string; tone?: "warn" | "danger" }) => (
    <Card className="px-3 py-2 text-sm transition-colors duration-150 hover:border-faint/40">
      <div className="flex flex-wrap items-center gap-2">
        <Link href={`/leads/${e.lead_id}`} className="cursor-pointer font-medium text-ink hover:text-data">
          {e.company_name}
        </Link>
        <span className="truncate text-muted">{e.subject ?? e.kind}</span>
        <span className="ml-auto font-display text-[11px] text-faint">{e.status}</span>
      </div>
      {note && <p className={`mt-1 text-xs ${tone === "danger" ? "text-danger" : "text-warn"}`}>{note}</p>}
    </Card>
  );

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Outbox"
        description="Approve outreach, work your calls, track replies. Every send passes the gate (suppression, caps, CAN-SPAM)."
      />

      {isLoading && <Skeleton rows={5} />}
      {isError && (
        <Card className="flex items-center justify-between gap-3 px-4 py-3">
          <p className="text-sm text-muted">Couldn't load the outbox.</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Retry
          </Button>
        </Card>
      )}

      {o && (
        <div className="space-y-6">
          <section>
            <SectionTitle>Awaiting approval ({o.awaiting.length})</SectionTitle>
            <div className="mt-2 space-y-1.5">
              {o.awaiting.length === 0 && <Empty>nothing to approve</Empty>}
              {o.awaiting.map((e) => {
                const issues = voiceIssues(`${e.subject}\n${e.body_text ?? ""}`);
                const expanded = open === e.id;
                return (
                  <Card key={e.id} className="overflow-hidden">
                    <button
                      onClick={() => setOpen(expanded ? null : e.id)}
                      aria-expanded={expanded}
                      className="flex w-full cursor-pointer items-center gap-2 px-3 py-2.5 text-left text-sm transition-colors duration-150 hover:bg-surface2/50"
                    >
                      <span className="font-medium text-ink">{e.company_name}</span>
                      <span className="truncate text-muted">{e.subject}</span>
                      <span
                        className={`ml-auto shrink-0 rounded-md px-1.5 py-0.5 font-display text-[11px] ${issues.length ? "bg-danger/10 text-danger" : "bg-ok/10 text-ok"}`}
                      >
                        {issues.length ? `voice: ${issues.length}` : "voice ✓"}
                      </span>
                    </button>
                    {expanded && (
                      <div className="border-t border-line px-3 py-3">
                        <p className="mb-2 font-display text-[11px] text-faint">
                          to {e.contact_email ?? "[no email]"}
                        </p>
                        <pre className="max-h-72 overflow-auto whitespace-pre-wrap rounded-lg bg-bg p-3 font-display text-xs leading-relaxed text-muted">
                          {e.body_text}
                        </pre>
                        {issues.length > 0 && (
                          <p className="mt-2 text-xs text-danger">voice issues: {issues.join(", ")}</p>
                        )}
                        <div className="mt-3 flex items-center gap-2">
                          <Button
                            variant="primary"
                            disabled={busy}
                            onClick={() => act("/api/outbox/approve", { emailId: e.id })}
                          >
                            Approve & send
                          </Button>
                          <Button
                            variant="outline"
                            disabled={busy}
                            onClick={() => act("/api/outbox/reject", { emailId: e.id })}
                          >
                            Reject
                          </Button>
                          <Link
                            href={`/leads/${e.lead_id}`}
                            className="ml-auto cursor-pointer self-center font-display text-[11px] text-data underline underline-offset-2"
                          >
                            lead ↗
                          </Link>
                        </div>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          </section>

          {o.queued.length > 0 && (
            <section>
              <SectionTitle>Approved, waiting to send ({o.queued.length})</SectionTitle>
              <p className="mt-1 text-xs text-faint">
                These send the next time the worker is Running. If it stays paused or offline, they wait here.
              </p>
              <div className="mt-2 space-y-1.5">
                {o.queued.map((e) => (
                  <Row
                    key={e.id}
                    e={e}
                    note={e.contact_email ? undefined : "lead has no contact email: this will fail the gate"}
                    tone="warn"
                  />
                ))}
              </div>
            </section>
          )}

          {o.blocked.length > 0 && (
            <section>
              <SectionTitle>Blocked / rejected ({o.blocked.length})</SectionTitle>
              <div className="mt-2 space-y-1.5">
                {o.blocked.map((e) => (
                  <Row
                    key={e.id}
                    e={e}
                    note={o.blockReasons[e.lead_id] ?? "gate refused or draft rejected"}
                    tone="danger"
                  />
                ))}
              </div>
            </section>
          )}

          {o.callFirst.length > 0 && (
            <section>
              <SectionTitle>Call-first leads ({o.callFirst.length})</SectionTitle>
              <p className="mt-1 text-xs text-faint">
                Demo is live but no email exists for these businesses. The call is Touch 1; the demo is the
                reason for the call.
              </p>
              <div className="mt-2 space-y-1.5">
                {o.callFirst.map((c) => (
                  <Card key={c.lead_id} className="flex flex-wrap items-center gap-2 px-3 py-2 text-sm">
                    <Link
                      href={`/leads/${c.lead_id}`}
                      className="cursor-pointer font-medium text-ink hover:text-data"
                    >
                      {c.company_name}
                    </Link>
                    <span className="text-faint">{c.city}</span>
                    {c.deploy_url && (
                      <a
                        href={c.deploy_url}
                        target="_blank"
                        rel="noreferrer"
                        className="cursor-pointer font-display text-[11px] text-data underline underline-offset-2"
                      >
                        demo ↗
                      </a>
                    )}
                    {c.contact_phone && (
                      <span className="ml-auto font-display text-[13px] font-semibold text-ok">
                        {c.contact_phone}
                      </span>
                    )}
                  </Card>
                ))}
              </div>
            </section>
          )}

          <section>
            <SectionTitle>Calls due today ({o.callsDue.length})</SectionTitle>
            <div className="mt-2 space-y-1.5">
              {o.callsDue.length ? (
                o.callsDue.map((c) => (
                  <Card key={c.lead_id} className="flex flex-wrap items-center gap-2 px-3 py-2 text-sm">
                    <Link
                      href={`/leads/${c.lead_id}`}
                      className="cursor-pointer font-medium text-ink hover:text-data"
                    >
                      {c.company_name}
                    </Link>
                    <span className="text-faint">{c.city}</span>
                    {c.contact_phone && (
                      <span className="ml-auto font-display text-[13px] text-ok">{c.contact_phone}</span>
                    )}
                    {devTools && (
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={busy}
                        onClick={() => act("/api/dev/simulate-booking", { leadId: c.lead_id })}
                      >
                        simulate booking
                      </Button>
                    )}
                  </Card>
                ))
              ) : (
                <Empty>no Touch-2 calls pending</Empty>
              )}
            </div>
          </section>

          <section>
            <SectionTitle>Replies ({o.replies.length})</SectionTitle>
            <div className="mt-2 space-y-1.5">
              {o.replies.length ? (
                o.replies.map((e) => <Row key={e.id} e={e} />)
              ) : (
                <Empty>no replies yet</Empty>
              )}
            </div>
          </section>

          <section>
            <SectionTitle>Sent ({o.sent.length})</SectionTitle>
            <div className="mt-2 space-y-1.5">
              {o.sent.length ? o.sent.map((e) => <Row key={e.id} e={e} />) : <Empty>no sends yet</Empty>}
            </div>
          </section>

          {devTools && (
            <section className="rounded-card border border-dashed border-line p-3">
              <SectionTitle>Dev panel (mock)</SectionTitle>
              <p className="mt-1 text-xs text-faint">
                Inject a reply for the most recently contacted lead to exercise the flow.
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {["interested", "not_interested", "unsubscribe"].map((cls) => (
                  <Button
                    key={cls}
                    variant="ghost"
                    size="sm"
                    disabled={busy || o.callsDue.length === 0}
                    onClick={() =>
                      act("/api/dev/simulate-reply", {
                        leadId: o.callsDue[0]?.lead_id,
                        classification: cls,
                      })
                    }
                  >
                    reply: {cls.replace("_", " ")}
                  </Button>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
