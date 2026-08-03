import { Star } from "lucide-react";

/** Mono eyebrow label with the accent tick. One source of truth for the
 *  pattern repeated across every section. `className` replaces the default
 *  margin so callers never fight mb-2 vs mb-4. */
export function Eyebrow({
  label,
  className,
}: {
  label: string;
  className?: string;
}) {
  return (
    <p
      className={`flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] text-accent ${
        className ?? "mb-4"
      }`}
    >
      <span className="h-px w-8 bg-accent/50" />
      {label}
    </p>
  );
}

/** Five-star row. `n` filled stars, rest are hairline outlines. */
export function Stars({ n }: { n: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${n} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={i < n ? "fill-accent text-accent" : "text-line-strong"}
          style={{ width: 15, height: 15 }}
        />
      ))}
    </div>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  blurb,
}: {
  eyebrow: string;
  title: string;
  blurb?: string;
}) {
  return (
    <div className="max-w-2xl">
      <Eyebrow label={eyebrow} />
      <h2 className="font-display text-[clamp(2rem,4.5vw,3.5rem)] font-semibold leading-[1.02] tracking-[-0.02em]">
        {title}
      </h2>
      {blurb && <p className="mt-5 text-lg leading-relaxed text-muted">{blurb}</p>}
    </div>
  );
}
