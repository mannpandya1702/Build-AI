"use client";

// The "whoa layer" motion kit (CLAUDE.md §5c): 3D interactive tilt, cinematic parallax, count-up
// stats. All GPU-cheap transforms — no WebGL, no bundle bloat — so the 2.5s mobile budget and the
// tap-to-call priority are never at risk. Every piece degrades to static under
// prefers-reduced-motion and on touch devices (tilt follows a mouse; there is none on a phone).
import { useEffect, useRef, useState } from "react";
import {
  motion,
  animate,
  useInView,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";

/** Hydration-safe reduced-motion flag: SSR cannot know the user's media query, so the first
 *  client render must match the server (false); the real preference applies right after mount.
 *  Branching a tree on the raw useReducedMotion() value hydration-errors for reduced-motion
 *  users — every component in this template must use THIS hook instead. */
export function useReducedMotionSafe(): boolean {
  const reduce = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted ? Boolean(reduce) : false;
}

/** 3D perspective tilt + moving light glare, following the pointer. The hero photo behaves like a
 *  physical card. Desktop-only by nature (mouse events); static on touch and reduced motion. */
export function Tilt({ children, className, max = 7 }: { children: React.ReactNode; className?: string; max?: number }) {
  const reduce = useReducedMotionSafe();
  const ref = useRef<HTMLDivElement>(null);
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const gx = useMotionValue(50);
  const gy = useMotionValue(35);
  const srx = useSpring(rx, { stiffness: 160, damping: 22 });
  const sry = useSpring(ry, { stiffness: 160, damping: 22 });

  // NEVER branch the element tree on reduced motion (server HTML must match the client's first
  // render for every user — a divergent tree is a guaranteed hydration error). The tree is
  // constant; reduced motion simply never updates the motion values, so everything stays at rest.
  function onMove(e: React.MouseEvent<HTMLDivElement>) {
    if (reduce) return;
    const el = ref.current;
    if (!el) return;
    const b = el.getBoundingClientRect();
    const px = (e.clientX - b.left) / b.width;
    const py = (e.clientY - b.top) / b.height;
    ry.set((px - 0.5) * 2 * max);
    rx.set((0.5 - py) * 2 * max);
    gx.set(px * 100);
    gy.set(py * 100);
  }
  function onLeave() {
    rx.set(0);
    ry.set(0);
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{ rotateX: srx, rotateY: sry, transformPerspective: 900, transformStyle: "preserve-3d" }}
      className={className}
    >
      {children}
      {/* light glare that tracks the pointer — the "physical object" cue */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-10"
        style={{
          background: useTransform(
            [gx, gy],
            ([x, y]) => `radial-gradient(60% 45% at ${x}% ${y}%, rgba(255,255,255,0.16) 0%, transparent 70%)`,
          ),
        }}
      />
    </motion.div>
  );
}

/** Subtle depth parallax: the wrapped layer drifts slower than the scroll. Constant element tree
 *  (see Tilt): under reduced motion the offset is transformed to a constant 0. */
export function Parallax({ children, className, amount = 60 }: { children: React.ReactNode; className?: string; amount?: number }) {
  const reduce = useReducedMotionSafe();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 700], [0, reduce ? 0 : amount]);
  return (
    <motion.div ref={ref} style={{ y }} className={className}>
      {children}
    </motion.div>
  );
}

/** Count-up number when it enters view (rating, review count). Static under reduced motion. */
export function CountUp({ value, decimals = 0 }: { value: number; decimals?: number }) {
  const reduce = useReducedMotionSafe();
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-30px" });
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (!inView) return;
    if (reduce) {
      setDisplay(value);
      return;
    }
    const controls = animate(0, value, { duration: 1.1, ease: [0.22, 1, 0.36, 1], onUpdate: (v) => setDisplay(v) });
    return () => controls.stop();
  }, [inView, reduce, value]);
  return <span ref={ref}>{(inView ? display : 0).toFixed(decimals)}</span>;
}
