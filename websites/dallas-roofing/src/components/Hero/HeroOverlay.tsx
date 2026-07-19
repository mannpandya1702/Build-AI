/**
 * HeroOverlay.tsx
 * -----------------------------------------------------------------------------
 * The HTML layer that sits over the canvas: phase headlines, the center
 * reticle, the left progress rail, and the rotating side captions.
 *
 * pointer-events: none so it never blocks scroll. Everything animates from a
 * single rAF loop that reads getProgress() and writes styles imperatively, so
 * React never re-renders on scroll.
 */

import { useEffect, useRef } from 'react'
import { getHeroInView, getProgress } from '../../store/useScrollStore'
import { clamp01, smoothstep } from '../../lib/math'
import { siteConfig } from '../../site.config'

/** Renders a headline with its single accent word in the script font. */
function Headline({ headline, accent }: { headline: string; accent: string }) {
  const words = headline.split(' ')
  const norm = (w: string) => w.replace(/[.,!?]/g, '').toLowerCase()
  return (
    <>
      {words.map((w, i) => {
        const isAccent = norm(w) === accent.toLowerCase()
        return (
          <span key={i}>
            {isAccent ? (
              <span className="font-script text-copper italic">{w}</span>
            ) : (
              w
            )}
            {i < words.length - 1 ? ' ' : ''}
          </span>
        )
      })}
    </>
  )
}

/** Ramp up over [inA,inB], hold, ramp down over [outA,outB]. */
function band(p: number, inA: number, inB: number, outA: number, outB: number) {
  const up = smoothstep((p - inA) / (inB - inA))
  const down = 1 - smoothstep((p - outA) / (outB - outA))
  return clamp01(Math.min(up, down))
}

// Visibility windows per phase headline.
const HEADLINE_WINDOWS = [
  { inA: 0.15, inB: 0.24, outA: 0.38, outB: 0.45 },
  { inA: 0.45, inB: 0.53, outA: 0.62, outB: 0.68 },
  { inA: 0.68, inB: 0.77, outA: 1.01, outB: 1.05 },
]

const CAPTION_WINDOWS = [
  { inA: 0.12, inB: 0.2, outA: 0.36, outB: 0.42 },
  { inA: 0.42, inB: 0.5, outA: 0.62, outB: 0.68 },
  { inA: 0.68, inB: 0.76, outA: 1.01, outB: 1.05 },
]

export default function HeroOverlay() {
  const { phases, sideCaptions, reticleLabel } = siteConfig.hero

  const headlineRefs = useRef<(HTMLDivElement | null)[]>([])
  const captionRefs = useRef<(HTMLDivElement | null)[]>([])
  const reticleRef = useRef<HTMLDivElement | null>(null)
  const railFillRef = useRef<HTMLDivElement | null>(null)
  const railDotRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    let raf = 0
    const tick = () => {
      raf = requestAnimationFrame(tick)
      if (!getHeroInView()) return
      const p = getProgress()

      // Headlines: crossfade + drift up slightly.
      for (let i = 0; i < headlineRefs.current.length; i++) {
        const el = headlineRefs.current[i]
        if (!el) continue
        const w = HEADLINE_WINDOWS[i]
        const o = band(p, w.inA, w.inB, w.outA, w.outB)
        // Drift: enters from +16px, leaves toward -16px.
        const enter = smoothstep((p - w.inA) / (w.inB - w.inA))
        const leave = smoothstep((p - w.outA) / (w.outB - w.outA))
        const y = (1 - enter) * 16 - leave * 16
        el.style.opacity = String(o)
        el.style.transform = `translateY(${y}px)`
      }

      // Side captions.
      for (let i = 0; i < captionRefs.current.length; i++) {
        const el = captionRefs.current[i]
        if (!el) continue
        const w = CAPTION_WINDOWS[i]
        const o = band(p, w.inA, w.inB, w.outA, w.outB)
        el.style.opacity = String(o)
        el.style.transform = `translateX(${(1 - o) * 10}px)`
      }

      // Reticle fades out after the first scroll.
      if (reticleRef.current) {
        reticleRef.current.style.opacity = String(1 - smoothstep(p / 0.09))
      }

      // Left progress rail fills with the accent color.
      if (railFillRef.current) {
        railFillRef.current.style.transform = `scaleY(${clamp01(p)})`
      }
      if (railDotRef.current) {
        railDotRef.current.style.top = `${clamp01(p) * 100}%`
        railDotRef.current.style.opacity = p > 0.01 && p < 0.99 ? '1' : '0'
      }
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <div className="pointer-events-none absolute inset-0 z-10 select-none">
      {/* Left progress rail */}
      <div className="absolute left-5 top-1/2 hidden h-48 w-px -translate-y-1/2 bg-white/12 sm:block md:left-8">
        <div
          ref={railFillRef}
          className="absolute inset-x-0 top-0 h-full origin-top bg-copper"
          style={{ transform: 'scaleY(0)' }}
        />
        <div
          ref={railDotRef}
          className="absolute left-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-copper shadow-[0_0_10px_2px_rgba(224,134,58,0.6)]"
          style={{ top: '0%', opacity: 0 }}
        />
        <span className="absolute -left-1 top-full mt-3 -rotate-90 whitespace-nowrap text-[10px] uppercase tracking-[0.3em] text-muted">
          Progress
        </span>
      </div>

      {/* Rotating side captions (top-right) */}
      <div className="absolute right-5 top-24 flex flex-col items-end gap-1 md:right-8 md:top-28">
        {sideCaptions.map((c, i) => (
          <div
            key={i}
            ref={(el) => {
              captionRefs.current[i] = el
            }}
            className="absolute right-0 flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted"
            style={{ opacity: 0 }}
          >
            <span className="h-1 w-1 rounded-full bg-copper" />
            {c}
          </div>
        ))}
      </div>

      {/* Center reticle */}
      <div
        ref={reticleRef}
        className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
      >
        <div className="relative h-16 w-16">
          <div className="absolute inset-0 rounded-full border border-copper/50" />
          <div className="absolute inset-[6px] rounded-full border border-white/15" />
          <span className="absolute left-1/2 top-0 h-4 w-px -translate-x-1/2 bg-copper/60" />
          <span className="absolute bottom-0 left-1/2 h-4 w-px -translate-x-1/2 bg-copper/60" />
          <span className="absolute left-0 top-1/2 h-px w-4 -translate-y-1/2 bg-copper/60" />
          <span className="absolute right-0 top-1/2 h-px w-4 -translate-y-1/2 bg-copper/60" />
          <span className="absolute left-1/2 top-1/2 h-1 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-copper" />
        </div>
        <span className="mt-4 text-[11px] uppercase tracking-[0.4em] text-muted">
          {reticleLabel}
        </span>
      </div>

      {/* Phase headlines (stacked, crossfaded) */}
      <div className="absolute inset-x-0 bottom-[14vh] flex flex-col items-center px-6 md:bottom-[16vh]">
        <div className="relative w-full max-w-3xl text-center">
          {phases.map((ph, i) => (
            <div
              key={i}
              ref={(el) => {
                headlineRefs.current[i] = el
              }}
              className="absolute inset-x-0 bottom-0 flex flex-col items-center"
              style={{ opacity: 0 }}
            >
              <h2 className="text-balance text-4xl font-light leading-tight tracking-tight text-offwhite sm:text-5xl md:text-6xl">
                <Headline headline={ph.headline} accent={ph.accent} />
              </h2>
              <p className="mt-4 max-w-xl text-balance text-sm text-muted sm:text-base">
                {ph.sub}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
