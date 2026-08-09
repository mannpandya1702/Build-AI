"use client";

import { useInView, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

/**
 * Counts up once when the number scrolls into view, then stops.
 *
 * The final value is rendered on the server and as the initial state under
 * reduced motion, so the real number is always in the DOM for screen readers
 * and for anyone who never triggers the animation.
 */
export function Counter({
  value,
  suffix = "",
  duration = 1600,
}: {
  value: number;
  suffix?: string;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const shouldReduce = useReducedMotion();
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    // Nothing to run: reduced motion keeps the real number, and before the
    // band is on screen the server-rendered value simply stands.
    if (shouldReduce || !inView) return;

    let frame = 0;
    const start = performance.now();
    // Same curve as the rest of the site, approximated for a scalar.
    const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      setDisplay(Math.round(easeOut(progress) * value));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [inView, shouldReduce, value, duration]);

  return (
    <span ref={ref} className="tabular-nums">
      {display}
      {suffix}
    </span>
  );
}
