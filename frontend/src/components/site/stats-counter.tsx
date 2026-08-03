"use client";

import { useEffect, useRef, useState } from "react";
import { useInView } from "framer-motion";
import { numbers } from "@/lib/site";

function useCountUp(to: number, run: boolean, duration = 1400) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!run) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setValue(to);
      return;
    }
    let raf = 0;
    let start: number | null = null;
    const tick = (t: number) => {
      if (start === null) start = t;
      const p = Math.min(1, (t - start) / duration);
      // ease-out
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.round(eased * to));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to, run, duration]);

  return value;
}

function Stat({ to, suffix, label, sub }: (typeof numbers)[number]) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const value = useCountUp(to, inView);

  return (
    <div ref={ref} className="relative px-6 py-10 sm:px-8">
      <div className="flex items-baseline font-display text-5xl font-semibold tracking-tight tabular-nums sm:text-6xl">
        {value}
        <span className="text-accent">{suffix}</span>
      </div>
      <div className="mt-3 text-sm font-medium text-ink">{label}</div>
      <div className="mt-1 font-mono text-xs text-muted">{sub}</div>
    </div>
  );
}

export function StatsCounter() {
  return (
    <section className="relative overflow-hidden border-y border-line bg-panel/30">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(80%_60%_at_50%_0%,rgba(123,92,255,0.10),transparent_70%)]"
      />
      <div className="relative mx-auto max-w-[1400px] px-5 py-16 sm:px-8">
        <p className="mb-2 flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] text-accent">
          <span className="h-px w-8 bg-accent/50" />
          Maana in numbers
        </p>
        <div className="grid grid-cols-1 gap-px overflow-hidden rounded-[var(--radius-card)] border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
          {numbers.map((n) => (
            <div key={n.label} className="bg-canvas">
              <Stat {...n} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
