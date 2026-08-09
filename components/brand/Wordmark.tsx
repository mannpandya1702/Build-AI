import { cn } from "@/lib/utils";

/**
 * The Riwaaya logo.
 *
 * It is a wordmark, not a pictorial mark — lowercase Cormorant Garamond,
 * letter-spaced 0.18em. There is deliberately no icon here.
 *
 * When a real logo file lands, replace only the inner span of this component
 * with the asset (see README §Swapping in the logo). Every surface renders the
 * logo through this component, so nothing else has to change.
 */

type WordmarkProps = {
  size?: "sm" | "md" | "lg" | "xl";
  tone?: "ink" | "chandni" | "accent";
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

const tones: Record<NonNullable<WordmarkProps["tone"]>, string> = {
  ink: "text-ink",
  chandni: "text-chandni",
  accent: "text-pista-ink",
};

export function Wordmark({
  size = "md",
  tone = "ink",
  as: Tag = "span",
  className,
}: WordmarkProps) {
  return (
    <Tag
      className={cn(
        "font-display font-light lowercase leading-none track-wordmark select-none",
        sizes[size],
        tones[tone],
        className,
      )}
    >
      riwaaya
    </Tag>
  );
}
