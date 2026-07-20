import { colors } from "@/lib/tokens";

/**
 * Server-rendered, dependency-free tooth used as the hero's LCP element and as
 * the fallback whenever WebGL is unavailable, the device is low-power, or the
 * visitor prefers reduced motion. Pure inline SVG: paints instantly, scales
 * crisply, reads on white. The live <ToothCanvas> crossfades over this once its
 * first frame is ready.
 */
export default function StaticTooth({
  className,
  withAura = true,
  id,
}: {
  className?: string;
  withAura?: boolean;
  id?: string;
}) {
  return (
    <svg
      id={id}
      className={className}
      viewBox="0 0 240 300"
      role="img"
      aria-label="A single healthy tooth, glowing softly."
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <radialGradient id="wr-enamel" cx="46%" cy="30%" r="78%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="42%" stopColor={colors.enamel} />
          <stop offset="78%" stopColor="#e6f4f2" />
          <stop offset="100%" stopColor="#d3ebe9" />
        </radialGradient>

        <radialGradient id="wr-aura" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={colors.teal} stopOpacity="0.42" />
          <stop offset="45%" stopColor={colors.teal} stopOpacity="0.16" />
          <stop offset="100%" stopColor={colors.teal} stopOpacity="0" />
        </radialGradient>

        <linearGradient id="wr-rim" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={colors.teal} stopOpacity="0" />
          <stop offset="70%" stopColor={colors.teal} stopOpacity="0" />
          <stop offset="100%" stopColor={colors.teal} stopOpacity="0.55" />
        </linearGradient>

        <filter id="wr-soft" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
      </defs>

      {withAura && (
        <ellipse
          cx="120"
          cy="150"
          rx="118"
          ry="132"
          fill="url(#wr-aura)"
        />
      )}

      {/* Molar silhouette: bulging crown, narrowed neck, two splayed roots
          with a central notch. */}
      <path
        d="M 78 66
           C 70 50, 96 42, 120 46
           C 144 42, 170 50, 162 66
           C 182 74, 192 96, 188 122
           C 185 146, 172 162, 166 182
           C 162 208, 168 240, 176 264
           C 180 278, 162 282, 154 268
           C 144 250, 136 218, 128 198
           C 124 188, 116 188, 112 198
           C 104 218, 96 250, 86 268
           C 78 282, 60 278, 64 264
           C 72 240, 78 208, 74 182
           C 68 162, 55 146, 52 122
           C 48 96, 58 74, 78 66 Z"
        fill="url(#wr-enamel)"
        stroke="#cfe8e6"
        strokeWidth="1.5"
      />

      {/* Teal branded edge-shine along the lower-right (the heartbeat rim,
          frozen). */}
      <path
        d="M 188 122
           C 185 146, 172 162, 166 182
           C 162 208, 168 240, 176 264
           C 180 278, 162 282, 154 268
           C 144 250, 136 218, 128 198"
        fill="none"
        stroke="url(#wr-rim)"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.9"
      />

      {/* Wet clearcoat highlight, upper-left of the crown. */}
      <ellipse
        cx="96"
        cy="92"
        rx="20"
        ry="26"
        fill="#ffffff"
        opacity="0.85"
        filter="url(#wr-soft)"
      />
      <ellipse cx="104" cy="84" rx="7" ry="9" fill="#ffffff" opacity="0.95" />
    </svg>
  );
}
