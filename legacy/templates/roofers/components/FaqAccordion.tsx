"use client";

// FAQ accordion — structure adapted from 21st.dev "Interactive Accordion" (@jatin-yadav05),
// restyled through the contract (§5b-bis): shadcn tokens → our palette variables, brand circle on
// the active number, brand underline sweep, plus-to-X indicator. Springs are inert under reduced
// motion. Copy stays exactly the builder's fact-safe FAQ — this changes presentation only.
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useReducedMotionSafe } from "./Motion";
import { site } from "../lib/content";

export default function FaqAccordion() {
  const reduce = useReducedMotionSafe();
  const [active, setActive] = useState<number | null>(0);
  const [hovered, setHovered] = useState<number | null>(null);
  const spring = reduce ? { duration: 0 } : { type: "spring" as const, stiffness: 320, damping: 28 };

  return (
    <div>
      {site.faq.map((f, i) => {
        const isActive = active === i;
        const isHovered = hovered === i;
        return (
          <div key={f.q}>
            <motion.button
              onClick={() => setActive(isActive ? null : i)}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              className="group relative w-full text-left"
              initial={false}
              aria-expanded={isActive}
            >
              <div className="flex items-center gap-5 px-1 py-5">
                <div className="relative flex h-10 w-10 shrink-0 items-center justify-center">
                  <motion.div
                    className="absolute inset-0 rounded-full bg-brand"
                    initial={false}
                    animate={{ scale: isActive ? 1 : isHovered ? 0.85 : 0, opacity: isActive ? 1 : isHovered ? 0.12 : 0 }}
                    transition={spring}
                  />
                  <span className={`relative z-10 font-display text-sm font-extrabold tracking-wide transition-colors duration-200 ${isActive ? "text-brandink" : "text-ink/40"}`}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </div>
                <motion.h3
                  className={`font-display text-lg font-extrabold transition-colors duration-200 md:text-xl ${isActive || isHovered ? "text-ink" : "text-ink/60"}`}
                  animate={{ x: isActive || isHovered ? 4 : 0 }}
                  transition={spring}
                >
                  {f.q}
                </motion.h3>
                <motion.span
                  className="ml-auto flex h-8 w-8 shrink-0 items-center justify-center"
                  animate={{ rotate: isActive ? 45 : 0 }}
                  transition={spring}
                  aria-hidden
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className={`transition-opacity duration-200 ${isActive || isHovered ? "opacity-100 text-brand" : "opacity-40 text-ink"}`}>
                    <path d="M8 1V15M1 8H15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </motion.span>
              </div>
              <div aria-hidden className="absolute bottom-0 left-0 right-0 h-px origin-left bg-ink/10" />
              <motion.div
                aria-hidden
                className="absolute bottom-0 left-0 h-px w-full origin-left bg-brand"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: isActive ? 1 : isHovered ? 0.25 : 0 }}
                transition={spring}
              />
            </motion.button>
            <AnimatePresence initial={false}>
              {isActive && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1, transition: { height: spring, opacity: { duration: reduce ? 0 : 0.2, delay: reduce ? 0 : 0.08 } } }}
                  exit={{ height: 0, opacity: 0, transition: { height: spring, opacity: { duration: reduce ? 0 : 0.1 } } }}
                  className="overflow-hidden"
                >
                  <p className="py-5 pl-16 pr-10 leading-relaxed text-ink/70">{f.a}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
