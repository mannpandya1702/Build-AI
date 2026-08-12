import { Monogram, type MonogramTone } from "@/components/brand/Monogram";
import { Wordmark } from "@/components/brand/Wordmark";
import { cn } from "@/lib/utils";

/**
 * The full logo lockup: the arch monogram with the script wordmark.
 *
 * Two arrangements, both taken from the client's artwork:
 *   - "stack" reproduces the supplied lockup — monogram over wordmark over the
 *     signature line. Used where there is room to give it air (footer, 404).
 *   - "row" sets the monogram beside the wordmark for horizontal furniture
 *     that is only ~40px tall. Used in the nav.
 *
 * Everything is drawn or set in type, so there is no image request and the
 * mark stays sharp on any display.
 */

type LogoProps = {
  size?: "sm" | "md" | "lg" | "xl";
  /** Matches Wordmark's tones; the monogram picks a matching arch colour. */
  tone?: "ink" | "chandni" | "accent";
  layout?: "row" | "stack";
  /** Adds "By Bhumi Sandhu" beneath. On by default in the stacked lockup. */
  signature?: boolean;
  /** Drops the monogram and leaves the script alone. */
  markless?: boolean;
  as?: "span" | "div" | "h1" | "h2";
  className?: string;
};

/** Monogram height in px, tuned to sit on the wordmark's optical centre. */
const markSizes: Record<NonNullable<LogoProps["size"]>, { row: number; stack: number }> = {
  sm: { row: 36, stack: 52 },
  md: { row: 44, stack: 72 },
  lg: { row: 56, stack: 104 },
  xl: { row: 70, stack: 136 },
};

const monogramTone: Record<NonNullable<LogoProps["tone"]>, MonogramTone> = {
  ink: "gold",
  chandni: "chandni",
  accent: "pista",
};

export function Logo({
  size = "md",
  tone = "ink",
  layout = "row",
  signature,
  markless = false,
  as: Tag = "span",
  className,
}: LogoProps) {
  const stacked = layout === "stack";
  const showSignature = signature ?? stacked;

  return (
    <Tag
      className={cn(
        "inline-flex",
        stacked ? "flex-col items-start gap-4" : "flex-row items-center gap-3",
        className,
      )}
    >
      {!markless && (
        <Monogram
          size={markSizes[size][stacked ? "stack" : "row"]}
          tone={monogramTone[tone]}
        />
      )}
      <Wordmark size={size} tone={tone} signature={showSignature} />
    </Tag>
  );
}
