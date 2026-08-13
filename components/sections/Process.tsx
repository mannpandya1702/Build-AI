"use client";

import { motion, useReducedMotion, useScroll, useSpring, useTransform } from "framer-motion";
import { useRef } from "react";

import { Reveal, Stagger } from "@/components/motion/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { processSteps } from "@/content/process";

/**
 * Four steps. The connecting line draws itself as the section scrolls through
 * the viewport — horizontal from md up, vertical on mobile where the steps
 * stack.
 *
 * Under reduced motion the line is simply present at full length.
 */
export function Process() {
  const ref = useRef<HTMLDivElement>(null);
  const shouldReduce = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 75%", "end 60%"],
  });
  // Smooth the raw progress so the line does not jitter with the scroll wheel.
  const progress = useSpring(scrollYProgress, {
    stiffness: 90,
    damping: 26,
    restDelta: 0.001,
  });
  const scale = useTransform(progress, [0, 1], [0, 1]);

  return (
    <section id="process" className="scroll-mt-24 bg-chandni pb-section">
      <div className="shell">
        <SectionHeading eyebrow="How we work" title="Four steps, in this order.">
          No moodboards in the first meeting. We would rather know what your
          family does before we show you anything.
        </SectionHeading>

        <div ref={ref} className="relative mt-16 md:mt-24">
          {/* Track — sits behind the steps at the top of the number row. */}
          <div
            aria-hidden
            className="absolute left-[0.9rem] top-2 h-full w-px bg-ink/10 md:left-0 md:top-[0.9rem] md:h-px md:w-full"
          />
          {/* Drawn line. Two elements — one per axis — so the transform origin
              is correct at each breakpoint without fighting the other. */}
          <motion.span
            aria-hidden
            className="absolute left-[0.9rem] top-2 block h-full w-px origin-top bg-pista-deep md:hidden"
            style={{ scaleY: shouldReduce ? 1 : scale }}
          />
          <motion.span
            aria-hidden
            className="absolute left-0 top-[0.9rem] hidden h-px w-full origin-left bg-pista-deep md:block"
            style={{ scaleX: shouldReduce ? 1 : scale }}
          />

          <Stagger className="grid gap-12 md:grid-cols-4 md:gap-8">
            {processSteps.map((step) => (
              <Reveal asChild key={step.id}>
                <div className="relative pl-12 md:pl-0 md:pt-12">
                  {/* Node on the track. */}
                  <span
                    aria-hidden
                    className="absolute left-[0.55rem] top-2 h-3 w-3 rounded-full border-2 border-pista-deep bg-chandni md:left-0 md:top-[0.55rem]"
                  />
                  <p className="font-display text-2xl font-light text-pista-ink">
                    {step.index}
                  </p>
                  <h3 className="mt-3 font-display text-display-sm font-light text-ink">
                    {step.title}
                  </h3>
                  {/* The label was in the data but never rendered. The studio's
                      four names each come paired with what they cover — "First
                      Word — the introductory call" — and without that pairing
                      the names are evocative but not self-explanatory. */}
                  <p className="mt-2 font-sans text-micro uppercase tracking-[0.14em] text-sona-deep">
                    {step.label}
                  </p>
                  <p className="mt-4 max-w-measure font-sans text-body text-stone-deep">
                    {step.body}
                  </p>
                </div>
              </Reveal>
            ))}
          </Stagger>
        </div>
      </div>
    </section>
  );
}
