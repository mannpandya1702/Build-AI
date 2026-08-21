import type { ReactNode } from "react";

import type { CheckStatus } from "@/lib/seoAudit";
import { cn } from "@/lib/utils";

/**
 * The admin panel's own small vocabulary.
 *
 * It deliberately does NOT reuse the marketing site's section components. The
 * public pages are built to be read slowly — big Cormorant headings, generous
 * whitespace, scroll reveals. A panel is scanned, not read: the state of a
 * thing has to be legible before any of the words are. So the palette is the
 * brand's, the type is the brand's, and everything else — density, the status
 * colours, the tabular figures — belongs to this page.
 *
 * Status colour is separate from the brand accent on purpose. Pistachio means
 * "Riwaaya" everywhere else on the site; here green/amber/red have to mean
 * good/warning/problem and nothing else, or the panel cannot be read at a
 * glance.
 */

export function Panel({
  title,
  subtitle,
  right,
  children,
  id,
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
  children: ReactNode;
  id?: string;
}) {
  return (
    <section id={id} className="scroll-mt-6">
      <div className="mb-5 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <div>
          <h2 className="font-display text-2xl font-light text-ink md:text-3xl">{title}</h2>
          {subtitle && (
            <p className="mt-1 max-w-2xl font-sans text-micro text-stone-deep">{subtitle}</p>
          )}
        </div>
        {right}
      </div>
      {children}
    </section>
  );
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "rounded-sm border border-ink/12 bg-chandni p-5 shadow-[0_1px_0_0_rgba(34,39,31,0.04)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** A single headline number. */
export function Metric({
  value,
  label,
  note,
  tone = "ink",
}: {
  value: string;
  label: string;
  note?: string;
  tone?: "ink" | "good" | "warn" | "bad";
}) {
  const tones = {
    ink: "text-ink",
    good: "text-[#3f6b3f]",
    warn: "text-[#8a6a2f]",
    bad: "text-[#8f3a32]",
  };
  return (
    <Card>
      <p
        className={cn(
          "font-display text-4xl font-light leading-none lining-nums tabular-nums",
          tones[tone],
        )}
      >
        {value}
      </p>
      <p className="mt-3 font-sans text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-stone-deep">
        {label}
      </p>
      {note && <p className="mt-1.5 font-sans text-micro leading-snug text-stone-deep">{note}</p>}
    </Card>
  );
}

const statusStyles: Record<CheckStatus, { dot: string; text: string; word: string }> = {
  pass: { dot: "bg-[#3f6b3f]", text: "text-[#3f6b3f]", word: "Good" },
  warn: { dot: "bg-[#b6892f]", text: "text-[#8a6a2f]", word: "Worth a look" },
  fail: { dot: "bg-[#a8443a]", text: "text-[#8f3a32]", word: "Needs fixing" },
};

/**
 * Status is carried by a coloured dot AND a word, never colour alone — the
 * panel has to work for a colour-blind reader and in a black-and-white print.
 */
export function StatusPill({ status }: { status: CheckStatus }) {
  const s = statusStyles[status];
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-2 font-sans text-[0.6875rem] font-semibold uppercase tracking-[0.14em]",
        s.text,
      )}
    >
      <span aria-hidden className={cn("h-2 w-2 rounded-full", s.dot)} />
      {s.word}
    </span>
  );
}

/** Horizontal progress bar. Width is inline because the value is arbitrary. */
export function Bar({ percent, tone = "good" }: { percent: number; tone?: "good" | "warn" | "bad" }) {
  const fill = { good: "bg-[#5c6e50]", warn: "bg-[#b6892f]", bad: "bg-[#a8443a]" }[tone];
  const clamped = Math.max(0, Math.min(100, percent));
  return (
    <div
      className="h-2 w-full overflow-hidden rounded-full bg-ink/10"
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div className={cn("h-full rounded-full", fill)} style={{ width: `${clamped}%` }} />
    </div>
  );
}

/**
 * Sparkline for a visitor series. Drawn as an SVG path with an area fill and
 * an emphasised final point, so the shape reads even at this size.
 */
export function Sparkline({ points, label }: { points: number[]; label: string }) {
  if (points.length < 2) return null;
  const w = 640;
  const h = 120;
  const max = Math.max(...points, 1);
  const step = w / (points.length - 1);
  const coords = points.map((v, i) => [i * step, h - (v / max) * (h - 8) - 4] as const);
  const line = coords.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${line} L${w},${h} L0,${h} Z`;
  const [lastX, lastY] = coords[coords.length - 1];

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-28 w-full" role="img" aria-label={label}>
      <path d={area} fill="#5c6e50" fillOpacity="0.12" />
      <path d={line} fill="none" stroke="#5c6e50" strokeWidth="2" strokeLinejoin="round" />
      <circle cx={lastX} cy={lastY} r="4" fill="#5c6e50" />
    </svg>
  );
}

/**
 * A labelled group of items inside a tab.
 *
 * The readiness list used to be one flat run of ten cards with a small pill on
 * each; the state of the list could only be worked out by reading every pill.
 * Grouping under a heading that carries its own colour and count means the
 * shape of the list — how much is urgent, how much is done — reads before any
 * of the words do.
 */
export function Group({
  title,
  count,
  note,
  tone = "neutral",
  children,
}: {
  title: string;
  count?: number;
  note?: string;
  tone?: "neutral" | "good" | "warn" | "bad";
  children: ReactNode;
}) {
  const rule = {
    neutral: "bg-ink/25",
    good: "bg-[#3f6b3f]",
    warn: "bg-[#b6892f]",
    bad: "bg-[#a8443a]",
  }[tone];

  const countTone = {
    neutral: "bg-ink/8 text-stone-deep",
    good: "bg-[#3f6b3f]/14 text-[#33562f]",
    warn: "bg-[#9a7433]/16 text-[#7d5d24]",
    bad: "bg-[#a8443a]/14 text-[#8f3a32]",
  }[tone];

  return (
    <section className="mt-10 first:mt-0">
      <div className="flex items-center gap-3">
        <span aria-hidden className={cn("h-4 w-1 shrink-0 rounded-full", rule)} />
        <h3 className="font-display text-xl font-light text-ink md:text-2xl">{title}</h3>
        {typeof count === "number" && (
          <span
            className={cn(
              "rounded-full px-2 py-0.5 font-sans text-[0.625rem] font-semibold lining-nums tabular-nums",
              countTone,
            )}
          >
            {count}
          </span>
        )}
      </div>
      {note && (
        <p className="ml-4 mt-1.5 max-w-2xl font-sans text-micro text-stone-deep">{note}</p>
      )}
      <div className="mt-4 flex flex-col gap-3">{children}</div>
    </section>
  );
}
