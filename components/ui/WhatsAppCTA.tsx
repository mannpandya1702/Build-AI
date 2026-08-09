"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { MessageCircle } from "lucide-react";

import { EASE } from "@/lib/motion";
import { DEFAULT_WHATSAPP_MESSAGE, WHATSAPP_DISPLAY, whatsappHref } from "@/lib/site";
import { useScrolledPast } from "@/lib/useScrolledPast";
import { cn } from "@/lib/utils";

/**
 * One component, three placements.
 *
 * - "float"  bottom-right, appears after 600px of scroll, spring entrance,
 *            pulse ring while idle
 * - "inline" a full button, used in the hero, contact page and enquiry section
 * - "nav"    compact, desktop header only
 *
 * `message` sets the prefill; service pages pass their own so the first line
 * names the service.
 */

type Variant = "float" | "inline" | "nav";

/**
 * `tone` picks the whole colour set rather than layering overrides on top of
 * a light default — two competing text-* utilities in one class string resolve
 * by stylesheet order, not by the order written, so the override silently
 * loses. Swapping the full string keeps dark placements legible.
 */
type Tone = "ink" | "chandni";

type WhatsAppCTAProps = {
  variant: Variant;
  tone?: Tone;
  message?: string;
  label?: string;
  className?: string;
};

const inlineTone: Record<Tone, string> = {
  ink: "border-ink/25 text-ink before:bg-pista hover:text-ink",
  chandni: "border-chandni/40 text-chandni before:bg-chandni hover:text-ink",
};

const navTone: Record<Tone, string> = {
  ink: "border-ink/20 text-ink before:bg-pista",
  chandni: "border-chandni/40 text-chandni before:bg-chandni hover:text-ink",
};

export function WhatsAppCTA({
  variant,
  tone = "ink",
  message = DEFAULT_WHATSAPP_MESSAGE,
  label,
  className,
}: WhatsAppCTAProps) {
  const href = whatsappHref(message);

  if (variant === "float") return <FloatingWhatsApp href={href} className={className} />;

  if (variant === "nav") {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          "sweep-fill inline-flex min-h-[44px] items-center gap-2 rounded-full border px-4 py-2 font-sans text-micro font-semibold tracking-[0.01em] transition-colors duration-[250ms] ease-riwaaya",
          navTone[tone],
          className,
        )}
      >
        <MessageCircle aria-hidden className="h-4 w-4" strokeWidth={1.5} />
        <span>{label ?? "WhatsApp"}</span>
        <span className="sr-only">— opens WhatsApp in a new tab</span>
      </a>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "sweep-fill inline-flex min-h-[56px] items-center justify-center gap-2 rounded-full border px-8 py-4 font-sans text-micro font-semibold uppercase tracking-[0.14em] transition-colors duration-[250ms] ease-riwaaya",
        inlineTone[tone],
        className,
      )}
    >
      <MessageCircle aria-hidden className="h-4 w-4" strokeWidth={1.5} />
      <span>{label ?? "WhatsApp us"}</span>
      <span className="sr-only">
        — message {WHATSAPP_DISPLAY}, opens WhatsApp in a new tab
      </span>
    </a>
  );
}

function FloatingWhatsApp({ href, className }: { href: string; className?: string }) {
  const visible = useScrolledPast(600);
  const shouldReduce = useReducedMotion();

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className={cn("fixed bottom-5 right-5 z-40 md:bottom-8 md:right-8", className)}
          initial={shouldReduce ? { opacity: 0 } : { opacity: 0, scale: 0.6, y: 12 }}
          animate={shouldReduce ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
          exit={shouldReduce ? { opacity: 0 } : { opacity: 0, scale: 0.8 }}
          transition={
            shouldReduce
              ? { duration: 0.2 }
              : { type: "spring", stiffness: 320, damping: 22, mass: 0.7 }
          }
        >
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Message Riwaaya on WhatsApp at ${WHATSAPP_DISPLAY} — opens in a new tab`}
            className="group relative flex h-14 w-14 items-center justify-center rounded-full bg-pista-ink text-chandni shadow-lift transition-transform duration-[250ms] ease-riwaaya hover:scale-105 md:h-16 md:w-16"
          >
            {/* Idle pulse ring. Purely decorative; hidden from assistive tech
                and stopped entirely under reduced motion. */}
            {!shouldReduce && (
              <span
                aria-hidden
                className="absolute inset-0 rounded-full border border-pista-deep animate-pulse-ring"
              />
            )}
            <MessageCircle aria-hidden className="h-6 w-6 md:h-7 md:w-7" strokeWidth={1.5} />
          </a>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export const WHATSAPP_ENTRANCE = { ease: EASE };
