/**
 * useReveal: a subtle, config-light scroll reveal for section content.
 *
 * Animates elements matching `selector` inside the container: fade + small
 * upward drift, staggered, triggered as the section enters the viewport.
 * Honors prefers-reduced-motion by leaving everything visible and un-animated.
 */

import { useEffect } from 'react'
import type { RefObject } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export function useReveal(
  containerRef: RefObject<HTMLElement | null>,
  selector = '[data-reveal]',
  stagger = 0.08,
) {
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const ctx = gsap.context(() => {
      const items = gsap.utils.toArray<HTMLElement>(selector)
      gsap.set(items, { opacity: 0, y: 22 })
      ScrollTrigger.create({
        trigger: el,
        start: 'top 78%',
        once: true,
        onEnter: () => {
          gsap.to(items, {
            opacity: 1,
            y: 0,
            duration: 0.7,
            ease: 'power2.out',
            stagger,
          })
        },
      })
    }, el)

    return () => ctx.revert()
  }, [containerRef, selector, stagger])
}
