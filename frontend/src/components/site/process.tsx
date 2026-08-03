"use client";

import { motion } from "framer-motion";
import { processSteps } from "@/lib/site";
import { EASE } from "@/lib/motion";
import { SectionHeading } from "./primitives";

export function Process() {
  return (
    <section id="process" className="relative mx-auto max-w-[1400px] px-5 py-28 sm:px-8 sm:py-36">
      <SectionHeading
        eyebrow="How we work"
        title="Small steps. Shipped things."
        blurb="No six-month discovery. We find the one workflow AI pays for first, prove it fast, then keep it running."
      />

      <div className="mt-16 grid gap-px overflow-hidden rounded-[var(--radius-card)] border border-line bg-line md:grid-cols-3">
        {processSteps.map((step, i) => (
          <motion.div
            key={step.index}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, delay: i * 0.1, ease: EASE }}
            className="group relative bg-canvas p-8 sm:p-10"
          >
            <span className="font-mono text-sm text-accent">
              {step.index}
            </span>
            <h3 className="mt-6 font-display text-2xl font-semibold tracking-tight">
              {step.title}
            </h3>
            <p className="mt-3 text-muted">{step.body}</p>

            {/* hairline that fills with accent on hover — quiet reward */}
            <span className="absolute inset-x-8 bottom-0 h-px origin-left scale-x-0 bg-accent transition-transform duration-500 group-hover:scale-x-100 sm:inset-x-10" />
          </motion.div>
        ))}
      </div>
    </section>
  );
}
