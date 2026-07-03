// Shared dashboard UI kit. Design grounded in the ui-ux-pro-max skill (Analytics Dashboard product
// -> data-dense + minimal + dark; Sales Intelligence status colors: won=green, lost=red,
// in-progress=blue, blocked=orange, neutral=grey). The StatTile pattern is modeled on the 21st.dev
// "Progress Metric Card" (headline figure + delta/trend). Kept dependency-light and in the existing
// dark-zinc language.
import Link from "next/link";

// Lead-status -> tone, from the skill's sales-dashboard color guidance.
const WON = new Set(["closed_won", "delivered", "delivery_approval", "meeting_booked"]);
const LOST = new Set(["closed_lost", "disqualified", "suppressed"]);
const BLOCKED = new Set(["demo_qa", "final_qa", "awaiting_approval", "nurture"]);
const LIVE = new Set([
  "discovered", "enriched", "qualified", "analyzed", "solution_ready", "design_ready",
  "demo_building", "final_building", "outreach_ready", "contacted", "replied", "negotiating",
]);

export function statusTone(status: string): { text: string; bg: string; ring: string; dot: string } {
  if (WON.has(status)) return { text: "text-emerald-300", bg: "bg-emerald-500/10", ring: "ring-emerald-500/30", dot: "bg-emerald-400" };
  if (LOST.has(status)) return { text: "text-rose-300", bg: "bg-rose-500/10", ring: "ring-rose-500/30", dot: "bg-rose-400" };
  if (BLOCKED.has(status)) return { text: "text-amber-300", bg: "bg-amber-500/10", ring: "ring-amber-500/30", dot: "bg-amber-400" };
  if (LIVE.has(status)) return { text: "text-sky-300", bg: "bg-sky-500/10", ring: "ring-sky-500/30", dot: "bg-sky-400" };
  return { text: "text-zinc-300", bg: "bg-zinc-500/10", ring: "ring-zinc-500/30", dot: "bg-zinc-400" };
}

export function StatusPill({ status }: { status: string }) {
  const t = statusTone(status);
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${t.bg} ${t.text} ${t.ring}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${t.dot}`} />
      {status.replace(/_/g, " ")}
    </span>
  );
}

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-xl border border-zinc-800 bg-zinc-900/40 ${className}`}>{children}</div>;
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-zinc-500">{children}</h2>;
}

// KPI tile — 21st "Progress Metric Card" pattern: label, big figure, optional delta/trend.
export function StatTile({ label, value, sub, tone = "zinc", href }: { label: string; value: React.ReactNode; sub?: string; tone?: "emerald" | "sky" | "amber" | "rose" | "zinc"; href?: string }) {
  const toneText = { emerald: "text-emerald-400", sky: "text-sky-400", amber: "text-amber-400", rose: "text-rose-400", zinc: "text-zinc-100" }[tone];
  const inner = (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 transition-colors hover:border-zinc-700">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">{label}</p>
      <p className={`mt-2 text-3xl font-bold tabular-nums ${toneText}`}>{value}</p>
      {sub && <p className="mt-1 text-xs text-zinc-500">{sub}</p>}
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

// Lighthouse-style 0-100 score ring (skill: cool->hot, so red<50, amber<90, green>=90).
export function ScoreDial({ label, score }: { label: string; score: number | null }) {
  const v = score ?? 0;
  const color = score == null ? "text-zinc-600" : v >= 90 ? "text-emerald-400" : v >= 50 ? "text-amber-400" : "text-rose-400";
  const ring = score == null ? "#3f3f46" : v >= 90 ? "#34d399" : v >= 50 ? "#fbbf24" : "#fb7185";
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative h-16 w-16">
        <svg viewBox="0 0 36 36" className="h-16 w-16 -rotate-90">
          <circle cx="18" cy="18" r="15.5" fill="none" stroke="#27272a" strokeWidth="3" />
          <circle cx="18" cy="18" r="15.5" fill="none" stroke={ring} strokeWidth="3" strokeLinecap="round"
            strokeDasharray={`${(v / 100) * 97.4} 97.4`} />
        </svg>
        <span className={`absolute inset-0 flex items-center justify-center text-sm font-bold tabular-nums ${color}`}>
          {score == null ? "—" : v}
        </span>
      </div>
      <span className="text-[11px] uppercase tracking-wide text-zinc-500">{label}</span>
    </div>
  );
}

// Palette swatch row from "r g b" channel triplets (the looks system format).
export function PaletteSwatches({ palette }: { palette: Record<string, string> }) {
  const rgb = (t?: string) => (t ? `rgb(${t.split(" ").join(",")})` : "transparent");
  return (
    <div className="flex gap-2">
      {["brand", "ink", "paper", "paper2"].map((k) => (
        <div key={k} className="flex flex-col items-center gap-1">
          <div className="h-9 w-9 rounded-lg ring-1 ring-white/10" style={{ background: rgb(palette?.[k]) }} />
          <span className="text-[10px] text-zinc-500">{k}</span>
        </div>
      ))}
    </div>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <p className="rounded-lg border border-dashed border-zinc-800 px-3 py-4 text-center text-sm text-zinc-600">{children}</p>;
}

export function severityTone(sev: string): string {
  return sev === "high" ? "text-rose-400" : sev === "medium" ? "text-amber-400" : "text-zinc-400";
}
