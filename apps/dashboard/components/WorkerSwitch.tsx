"use client";

// Worker on/off control (sidebar). Three honest states:
//   Running (green)  = process alive + processing enabled
//   Paused  (amber)  = process alive, processing disabled — inputs queue, nothing spends
//   Offline (gray)   = no heartbeat: the process itself is not running on the host (RUNBOOK §3);
//                      the toggle still sets the DESIRED state, applied when the process is back.
// Turning ON confirms first: it starts real builds/spend on everything that is queued.
import { useEffect, useState } from "react";

interface WorkerState { enabled: boolean; online: boolean; last_heartbeat: string | null }

export default function WorkerSwitch() {
  const [s, setS] = useState<WorkerState | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let live = true;
    const tick = async () => {
      try {
        const r = await fetch("/api/worker", { cache: "no-store" });
        if (r.ok && live) setS(await r.json());
      } catch { /* boot race */ }
    };
    tick();
    const t = setInterval(tick, 5000);
    return () => { live = false; clearInterval(t); };
  }, []);

  async function toggle() {
    if (!s || busy) return;
    const next = !s.enabled;
    if (next && !confirm("Turn the worker ON?\n\nIt will start processing everything queued: discovery requests, demo builds (real Vercel deploys + AI spend, 2 at a time, best leads first), and approved sends. Caps and budgets apply.")) return;
    setBusy(true);
    await fetch("/api/worker", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ enabled: next }) });
    setS({ ...s, enabled: next });
    setBusy(false);
  }

  const dot = !s ? "bg-faint" : !s.online ? "bg-faint" : s.enabled ? "bg-ok" : "bg-warn";
  const label = !s ? "…" : !s.online ? "Offline" : s.enabled ? "Running" : "Paused";
  const sub = !s ? "" : !s.online ? "process down (RUNBOOK §3)" : s.enabled ? "processing pipeline" : "inputs queue, nothing spends";

  return (
    <div className="rounded-card border border-line bg-surface2/40 p-2.5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className={`h-2 w-2 shrink-0 rounded-full ${dot} ${s?.online && s.enabled ? "animate-pulse" : ""}`} aria-hidden />
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
            s?.enabled ? "border border-line text-muted hover:bg-surface2 hover:text-ink" : "bg-accent text-accentink hover:opacity-90"
          }`}
        >
          {busy ? "…" : s?.enabled ? "Pause" : "Start"}
        </button>
      </div>
    </div>
  );
}
