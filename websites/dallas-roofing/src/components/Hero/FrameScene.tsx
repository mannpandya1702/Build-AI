/**
 * FrameScene.tsx
 * -----------------------------------------------------------------------------
 * Photoreal scroll hero: plays a pre-rendered (path-traced) image sequence of
 * the house build, driven by scroll progress. This replaces the live WebGL
 * scene (RoofScene) with offline-render quality, exactly like reference
 * scroll-video sites.
 *
 * - Frames live in /frames (desktop) and /frames/m (mobile), rendered from
 *   the Blender scene in tools/render (see repo notes).
 * - Progressive preload: first frame ASAP, then the rest in batches; the CSS
 *   poster shows until frame 0 arrives.
 * - Draw loop reads getProgress() via rAF and paints to a <canvas> with
 *   cover-fit and neighbor-frame crossfade, so scrubbing is smooth even
 *   between frames. React never re-renders on scroll.
 */

import { useEffect, useRef } from 'react'
import { getHeroInView, getProgress } from '../../store/useScrollStore'
import { clamp01 } from '../../lib/math'

export const FRAME_COUNT = 60

interface FrameSceneProps {
  active: boolean
  simplified: boolean
}

function frameUrl(i: number, simplified: boolean) {
  const n = String(i).padStart(4, '0')
  return simplified ? `/frames/m/frame_${n}.webp` : `/frames/frame_${n}.webp`
}

export default function FrameScene({ active, simplified }: FrameSceneProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const imagesRef = useRef<(HTMLImageElement | null)[]>([])
  const loadedRef = useRef<boolean[]>([])
  const activeRef = useRef(active)
  activeRef.current = active

  // Progressive preload: frame 0 first, then fan out.
  useEffect(() => {
    let cancelled = false
    imagesRef.current = new Array(FRAME_COUNT).fill(null)
    loadedRef.current = new Array(FRAME_COUNT).fill(false)

    const load = (i: number) =>
      new Promise<void>((resolve) => {
        const img = new Image()
        img.decoding = 'async'
        img.onload = () => {
          if (!cancelled) {
            imagesRef.current[i] = img
            loadedRef.current[i] = true
          }
          resolve()
        }
        img.onerror = () => resolve()
        img.src = frameUrl(i, simplified)
      })

    const run = async () => {
      // First frame immediately, then coarse keyframes, then fill.
      await load(0)
      const order: number[] = []
      for (let step = 8; step >= 1; step = Math.floor(step / 2)) {
        for (let i = 0; i < FRAME_COUNT; i += step) {
          if (!order.includes(i)) order.push(i)
        }
        if (step === 1) break
      }
      const CONCURRENCY = 6
      let cursor = 0
      const workers = Array.from({ length: CONCURRENCY }, async () => {
        while (cursor < order.length && !cancelled) {
          const i = order[cursor++]
          if (!loadedRef.current[i]) await load(i)
        }
      })
      await Promise.all(workers)
    }
    run()
    return () => {
      cancelled = true
    }
  }, [simplified])

  // Draw loop: cover-fit + neighbor crossfade.
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = Math.min(window.devicePixelRatio || 1, 2)

    const resize = () => {
      const { clientWidth, clientHeight } = canvas
      canvas.width = Math.round(clientWidth * dpr)
      canvas.height = Math.round(clientHeight * dpr)
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    const nearestLoaded = (i: number) => {
      for (let d = 0; d < FRAME_COUNT; d++) {
        if (i - d >= 0 && loadedRef.current[i - d]) return i - d
        if (i + d < FRAME_COUNT && loadedRef.current[i + d]) return i + d
      }
      return -1
    }

    const drawCover = (img: HTMLImageElement, alpha: number) => {
      const cw = canvas.width
      const ch = canvas.height
      const s = Math.max(cw / img.width, ch / img.height)
      const w = img.width * s
      const h = img.height * s
      // keep the house (slightly below center) in frame when cropping
      const x = (cw - w) / 2
      const y = (ch - h) * 0.55
      ctx.globalAlpha = alpha
      ctx.drawImage(img, x, y, w, h)
    }

    let raf = 0
    let lastKey = -1
    const tick = () => {
      raf = requestAnimationFrame(tick)
      if (!activeRef.current && !getHeroInView()) return
      const p = clamp01(getProgress())
      const f = p * (FRAME_COUNT - 1)
      const i0 = Math.floor(f)
      const i1 = Math.min(FRAME_COUNT - 1, i0 + 1)
      const frac = f - i0
      const a = nearestLoaded(i0)
      if (a < 0) return
      const b = loadedRef.current[i1] ? i1 : -1
      const key = a * 1000 + (b >= 0 ? b : 0) + Math.round(frac * 100) / 100
      if (key === lastKey) return
      lastKey = key
      const imgA = imagesRef.current[a]
      if (!imgA) return
      drawCover(imgA, 1)
      if (b >= 0 && b !== a && frac > 0.01) {
        const imgB = imagesRef.current[b]
        if (imgB) drawCover(imgB, frac)
      }
      ctx.globalAlpha = 1
    }
    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="h-full w-full"
      aria-hidden="true"
      style={{ display: 'block' }}
    />
  )
}
