import { cn } from "@/lib/utils";
import { site } from "@/lib/site";

/**
 * The Riwaaya wordmark: "riwaaya" set in Cormorant Garamond Light and
 * letter-spaced, paired with the arch monogram in components/brand/Logo.tsx.
 *
 * The client's logo artwork sets the name in a calligraphic script. That was
 * reproduced here for a while using Parisienne — the nearest freely-licensed
 * match — and then reverted on the client's instruction. The letter-spaced
 * Cormorant is what the site used before, and what it uses now; the monogram
 * from the artwork stays.
 *
 * Two cases exist, and the source documents disagree:
 *   - the identity deck specifies CAPS, Cormorant Garamond Light, +0.16em;
 *   - the website brief specifies lowercase at 0.18em.
 * The brief wins by default since it is the later instruction, but `letterCase`
 * switches the whole site in one place — change the default below to "upper"
 * to match the deck.
 *
 * When the vector original of the full lockup lands, replace the inner span
 * here and the path in Monogram.tsx. Every surface renders through Logo.tsx,
 * so nothing else has to change.
 */

type WordmarkProps = {
  size?: "sm" | "md" | "lg" | "xl";
  tone?: "ink" | "chandni" | "accent";
  /** "lower" per the brief (default), "upper" per the identity deck. */
  letterCase?: "lower" | "upper";
  /** Adds the "By Bhumi Sandhu" signature line beneath, per the artwork. */
  signature?: boolean;
  as?: "span" | "div" | "h1" | "h2";
  className?: string;
};

const sizes: Record<NonNullable<WordmarkProps["size"]>, string> = {
  sm: "text-lg md:text-xl",
  md: "text-2xl md:text-[1.75rem]",
  lg: "text-4xl md:text-5xl",
  xl: "text-5xl md:text-7xl",
};

const signatureSizes: Record<NonNullable<WordmarkProps["size"]>, string> = {
  sm: "text-[0.5rem]",
  md: "text-[0.5625rem]",
  lg: "text-[0.6875rem]",
  xl: "text-xs",
};

const tones: Record<NonNullable<WordmarkProps["tone"]>, { mark: string; sig: string }> = {
  ink: { mark: "text-ink", sig: "text-stone-deep" },
  chandni: { mark: "text-chandni", sig: "text-sona" },
  accent: { mark: "text-pista-ink", sig: "text-sona-deep" },
};

export function Wordmark({
  size = "md",
  tone = "ink",
  letterCase = "lower",
  signature = false,
  as: Tag = "span",
  className,
}: WordmarkProps) {
  const upper = letterCase === "upper";
  const palette = tones[tone];

  const mark = (
    <span
      className={cn(
        "select-none font-display font-light leading-none",
        upper ? "uppercase tracking-[0.16em]" : "lowercase track-wordmark",
        sizes[size],
        palette.mark,
      )}
    >
      {site.name}
    </span>
  );

  if (!signature) {
    return <Tag className={cn("inline-block", className)}>{mark}</Tag>;
  }

  return (
    <Tag className={cn("inline-flex flex-col items-start gap-2", className)}>
      {mark}
      {/*
        Mulish, not Cormorant. The wordmark above is already Cormorant, and
        setting the signature in the same face at a smaller size reads as one
        block of type rather than a lockup of two parts.
      */}
      <span
        className={cn(
          "font-sans font-semibold uppercase tracking-[0.2em]",
          signatureSizes[size],
          palette.sig,
        )}
      >
        by {site.founder}
      </span>
    </Tag>
  );
}
