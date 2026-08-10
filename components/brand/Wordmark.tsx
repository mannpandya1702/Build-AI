import { cn } from "@/lib/utils";
import { site } from "@/lib/site";

/**
 * The Riwaaya logo.
 *
 * It is a wordmark, not a pictorial mark — there is deliberately no icon and
 * no arch monogram here, because the monogram lockup in the identity deck was
 * rejected.
 *
 * Two forms exist, and they disagree:
 *   - the identity deck specifies CAPS, Cormorant Garamond Light, +0.16em;
 *   - the website brief specifies lowercase at 0.18em.
 * The brief wins by default since it is the later instruction, but `letterCase`
 * switches the whole site in one place — change the default below to "upper"
 * to match the deck.
 *
 * When a real logo file lands, replace only the inner span of this component.
 * Every surface renders the logo through here, so nothing else has to change.
 */

type WordmarkProps = {
  size?: "sm" | "md" | "lg" | "xl";
  tone?: "ink" | "chandni" | "accent";
  /** "lower" per the brief (default), "upper" per the identity deck. */
  letterCase?: "lower" | "upper";
  /** Adds the "by Bhumi Sandhu" signature line beneath, per the deck lockup. */
  signature?: boolean;
  /** Renders as a heading-level element where the page needs one. */
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

const tones: Record<NonNullable<WordmarkProps["tone"]>, string> = {
  ink: "text-ink",
  chandni: "text-chandni",
  accent: "text-pista-ink",
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

  const mark = (
    <span
      className={cn(
        "font-display font-light leading-none select-none",
        upper ? "uppercase tracking-[0.16em]" : "lowercase track-wordmark",
        sizes[size],
        tones[tone],
      )}
    >
      {site.name}
    </span>
  );

  if (!signature) {
    return <Tag className={cn("inline-block", className)}>{mark}</Tag>;
  }

  return (
    <Tag className={cn("inline-flex flex-col items-start gap-1.5", className)}>
      {mark}
      <span
        className={cn(
          "font-sans font-semibold uppercase tracking-[0.2em]",
          signatureSizes[size],
          tone === "chandni" ? "text-chandni/70" : "text-stone-deep",
        )}
      >
        by {site.founder}
      </span>
    </Tag>
  );
}
