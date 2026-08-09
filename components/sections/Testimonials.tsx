"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";

import { SectionHeading } from "@/components/ui/SectionHeading";
import { testimonials } from "@/content/testimonials";
import { EASE } from "@/lib/motion";
import { cn } from "@/lib/utils";

const INTERVAL = 7000;

/**
 * One quote at a time, set large, advancing every 7 seconds.
 *
 * Auto-advance pauses on hover and on keyboard focus, and stops entirely under
 * prefers-reduced-motion — an auto-rotating carousel is exactly the kind of
 * motion people turn that setting on to avoid. The dots are real buttons, and
 * the region is a labelled aria-live area so a screen reader announces changes.
 */
export function Testimonials() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const shouldReduce = useReducedMotion();

  const advance = useCallback(() => {
    setIndex((current) => (current + 1) % testimonials.length);
  }, []);

  useEffect(() => {
    if (paused || shouldReduce) return;
    const timer = window.setInterval(advance, INTERVAL);
    return () => window.clearInterval(timer);
  }, [advance, paused, shouldReduce]);

  const current = testimonials[index];

  return (
    <section
      id="testimonials"
      className="scroll-mt-24 border-y border-ink/10 bg-chandni py-section"
    >
      <div className="shell">
        <SectionHeading eyebrow="In their words" title="What families say afterwards." />

        <div
          className="mt-14 md:mt-20"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocusCapture={() => setPaused(true)}
          onBlurCapture={() => setPaused(false)}
        >
          <div
            aria-live="polite"
            aria-atomic="true"
            className="relative min-h-[19rem] sm:min-h-[16rem] md:min-h-[18rem]"
          >
            <AnimatePresence mode="wait">
              <motion.figure
                key={current.id}
                initial={shouldReduce ? { opacity: 0 } : { opacity: 0, y: 20 }}
                animate={shouldReduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
                exit={shouldReduce ? { opacity: 0 } : { opacity: 0, y: -14 }}
                transition={{ duration: shouldReduce ? 0.2 : 0.6, ease: EASE }}
                className="max-w-4xl"
              >
                <blockquote className="font-display text-display-md font-light leading-[1.2] text-ink">
                  <span aria-hidden>“</span>
                  {current.quote}
                  <span aria-hidden>”</span>
                </blockquote>
                <figcaption className="mt-8 flex flex-col gap-1">
                  <span className="font-sans text-body font-semibold text-ink">
                    {current.name}
                  </span>
                  <span className="font-sans text-micro uppercase tracking-[0.14em] text-stone-deep">
                    {current.context}
                  </span>
                </figcaption>
              </motion.figure>
            </AnimatePresence>
          </div>

          <div className="mt-10 flex items-center gap-3" role="tablist" aria-label="Testimonials">
            {testimonials.map((item, dotIndex) => {
              const active = dotIndex === index;
              return (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  aria-label={`Show testimonial from ${item.name}`}
                  onClick={() => setIndex(dotIndex)}
                  // 44px target via padding; the visible bar stays hairline.
                  className="group flex h-11 items-center px-1"
                >
                  <span
                    className={cn(
                      "block h-[2px] transition-all duration-[400ms] ease-riwaaya",
                      active
                        ? "w-12 bg-pista-deep"
                        : "w-6 bg-ink/20 group-hover:bg-ink/40",
                    )}
                  />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
