"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Plus } from "lucide-react";
import { useState } from "react";

import type { Faq } from "@/content/faqs";
import { EASE } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * FAQ accordion. Real buttons with aria-expanded/aria-controls, one panel open
 * at a time. The plus rotates to a minus rather than swapping icons, so the
 * control never shifts the row's layout bounds.
 */
export function Accordion({ items }: { items: Faq[] }) {
  const [openId, setOpenId] = useState<string | null>(items[0]?.id ?? null);
  const shouldReduce = useReducedMotion();

  return (
    <div className="divide-y divide-ink/10 border-y border-ink/10">
      {items.map((item) => {
        const isOpen = openId === item.id;

        return (
          <div key={item.id}>
            <h3>
              <button
                type="button"
                onClick={() => setOpenId(isOpen ? null : item.id)}
                aria-expanded={isOpen}
                aria-controls={`panel-${item.id}`}
                id={`trigger-${item.id}`}
                className="group flex w-full items-center justify-between gap-6 py-6 text-left transition-colors duration-[250ms] ease-riwaaya hover:text-pista-ink md:py-7"
              >
                <span className="font-display text-display-sm font-light text-ink transition-colors duration-[250ms] ease-riwaaya group-hover:text-pista-ink">
                  {item.question}
                </span>
                <span
                  aria-hidden
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-ink/15 transition-all duration-[350ms] ease-riwaaya",
                    isOpen ? "rotate-45 border-pista-ink bg-pista-ink text-chandni" : "text-ink",
                  )}
                >
                  <Plus className="h-4 w-4" strokeWidth={1.5} />
                </span>
              </button>
            </h3>

            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  id={`panel-${item.id}`}
                  role="region"
                  aria-labelledby={`trigger-${item.id}`}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: shouldReduce ? 0.15 : 0.45, ease: EASE }}
                  className="overflow-hidden"
                >
                  <p className="max-w-prose pb-7 pr-10 font-sans text-body-lg text-stone-deep">
                    {item.answer}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
