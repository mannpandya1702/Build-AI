"use client";

import { motion } from "framer-motion";
import { X, Check } from "lucide-react";
import { comparison } from "@/lib/site";
import { EASE } from "@/lib/motion";
import { Eyebrow } from "./primitives";

export function Comparison() {
  return (
    <section className="relative mx-auto max-w-[1400px] px-5 py-28 sm:px-8 sm:py-36">
      <Eyebrow label="The difference" />
      <h2 className="max-w-2xl font-display text-[clamp(2rem,4.5vw,3.5rem)] font-semibold leading-[1.02] tracking-[-0.02em]">
        Two ways to run the next quarter.
      </h2>

      <div className="mt-14 grid gap-4 md:grid-cols-2">
        {/* Without */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6, ease: EASE }}
          className="rounded-[var(--radius-card)] border border-line bg-panel/30 p-7 sm:p-9"
        >
          <div className="mb-6 font-mono text-xs uppercase tracking-wider text-muted">
            Without Maana
          </div>
          <ul className="grid gap-4">
            {comparison.without.map((item) => (
              <li key={item} className="flex items-start gap-3 text-muted">
                <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border border-line-strong">
                  <X className="h-3 w-3" />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </motion.div>

        {/* With — the accent side */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6, delay: 0.1, ease: EASE }}
          className="relative overflow-hidden rounded-[var(--radius-card)] border border-accent/40 bg-panel p-7 sm:p-9"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_100%_at_100%_0%,rgba(123,92,255,0.16),transparent_60%)]"
          />
          <div className="relative mb-6 font-mono text-xs uppercase tracking-wider text-accent">
            With Maana
          </div>
          <ul className="relative grid gap-4">
            {comparison.with.map((item) => (
              <li key={item} className="flex items-start gap-3 text-ink">
                <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-accent text-white">
                  <Check className="h-3 w-3" strokeWidth={3} />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </motion.div>
      </div>
    </section>
  );
}
