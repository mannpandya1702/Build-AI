"use client";

// Worker on/off control (sidebar). Three honest states:
//   Running (green)  = process alive + processing enabled
//   Paused  (amber)  = process alive, processing disabled — inputs queue, nothing spends
//   Offline (gray)   = no heartbeat: the process itself is not running on the host (RUNBOOK §3);
//                      the toggle still sets the DESIRED state, applied when the process is back.
// Turning ON confirms first: it starts real builds/spend on everything that is queued.
//
// Demo limit: "build the top N demos first". The worker admits leads into design+build best score
// first and stops at N; setting a new number restarts the count from that moment. No limit = every
// qualified lead gets a demo.
import { useEffect, useState } from "react";

interface BatchState {
  size: number;
  used: number;
  remaining: number;
  started_at: string | null;
}
interface WorkerState {
  enabled: boolean;
  online: boolean;
  last_heartbeat: string | null;
  demo_batch: BatchState | null;
}

export default function WorkerSwitch() {
  const [s, setS] = useState<WorkerState | null>(null);
  const [busy, setBusy] = useState(false);
  const [n, setN] = useState("");
  const [batchBusy, setBatchBusy] = useState(false);

  async function refresh() {
    try {
      const r = await fetch("/api/worker", { cache: "no-store" });
      if (r.ok) setS(await r.json());
    } catch {
      /* boot race */
    }
  }

  useEffect(() => {
    let live = true;
    const tick = async () => {
      if (live) await refresh();
    };
    tick();
    const t = setInterval(tick, 5000);
    return () => {
      live = false;
      clearInterval(t);
    };
  }, []);

  async function toggle() {
    if (!s || busy) return;
    const next = !s.enabled;
    const batchLine = s.demo_batch
      ? `Demo limit: top ${s.demo_batch.size} by score (${s.demo_batch.remaining} left).`
      : "No demo limit set: every qualified lead gets a demo.";
    if (
      next &&
      !confirm(
        `Turn the worker ON?\n\nIt will start processing everything queued: discovery requests, demo builds (real Vercel deploys + AI spend, 2 at a time, best leads first), and approved sends. ${batchLine} Caps and budgets apply.`,
      )
    )
      return;
    setBusy(true);
    await fetch("/api/worker", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ enabled: next }),
    });
    setS({ ...s, enabled: next });
    setBusy(false);
  }

  async function setBatch(size: number | null) {
    if (batchBusy) return;
    setBatchBusy(true);
    await fetch("/api/worker", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ batch_size: size }),
    });
    setN("");
    await refresh();
    setBatchBusy(false);
  }

  function submitBatch() {
    const size = Number.parseInt(n, 10);
    if (!Number.isInteger(size) || size < 1 || size > 100) return;
    setBatch(size);
  }

  const dot = !s ? "bg-faint" : !s.online ? "bg-faint" : s.enabled ? "bg-ok" : "bg-warn";
  const label = !s ? "…" : !s.online ? "Offline" : s.enabled ? "Running" : "Paused";
  const sub = !s
    ? ""
    : !s.online
      ? "process down (RUNBOOK §3)"
      : s.enabled
        ? "processing pipeline"
        : "inputs queue, nothing spends";
  const b = s?.demo_batch ?? null;
  const pct = b ? Math.min(100, Math.round((b.used / b.size) * 100)) : 0;

  return (
    <div className="rounded-card border border-line bg-surface2/40 p-2.5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span
            className={`h-2 w-2 shrink-0 rounded-full ${dot} ${s?.online && s.enabled ? "animate-pulse" : ""}`}
            aria-hidden
          />
          <div className="min-w-0">
            <p className="font-display text-[12px] font-semibold leading-tight text-ink">Worker · {label}</p>
            <p className="truncate text-[10px] leading-tight text-faint">{sub}</p>
          </div>
        </div>
        <button
          onClick={toggle}
          disabled={!s || busy}
          aria-label={s?.enabled ? "Pause worker" : "Start worker"}
          className={`h-7 shrink-0 cursor-pointer rounded-md px-2.5 font-display text-[11px] font-semibold transition-colors duration-150 disabled:opacity-50 ${
            s?.enabled
              ? "border border-line text-muted hover:bg-surface2 hover:text-ink"
              : "bg-accent text-accentink hover:opacity-90"
          }`}
        >
          {busy ? "…" : s?.enabled ? "Pause" : "Start"}
        </button>
      </div>

      <div className="mt-2 border-t border-line/60 pt-2">
        {b ? (
          <div className="mb-1.5">
            <div className="flex items-center justify-between gap-2">
              <p className="font-display text-[11px] font-semibold text-ink">
                Demos: {b.used} of {b.size}
              </p>
              <button
                onClick={() => setBatch(null)}
                disabled={batchBusy}
                className="cursor-pointer text-[10px] text-faint transition-colors duration-150 hover:text-ink disabled:opacity-50"
                aria-label="Remove demo limit"
              >
                clear
              </button>
            </div>
            <div
              className="mt-1 h-1 overflow-hidden rounded-full bg-surface2"
              role="progressbar"
              aria-valuenow={b.used}
              aria-valuemin={0}
              aria-valuemax={b.size}
            >
              <div
                className="h-full rounded-full bg-data transition-[width] duration-300"
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="mt-1 text-[10px] leading-tight text-faint">
              {b.remaining > 0
                ? `${b.remaining} left, best scores first`
                : "batch done, set a new number for more"}
            </p>
          </div>
        ) : (
          <p className="mb-1.5 text-[10px] leading-tight text-faint">
            No demo limit: every qualified lead gets a demo.
          </p>
        )}
        <div className="flex items-center gap-1.5">
          <input
            type="number"
            min={1}
            max={100}
            value={n}
            onChange={(e) => setN(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") submitBatch();
            }}
            placeholder={b ? "new limit" : "e.g. 5"}
            aria-label="Demo limit (top N by score)"
            className="h-7 w-full min-w-0 rounded-md border border-line bg-surface px-2 text-[11px] text-ink placeholder:text-faint focus:outline-none focus-visible:ring-1 focus-visible:ring-data"
          />
          <button
            onClick={submitBatch}
            disabled={batchBusy || !n}
            className="h-7 shrink-0 cursor-pointer rounded-md border border-line px-2 font-display text-[11px] font-semibold text-muted transition-colors duration-150 hover:bg-surface2 hover:text-ink disabled:opacity-50"
          >
            {batchBusy ? "…" : "Set"}
          </button>
        </div>
      </div>
    </div>
  );
}
