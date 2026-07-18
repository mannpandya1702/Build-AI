"use client";

import { useEffect, useRef } from "react";

/**
 * Drives a single radial-gradient element to follow the pointer, throttled to
 * one write per animation frame. Returns refs for the container (the region the
 * glow lives in) and the glow element itself. Near-zero cost: no React state,
 * no re-renders, transforms only.
 */
export function useCursorGlow<T extends HTMLElement = HTMLDivElement>() {
  const containerRef = useRef<T>(null);
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const glow = glowRef.current;
    if (!container || !glow) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    let raf = 0;
    let targetX = 0;
    let targetY = 0;
    let hasMoved = false;

    const render = () => {
      raf = 0;
      glow.style.transform = `translate3d(${targetX}px, ${targetY}px, 0)`;
      if (!hasMoved) {
        hasMoved = true;
        glow.style.opacity = "1";
      }
    };

    const onMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      targetX = e.clientX - rect.left;
      targetY = e.clientY - rect.top;
      if (!raf) raf = requestAnimationFrame(render);
    };

    const onLeave = () => {
      glow.style.opacity = "0";
    };

    container.addEventListener("pointermove", onMove);
    container.addEventListener("pointerleave", onLeave);

    return () => {
      container.removeEventListener("pointermove", onMove);
      container.removeEventListener("pointerleave", onLeave);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return { containerRef, glowRef };
}
