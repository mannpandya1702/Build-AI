"use client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn, usd } from "@/lib/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, CircleDollarSign, Inbox, Phone, TriangleAlert } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

interface ShortlistLead {
  id: string;
  company_name: string;
  industry: string | null;
  city: string | null;
  region: string | null;
  score: number | null;
  score_breakdown: Record<string, unknown> | null;
  contact_email: string | null;
  contact_phone: string | null;
  website_url: string | null;
  approved: boolean;
}
interface ShortlistResponse {
  leads: ShortlistLead[];
  est_cost_per_lead: number;
}

async function fetchShortlist(): Promise<ShortlistResponse> {
  const res = await fetch("/api/shortlist", { cache: "no-store" });
  if (!res.ok) throw new Error(`shortlist ${res.status}`);
  return res.json();
}

function scoreTone(score: number | null): "ok" | "warn" | "danger" | "neutral" {
  if (score == null) return "neutral";
  if (score >= 70) return "ok";
  if (score >= 45) return "warn";
  return "danger";
}

export default function ShortlistPage() {
  const qc = useQueryClient();
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["shortlist"],
    queryFn: fetchShortlist,
    refetchInterval: 5000,
  });
  const leads = data?.leads ?? [];
  const estCost = data?.est_cost_per_lead ?? 6;

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [cursor, setCursor] = useState(0);
  const rowRefs = useRef<(HTMLDivElement | null)[]>([]);

  const toggle = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const approve = useMutation({
    mutationFn: async (leadIds: string[]) => {
      const res = await fetch("/api/shortlist/approve", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ leadIds }),
      });
      if (!res.ok) throw new Error(`approve ${res.status}`);
      return (await res.json()) as { approved: string[] };
    },
    onSuccess: (r) => {
      toast.success(`Approved ${r.approved.length} lead${r.approved.length === 1 ? "" : "s"} for build`, {
        description: `≈ ${usd(r.approved.length * estCost)} of build spend authorized`,
      });
      setSelected(new Set());
      qc.invalidateQueries({ queryKey: ["shortlist"] });
    },
    onError: () => toast.error("Approval failed — try again"),
  });

  // Keyboard-first (spec §12): j/k move, space selects, a approves the focused lead.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if ((e.key === "j" || e.key === "ArrowDown") && leads.length) {
        e.preventDefault();
        setCursor((c) => Math.min(c + 1, leads.length - 1));
      } else if ((e.key === "k" || e.key === "ArrowUp") && leads.length) {
        e.preventDefault();
        setCursor((c) => Math.max(c - 1, 0));
      } else if (e.key === " " && leads[cursor]) {
        e.preventDefault();
        toggle(leads[cursor].id);
      } else if (e.key === "a" && leads[cursor] && !leads[cursor].approved) {
        e.preventDefault();
        approve.mutate([leads[cursor].id]);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [leads, cursor, toggle, approve]);

  useEffect(() => {
    rowRefs.current[cursor]?.scrollIntoView({ block: "nearest" });
  }, [cursor]);

  const selectedCount = selected.size;

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-5 flex flex-wrap items-end justify-between gap-3 border-b border-line pb-4">
        <div>
          <h1 className="font-display text-xl font-semibold tracking-tight text-ink">Shortlist</h1>
          <p className="mt-1 text-sm text-muted">
            Qualified leads awaiting your approval. Nothing is built — and no budget is spent — until you
            approve.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone="data" dot>
            {leads.length} awaiting
          </Badge>
          <Badge tone="accent">
            <CircleDollarSign className="h-3.5 w-3.5" /> ~{usd(estCost)} / build
          </Badge>
          <Button
            variant="primary"
            disabled={selectedCount === 0 || approve.isPending}
            onClick={() => approve.mutate([...selected])}
          >
            <Check className="h-4 w-4" />
            {selectedCount === 0
              ? "Approve selected"
              : `Approve ${selectedCount} ≈ ${usd(selectedCount * estCost)}`}
          </Button>
        </div>
      </header>

      {isLoading && (
        <div className="space-y-2" aria-hidden>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-20 w-full" />
          ))}
        </div>
      )}

      {isError && (
        <Card className="grid place-items-center gap-2 border-dashed px-4 py-10 text-center">
          <TriangleAlert className="h-6 w-6 text-danger" />
          <p className="text-sm text-muted">Couldn't load the shortlist.</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Retry
          </Button>
        </Card>
      )}

      {!isLoading && !isError && leads.length === 0 && (
        <Card className="grid place-items-center gap-1.5 border-dashed px-4 py-12 text-center">
          <Inbox className="h-7 w-7 text-faint" />
          <p className="text-sm text-muted">No leads awaiting approval.</p>
          <p className="text-xs text-faint">
            Qualified leads land here for your go-ahead before any paid build.
          </p>
        </Card>
      )}

      <ul className="space-y-2">
        {leads.map((lead, i) => {
          const isSel = selected.has(lead.id);
          const focused = i === cursor;
          return (
            <li key={lead.id}>
              <Card
                ref={(el) => {
                  rowRefs.current[i] = el;
                }}
                interactive
                className={cn(
                  "flex items-center gap-4 p-3.5",
                  focused && "ring-2 ring-data/50",
                  isSel && "border-accent/50 bg-accent/[0.04]",
                )}
                onClick={() => {
                  setCursor(i);
                  toggle(lead.id);
                }}
              >
                <input
                  type="checkbox"
                  checked={isSel}
                  onChange={() => toggle(lead.id)}
                  onClick={(e) => e.stopPropagation()}
                  aria-label={`Select ${lead.company_name}`}
                  className="h-4 w-4 shrink-0 accent-[rgb(var(--accent))]"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-display text-sm font-semibold text-ink">
                      {lead.company_name}
                    </span>
                    {lead.approved && (
                      <Badge tone="ok" dot>
                        approved
                      </Badge>
                    )}
                  </div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                    {lead.industry && <span>{lead.industry}</span>}
                    {(lead.city || lead.region) && (
                      <span>
                        {lead.city}
                        {lead.city && lead.region ? ", " : ""}
                        {lead.region}
                      </span>
                    )}
                    {lead.contact_phone && (
                      <span className="inline-flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {lead.contact_phone}
                      </span>
                    )}
                    {!lead.contact_email && <Badge tone="warn">no email — call first</Badge>}
                  </div>
                </div>
                <Badge tone={scoreTone(lead.score)}>score {lead.score ?? "—"}</Badge>
                {!lead.approved && (
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={(e) => {
                      e.stopPropagation();
                      approve.mutate([lead.id]);
                    }}
                    disabled={approve.isPending}
                  >
                    Approve
                  </Button>
                )}
              </Card>
            </li>
          );
        })}
      </ul>

      {leads.length > 0 && (
        <p className="mt-4 text-center text-xs text-faint">
          <kbd className="rounded bg-surface2 px-1">j</kbd>/<kbd className="rounded bg-surface2 px-1">k</kbd>{" "}
          move · <kbd className="rounded bg-surface2 px-1">space</kbd> select ·{" "}
          <kbd className="rounded bg-surface2 px-1">a</kbd> approve focused
        </p>
      )}
    </div>
  );
}
