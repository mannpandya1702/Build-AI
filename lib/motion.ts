import type { Transition, Variants } from "framer-motion";

/**
 * One motion vocabulary for the whole site. Every reveal, hover and sweep
 * derives from these constants so timing stays consistent across sections.
 *
 * Under prefers-reduced-motion every variant below collapses to a plain fade —
 * see `reduced()` and the `useReveal` hook in components/motion/Reveal.tsx.
 */

export const EASE = [0.22, 1, 0.36, 1] as const;

export const DURATION = {
  sweep: 0.25,
  hover: 0.4,
  reveal: 0.7,
  hero: 1.2,
} as const;

export const STAGGER = 0.08;

/** Shared viewport rule: fire once, 80px before the element reaches the edge. */
export const VIEWPORT = { once: true, margin: "-80px" } as const;

export const revealTransition: Transition = {
  duration: DURATION.reveal,
  ease: EASE,
};

/** opacity 0→1, y 24→0 — the standard section reveal. */
export const revealVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: revealTransition },
};

/** Same reveal, reduced to a fade with no travel. */
export const fadeVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.4, ease: "linear" } },
};

/** Parent that staggers its children by 0.08s. */
export const staggerParent = (stagger: number = STAGGER, delayChildren = 0): Variants => ({
  hidden: {},
  visible: {
    transition: { staggerChildren: stagger, delayChildren },
  },
});

/**
 * Headline lines wipe upward behind a clip mask.
 *
 * Kept at 0.7s rather than a more languid 0.9s: the h1 is the LCP element, and
 * Chrome does not count it as painted until it clears its mask. The extra
 * 200ms was measurable on mobile and invisible to the eye.
 */
export const lineWipeVariants: Variants = {
  hidden: { y: "110%" },
  visible: {
    y: "0%",
    transition: { duration: 0.7, ease: EASE },
  },
};

/**
 * Pick the motion-safe variant or its reduced equivalent.
 * Call sites pass the result of useReducedMotion().
 */
export function reduced(shouldReduce: boolean | null, motionVariants: Variants): Variants {
  return shouldReduce ? fadeVariants : motionVariants;
}
