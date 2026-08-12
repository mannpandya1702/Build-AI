import { cn } from "@/lib/utils";

/**
 * The Riwaaya monogram: an open arch enclosing a serif R.
 *
 * NOTE ON THE BRIEF. The original build brief said the client had rejected an
 * arch monogram and that no pictorial mark should be drawn. The client has
 * since supplied finished logo artwork which *is* an arch monogram, in gold
 * with a sage R, so that instruction is superseded — this is a reproduction of
 * the artwork they sent, not an invention.
 *
 * It is drawn rather than placed as a bitmap so it stays sharp at every size,
 * inherits colour from the surface it sits on, and costs nothing to load. The
 * arch is a real vector path; the R is set in Cormorant Garamond, the display
 * face already loaded for the rest of the site.
 *
 * WHEN THE VECTOR ORIGINAL ARRIVES: replace the <path> below with the exported
 * one and delete the <text>. Nothing else on the site needs to change — every
 * surface renders the mark through this component.
 *
 * The break at the lower right is deliberate and matches the artwork: the arch
 * is open, not a closed capsule.
 */

export type MonogramTone = "gold" | "ink" | "chandni" | "pista";

type MonogramProps = {
  /** Height in CSS pixels. Width follows the 100:140 ratio. */
  size?: number;
  tone?: MonogramTone;
  className?: string;
};

/**
 * [arch stroke, R fill] per surface.
 *
 * The artwork sets the R in a very pale sage. That works at the size it was
 * drawn at, on white — at 34px in a nav bar it disappears into the background
 * entirely. On light surfaces the R is therefore pista-deep, which is the same
 * hue two steps down and still reads as soft rather than solid. The dark
 * surfaces keep the artwork's own pale value, which has plenty of contrast
 * against ink.
 */
const tones: Record<MonogramTone, { arch: string; letter: string }> = {
  gold: { arch: "#C2A05E", letter: "#7E9470" },
  ink: { arch: "#22271F", letter: "#7E9470" },
  chandni: { arch: "#C2A05E", letter: "#D8E0C8" },
  pista: { arch: "#7E9470", letter: "#A8B992" },
};

/**
 * Arch outline. viewBox 100 × 140, stroke centred on the path.
 * Ellipse radii 48 × 56 give the tall, slightly ovoid arch of the artwork
 * rather than the semicircle a plain capsule would produce.
 */
const ARCH_PATH = [
  "M 50 2",
  "A 48 56 0 0 1 98 58", // top-right shoulder
  "L 98 82", // straight right flank
  "M 89 114.5", // gap at four o'clock — the arch is open
  "A 48 56 0 0 1 50 138",
  "A 48 56 0 0 1 2 82",
  "L 2 58",
  "A 48 56 0 0 1 50 2",
].join(" ");

export function Monogram({ size = 40, tone = "gold", className }: MonogramProps) {
  const { arch, letter } = tones[tone];

  return (
    <svg
      viewBox="0 0 100 140"
      height={size}
      width={(size * 100) / 140}
      role="presentation"
      aria-hidden
      focusable="false"
      className={cn("shrink-0 overflow-visible", className)}
    >
      <path
        d={ARCH_PATH}
        fill="none"
        stroke={arch}
        strokeWidth={3.2}
        strokeLinecap="round"
      />
      {/* font-display resolves to the Cormorant variable set on <html>. */}
      <text
        x="50"
        y="104"
        textAnchor="middle"
        className="font-display"
        fontSize="94"
        fontWeight={300}
        fill={letter}
      >
        R
      </text>
    </svg>
  );
}
