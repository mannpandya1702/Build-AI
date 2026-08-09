"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { EASE } from "@/lib/motion";

/**
 * A chandni panel wipes across on every route change: it sweeps in from the
 * bottom, covers, then lifts off the top while the new page fades up.
 *
 * Under prefers-reduced-motion the panel is skipped and the content
 * cross-fades instead.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const shouldReduce = useReducedMotion();

  if (shouldReduce) {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={pathname}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.25 }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <>
      <AnimatePresence mode="wait">
        <motion.div
          key={pathname}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE, delay: 0.12 }}
        >
          {children}
        </motion.div>
      </AnimatePresence>

      <AnimatePresence mode="wait">
        <motion.div
          key={`wipe-${pathname}`}
          aria-hidden
          className="pointer-events-none fixed inset-0 z-[70] bg-chandni"
          initial={{ scaleY: 1, transformOrigin: "top" }}
          animate={{ scaleY: 0, transformOrigin: "top" }}
          transition={{ duration: 0.6, ease: EASE }}
        />
      </AnimatePresence>
    </>
  );
}
