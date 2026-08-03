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

/**
 * Five-star row. Pass `n` for a whole number of filled stars, or `value` for a
 * fractional rating (e.g. 4.9 → four full stars + one 90%-filled). Partial fill
 * is done by clipping a filled star over an outline one.
 */
export function Stars({ n, value, size = 15 }: { n?: number; value?: number; size?: number }) {
  const rating = value ?? n ?? 0;
  return (
    <div className="flex gap-0.5" aria-label={`${rating} out of 5 stars`} role="img">
      {Array.from({ length: 5 }).map((_, i) => {
        const frac = Math.max(0, Math.min(1, rating - i));
        return (
          <span
            key={i}
            className="relative inline-block shrink-0"
            style={{ width: size, height: size }}
            aria-hidden
          >
            <Star className="absolute inset-0 text-line-strong" style={{ width: size, height: size }} />
            {frac > 0 && (
              <span
                className="absolute inset-0 overflow-hidden"
                style={{ width: `${frac * 100}%` }}
              >
                <Star className="fill-accent text-accent" style={{ width: size, height: size }} />
              </span>
            )}
          </span>
        );
      })}
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
