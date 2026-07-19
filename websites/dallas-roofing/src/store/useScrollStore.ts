/**
 * A tiny zustand store shared between the DOM overlay and the R3F canvas.
 *
 * IMPORTANT performance contract:
 * - `progress` is the live 0..1 hero scroll progress. It is written every frame
 *   from GSAP's ScrollTrigger `onUpdate`.
 * - The R3F scene must NOT subscribe to this via React state (that would
 *   re-render on every frame). Instead it reads `getProgress()` inside
 *   `useFrame`. The store also keeps a plain ref-like getter for that reason.
 * - The overlay subscribes with a throttle so text/rail update cheaply without
 *   a per-frame React render.
 */

import { create } from 'zustand'

interface ScrollState {
  /** Live hero progress, 0 (top of hero) to 1 (bottom of pinned section). */
  progress: number
  /** True once the hero canvas is mounted and rendering. */
  heroActive: boolean
  /** True while the hero is within (or near) the viewport; drives render loop. */
  heroInView: boolean
  setProgress: (p: number) => void
  setHeroActive: (v: boolean) => void
  setHeroInView: (v: boolean) => void
}

export const useScrollStore = create<ScrollState>((set) => ({
  progress: 0,
  heroActive: false,
  heroInView: true,
  setProgress: (p) => set({ progress: p }),
  setHeroActive: (v) => set({ heroActive: v }),
  setHeroInView: (v) => set({ heroInView: v }),
}))

/**
 * Non-reactive progress read for use inside useFrame / requestAnimationFrame.
 * Never triggers a React render.
 */
export const getProgress = () => useScrollStore.getState().progress
export const getHeroInView = () => useScrollStore.getState().heroInView
