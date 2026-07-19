/**
 * Lenis smooth scrolling, wired into GSAP's ticker so ScrollTrigger and Lenis
 * share a single rAF loop (no double loops, no jitter).
 *
 * Usage: call `initSmoothScroll()` once on mount and call the returned cleanup
 * on unmount. Honors prefers-reduced-motion by skipping Lenis entirely and
 * returning a no-op, so the page falls back to native scrolling.
 */

import Lenis from 'lenis'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

let lenis: Lenis | null = null

export function getLenis(): Lenis | null {
  return lenis
}

export function initSmoothScroll(): () => void {
  const prefersReduced =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  // Reduced motion: no smooth-scroll hijacking, native scroll only.
  if (prefersReduced) {
    return () => {}
  }

  lenis = new Lenis({
    // Slow, weighted feel. Long ease, nothing gamey.
    duration: 1.15,
    easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    touchMultiplier: 1.6,
  })

  // Keep ScrollTrigger in sync with Lenis' virtual scroll position.
  lenis.on('scroll', ScrollTrigger.update)

  // Drive Lenis from GSAP's ticker (single source of truth for time).
  const raf = (time: number) => {
    // GSAP ticker time is in seconds; Lenis expects milliseconds.
    lenis?.raf(time * 1000)
  }
  gsap.ticker.add(raf)
  gsap.ticker.lagSmoothing(0)

  return () => {
    gsap.ticker.remove(raf)
    lenis?.destroy()
    lenis = null
  }
}
