/** Small math helpers used by the hero animation. */

export const clamp01 = (x: number): number => (x < 0 ? 0 : x > 1 ? 1 : x)

export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t

/** Smoothstep easing (ease-in-out), clamped to [0,1]. */
export const smoothstep = (t: number): number => {
  const x = clamp01(t)
  return x * x * (3 - 2 * x)
}

/**
 * Normalized, eased progress of `p` within the window [start, end].
 * Returns 0 before the window, 1 after it, smoothstepped in between.
 */
export const phase = (p: number, start: number, end: number): number =>
  smoothstep((p - start) / (end - start))

/** Linear (un-eased) normalized progress within a window, clamped. */
export const range = (p: number, start: number, end: number): number =>
  clamp01((p - start) / (end - start))
