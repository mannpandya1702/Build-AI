import { cn } from "@/lib/utils";
import { site } from "@/lib/site";

/**
 * The Riwaaya wordmark — "Riwaaya" in the flowing script of the client's
 * supplied artwork, with an optional "By Bhumi Sandhu" signature beneath.
 *
 * This replaces the earlier letter-spaced Cormorant wordmark. That one existed
 * because the brief said the arch monogram had been rejected and no logo file
 * was available; the client has now sent finished artwork, so the site follows
 * it. See components/brand/Monogram.tsx for the same note.
 *
 * Parisienne is the closest freely-licensed match to the script in the artwork
 * and is loaded for the logo only — the body of the site is still the two
 * specified families and nothing else. If the client sends the real vector,
 * swap the <span> here for it and the whole site follows.
 *
 * COLOUR. The artwork sets the script in a pale sage that measures under 2:1
 * on the off-white background. A logotype is exempt from the WCAG contrast
 * rules, but a name nobody can read is a poor logo regardless, so on light
 * surfaces the script uses pista-ink — the same hue, one step down, at 5.29:1.
 * On the dark footer the artwork's own values are used unchanged.
 */

type WordmarkProps = {
  size?: "sm" | "md" | "lg" | "xl";
  tone?: "ink" | "chandni" | "accent";
  /** Adds the "By Bhumi Sandhu" signature line beneath, per the artwork. */
  signature?: boolean;
  as?: "span" | "div" | "h1" | "h2";
  className?: string;
};

/**
 * Parisienne carries a lot of air above and below its x-height, so the optical
 * size runs noticeably smaller than the type size. These are tuned by eye
 * against the surrounding UI rather than set on a ratio.
 */
const sizes: Record<NonNullable<WordmarkProps["size"]>, string> = {
  sm: "text-[1.6rem]",
  md: "text-[2rem] md:text-[2.35rem]",
  lg: "text-[3.25rem] md:text-[4rem]",
  xl: "text-[4rem] md:text-[5.5rem]",
};

const signatureSizes: Record<NonNullable<WordmarkProps["size"]>, string> = {
  sm: "text-[0.5rem]",
  md: "text-[0.5625rem]",
  lg: "text-[0.75rem]",
  xl: "text-[0.8125rem]",
};

const tones: Record<NonNullable<WordmarkProps["tone"]>, { mark: string; sig: string }> = {
  ink: { mark: "text-pista-ink", sig: "text-stone-deep" },
  chandni: { mark: "text-pista", sig: "text-sona" },
  accent: { mark: "text-pista-ink", sig: "text-sona-deep" },
};

export function Wordmark({
  size = "md",
  tone = "ink",
  signature = false,
  as: Tag = "span",
  className,
}: WordmarkProps) {
  const palette = tones[tone];

  const mark = (
    <span
      className={cn(
        // leading-[0.8] pulls the script's generous ascenders back in so the
        // lockup sits on the same baseline grid as everything around it.
        "font-script select-none leading-[0.8]",
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
      <span
        className={cn(
          // Title case and letter-spaced serif, as drawn in the artwork.
          "font-display font-normal tracking-[0.28em]",
          signatureSizes[size],
          palette.sig,
        )}
      >
        By {site.founder}
      </span>
    </Tag>
  );
}
