/**
 * Hero.tsx
 * -----------------------------------------------------------------------------
 * The pinned, scroll-driven 3D hero.
 *
 * Layout: a tall section (~450vh) with a position: sticky full-viewport wrapper.
 * A single GSAP ScrollTrigger reads the section's scroll and writes normalized
 * progress (0..1) into the zustand store. The canvas reads it in useFrame; the
 * overlay reads it via its own rAF loop. React does not re-render on scroll.
 *
 * Fallbacks (all required, not optional):
 *  - prefers-reduced-motion: no pin, no canvas. A single static gradient hero
 *    with all three headlines stacked, then normal document flow.
 *  - < 768px: fewer rafters, a simplified vertical-pan camera.
 *  - If the device can't hold a smooth frame rate, we drop to the static hero.
 *
 * Judgment call: pinning is done with CSS `position: sticky` (visually identical
 * to a GSAP pin) while a single non-pinning ScrollTrigger computes progress.
 * This avoids GSAP pin-spacer layout quirks and is rock solid with Lenis.
 */

import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useScrollStore } from '../../store/useScrollStore'
import {
  useIsMobile,
  useNearViewport,
  usePrefersReducedMotion,
} from '../../lib/hooks'
import { siteConfig } from '../../site.config'
import HeroOverlay from './HeroOverlay'

gsap.registerPlugin(ScrollTrigger)

// Code-split the frame player (and its preloading) until the hero is near.
// The photoreal pre-rendered sequence replaced the live WebGL scene; RoofScene
// remains in the repo if a real-time variant is ever wanted again.
const FrameScene = lazy(() => import('./FrameScene'))

/** CSS-only golden-hour sky. The transparent canvas renders over this, so it
 *  is both the lazy-load poster AND the live sky of the 3D scene. */
function HeroPoster() {
  return (
    <div className="golden-sky absolute inset-0">
      {/* low sun glow on the horizon */}
      <div className="absolute right-[12%] top-[38%] h-80 w-80 rounded-full bg-[#ffdf9e]/70 blur-3xl" />
      <div className="absolute right-[16%] top-[44%] h-40 w-40 rounded-full bg-[#fff3d0]/80 blur-2xl" />
    </div>
  )
}

/** Static hero used for reduced-motion and low-performance fallbacks. Shows
 *  the final rendered still of the finished house under the stacked
 *  headlines; falls back to the CSS sky if the image is unavailable. */
function StaticHero() {
  const { phases, sideCaptions } = siteConfig.hero
  const norm = (w: string) => w.replace(/[.,!?]/g, '').toLowerCase()
  return (
    <section className="relative flex min-h-[100svh] flex-col items-center justify-center overflow-hidden px-6 py-28 text-center">
      <HeroPoster />
      <img
        src="/frames/frame_0071.webp"
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover opacity-90"
        onError={(e) => {
          ;(e.currentTarget as HTMLImageElement).style.display = 'none'
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-cream/85 via-cream/35 to-transparent" />
      <div className="relative z-10 flex max-w-3xl flex-col items-center gap-10">
        {phases.map((ph, i) => (
          <div key={i} className="flex flex-col items-center">
            <h2 className="text-balance text-3xl font-light leading-tight tracking-tight text-ink sm:text-5xl">
              {ph.headline.split(' ').map((w, j, arr) => (
                <span key={j}>
                  {norm(w) === ph.accent.toLowerCase() ? (
                    <span className="font-script italic text-copper-deep">
                      {w}
                    </span>
                  ) : (
                    w
                  )}
                  {j < arr.length - 1 ? ' ' : ''}
                </span>
              ))}
            </h2>
            <p className="mt-3 max-w-xl text-sm text-ink/70 sm:text-base">
              {ph.sub}
            </p>
          </div>
        ))}
        <div className="mt-2 flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs uppercase tracking-[0.2em] text-ink/60">
          {sideCaptions.map((c) => (
            <span key={c} className="flex items-center gap-2">
              <span className="h-1 w-1 rounded-full bg-copper-deep" />
              {c}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}

export default function Hero() {
  const reduced = usePrefersReducedMotion()
  const isMobile = useIsMobile()
  const [lowPerf, setLowPerf] = useState(false)

  const sectionRef = useRef<HTMLElement | null>(null)
  const [wrapRef, nearViewport] = useNearViewport<HTMLDivElement>('300px')
  const setProgress = useScrollStore((s) => s.setProgress)
  const setHeroInView = useScrollStore((s) => s.setHeroInView)

  // Latch: once the hero has been near the viewport, keep the canvas mounted.
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    if (nearViewport) setMounted(true)
  }, [nearViewport])

  const heroInView = useScrollStore((s) => s.heroInView)

  // Single ScrollTrigger that turns section scroll into 0..1 progress.
  useEffect(() => {
    if (reduced || lowPerf) return
    const el = sectionRef.current
    if (!el) return
    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: el,
        start: 'top top',
        end: 'bottom bottom',
        onUpdate: (self) => setProgress(self.progress),
        onToggle: (self) => setHeroInView(self.isActive),
      })
    }, el)
    // Make sure measurements are correct after fonts/layout settle.
    const r = requestAnimationFrame(() => ScrollTrigger.refresh())
    return () => {
      cancelAnimationFrame(r)
      ctx.revert()
    }
  }, [reduced, lowPerf, setProgress, setHeroInView])

  // Lightweight FPS guard. We skip an initial warmup (shader compile + first
  // paint are the jankiest moments and would falsely condemn good devices),
  // then sample a one-second window. Only a sustained low frame rate drops us
  // to the static hero.
  useEffect(() => {
    if (reduced || lowPerf || !mounted) return
    const WARMUP_MS = 600
    const SAMPLE_MS = 1000
    const THRESHOLD_FPS = 30
    let frames = 0
    let raf = 0
    let sampleStart = 0
    const mountedAt = performance.now()
    const count = () => {
      const now = performance.now()
      if (now - mountedAt < WARMUP_MS) {
        raf = requestAnimationFrame(count)
        return
      }
      if (sampleStart === 0) sampleStart = now
      frames++
      const elapsed = now - sampleStart
      if (elapsed >= SAMPLE_MS) {
        const fps = (frames / elapsed) * 1000
        if (fps < THRESHOLD_FPS) setLowPerf(true)
        return
      }
      raf = requestAnimationFrame(count)
    }
    raf = requestAnimationFrame(count)
    return () => cancelAnimationFrame(raf)
  }, [mounted, reduced, lowPerf])

  if (reduced || lowPerf) {
    return <StaticHero />
  }

  return (
    <section
      ref={sectionRef}
      id="hero"
      className="relative"
      style={{ height: isMobile ? '360vh' : '450vh' }}
      aria-label="How we build a Dallas roof"
    >
      <div
        ref={wrapRef}
        className="sticky top-0 h-[100svh] w-full overflow-hidden"
      >
        <HeroPoster />
        {mounted && (
          <Suspense fallback={null}>
            <div className="absolute inset-0">
              <FrameScene active={heroInView} simplified={isMobile} />
            </div>
          </Suspense>
        )}
        {/* Soft cream band at the bottom so the dark headline text stays
            legible over the warm ground */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[38vh] bg-gradient-to-t from-cream/90 via-cream/40 to-transparent" />
        <HeroOverlay />
      </div>
    </section>
  )
}
