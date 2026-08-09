"use client";

import { motion, useMotionValue, useReducedMotion, useSpring } from "framer-motion";
import { useEffect, useState } from "react";

/**
 * Soft dot follower, desktop only.
 *
 * It scales up over anything interactive. It is decorative — the native cursor
 * stays visible underneath, so nothing depends on this rendering. Disabled
 * entirely under pointer: coarse and under prefers-reduced-motion.
 */
export function Cursor() {
  const shouldReduce = useReducedMotion();
  const [enabled, setEnabled] = useState(false);
  const [active, setActive] = useState(false);
  const [visible, setVisible] = useState(false);

  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const springX = useSpring(x, { stiffness: 380, damping: 32, mass: 0.35 });
  const springY = useSpring(y, { stiffness: 380, damping: 32, mass: 0.35 });

  useEffect(() => {
    // Fine pointer only — no touch, no stylus.
    const query = window.matchMedia("(pointer: fine)");
    const apply = () => setEnabled(query.matches);
    apply();
    query.addEventListener("change", apply);
    return () => query.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    if (!enabled || shouldReduce) return;

    const INTERACTIVE = 'a, button, [role="button"], input, textarea, select, summary, [data-cursor="grow"]';

    const onMove = (event: MouseEvent) => {
      x.set(event.clientX);
      y.set(event.clientY);
      setVisible(true);
      const target = event.target as HTMLElement | null;
      setActive(Boolean(target?.closest(INTERACTIVE)));
    };

    const onLeave = () => setVisible(false);

    window.addEventListener("mousemove", onMove, { passive: true });
    document.addEventListener("mouseleave", onLeave);
    return () => {
      window.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseleave", onLeave);
    };
  }, [enabled, shouldReduce, x, y]);

  if (!enabled || shouldReduce) return null;

  return (
    <motion.div
      aria-hidden
      className="cursor-dot pointer-events-none fixed left-0 top-0 z-[60] hidden h-3 w-3 rounded-full bg-pista-deep md:block"
      style={{
        x: springX,
        y: springY,
        translateX: "-50%",
        translateY: "-50%",
      }}
      animate={{
        scale: active ? 3.2 : 1,
        opacity: visible ? (active ? 0.28 : 0.55) : 0,
      }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
    />
  );
}
