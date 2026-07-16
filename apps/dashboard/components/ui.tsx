import { Icon, type IconName } from "@/components/icons";
// Dashboard UI kit — implements the skill-generated design system ("Data-Dense Dashboard": blue
// data + amber highlights on deep blue-black surfaces, Fira Code display / Fira Sans body, density-8
// spacing, subtle 150ms motion). Status colors are semantic (skill: color-not-only — pills pair a
// dot + text, never color alone). Numbers render in the display face (tabular by nature).
import Link from "next/link";

// Lead-status -> semantic tone (sales-dashboard convention: won=green, lost=red, active=blue,
// waiting-on-operator=amber).
const WON = new Set(["closed_won", "delivered", "delivery_approval", "meeting_booked"]);
const LOST = new Set(["closed_lost", "disqualified", "suppressed"]);
const BLOCKED = new Set(["demo_qa", "final_qa", "awaiting_approval", "nurture"]);

export function statusTone(status: string): { text: string; bg: string; ring: string; dot: string } {
  if (WON.has(status)) return { text: "text-ok", bg: "bg-ok/10", ring: "ring-ok/25", dot: "bg-ok" };
  if (LOST.has(status))
    return { text: "text-danger", bg: "bg-danger/10", ring: "ring-danger/25", dot: "bg-danger" };
  if (BLOCKED.has(status))
    return { text: "text-warn", bg: "bg-warn/10", ring: "ring-warn/25", dot: "bg-warn" };
  return { text: "text-data", bg: "bg-data/10", ring: "ring-data/25", dot: "bg-data" };
}

export function StatusPill({ status }: { status: string }) {
  const t = statusTone(status);
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 font-display text-[11px] font-medium ring-1 ${t.bg} ${t.text} ${t.ring}`}
    >
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${t.dot}`} aria-hidden />
      {status.replace(/_/g, " ")}
    </span>
  );
}

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-card border border-line bg-surface ${className}`}>{children}</div>;
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-display text-[11px] font-semibold uppercase tracking-[0.14em] text-faint">
      {children}
    </h2>
  );
}

/** Consistent page header: title + description, optional right-side slot. */
export function PageHeader({
  title,
  description,
  children,
}: { title: string; description?: string; children?: React.ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3 border-b border-line pb-4">
      <div>
        <h1 className="font-display text-xl font-semibold tracking-tight text-ink">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}

// KPI tile (21st.dev Progress Metric Card pattern): micro-label, big tabular figure, context line.
export function StatTile({
  label,
  value,
  sub,
  tone = "ink",
  href,
}: {
  label: string;
  value: React.ReactNode;
  sub?: string;
  tone?: "ok" | "data" | "warn" | "danger" | "ink";
  href?: string;
}) {
  const toneText = {
    ok: "text-ok",
    data: "text-data",
    warn: "text-warn",
    danger: "text-danger",
    ink: "text-ink",
  }[tone];
  const inner = (
    <div className="rounded-card border border-line bg-surface p-4 transition-colors duration-150 hover:border-faint/40">
      <p className="font-display text-[11px] font-medium uppercase tracking-[0.12em] text-faint">{label}</p>
      <p className={`mt-1.5 font-display text-[26px] font-semibold leading-none tracking-tight ${toneText}`}>
        {value}
      </p>
      {sub && <p className="mt-1.5 text-xs text-muted">{sub}</p>}
    </div>
  );
  return href ? (
    <Link href={href} className="cursor-pointer">
      {inner}
    </Link>
  ) : (
    inner
  );
}

// Lighthouse-style 0-100 dial (skill: color + number, never color alone).
export function ScoreDial({ label, score }: { label: string; score: number | null }) {
  const v = score ?? 0;
  const color = score == null ? "text-faint" : v >= 90 ? "text-ok" : v >= 50 ? "text-warn" : "text-danger";
  const ring =
    score == null
      ? "rgb(var(--border))"
      : v >= 90
        ? "rgb(var(--ok))"
        : v >= 50
          ? "rgb(var(--warn))"
          : "rgb(var(--danger))";
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative h-16 w-16">
        <svg viewBox="0 0 36 36" className="h-16 w-16 -rotate-90">
          <circle cx="18" cy="18" r="15.5" fill="none" stroke="rgb(var(--surface-2))" strokeWidth="3" />
          <circle
            cx="18"
            cy="18"
            r="15.5"
            fill="none"
            stroke={ring}
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={`${(v / 100) * 97.4} 97.4`}
          />
        </svg>
        <span
          className={`absolute inset-0 flex items-center justify-center font-display text-sm font-semibold ${color}`}
        >
          {score == null ? "—" : v}
        </span>
      </div>
      <span className="font-display text-[10px] uppercase tracking-[0.12em] text-faint">{label}</span>
    </div>
  );
}

// Palette swatch row from "r g b" channel triplets (the looks system format).
export function PaletteSwatches({ palette }: { palette: Record<string, string> }) {
  const rgb = (t?: string) => (t ? `rgb(${t.split(" ").join(",")})` : "transparent");
  return (
    <div className="flex gap-2.5">
      {["brand", "ink", "paper", "paper2"].map((k) => (
        <div key={k} className="flex flex-col items-center gap-1">
          <div className="h-9 w-9 rounded-lg ring-1 ring-line" style={{ background: rgb(palette?.[k]) }} />
          <span className="font-display text-[10px] text-faint">{k}</span>
        </div>
      ))}
    </div>
  );
}

/** Helpful empty state (skill §8: message + guidance, not a blank region). */
export function Empty({
  icon = "inboxEmpty",
  children,
  hint,
}: { icon?: IconName; children: React.ReactNode; hint?: string }) {
  return (
    <div className="grid place-items-center gap-1.5 rounded-card border border-dashed border-line px-4 py-8 text-center">
      <Icon name={icon} className="h-6 w-6 text-faint" />
      <p className="text-sm text-muted">{children}</p>
      {hint && <p className="text-xs text-faint">{hint}</p>}
    </div>
  );
}

/** Skeleton rows shown while data loads (skill §3: progressive-loading over spinners). */
export function Skeleton({ rows = 3, className = "" }: { rows?: number; className?: string }) {
  return (
    <div className={`space-y-2 ${className}`} aria-hidden>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="skeleton h-12 w-full" />
      ))}
    </div>
  );
}

/** Search input (skill anti-pattern for dashboards: "No filtering"). */
export function SearchInput({
  value,
  onChange,
  placeholder = "Search…",
}: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <label className="flex h-9 min-w-52 items-center gap-2 rounded-lg border border-line bg-surface px-3 transition-colors duration-150 focus-within:border-data/60">
      <Icon name="search" className="h-4 w-4 shrink-0 text-faint" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-faint"
      />
    </label>
  );
}

/** Toggle chip for status/level filters. */
export function FilterChip({
  active,
  onClick,
  children,
}: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`cursor-pointer whitespace-nowrap rounded-full px-2.5 py-1 font-display text-[11px] font-medium ring-1 transition-colors duration-150 ${
        active ? "bg-data/15 text-data ring-data/40" : "text-muted ring-line hover:bg-surface2 hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}

export function severityTone(sev: string): string {
  return sev === "high" ? "text-danger" : sev === "medium" ? "text-warn" : "text-muted";
}
