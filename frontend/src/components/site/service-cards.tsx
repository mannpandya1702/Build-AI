"use client";

import { useState } from "react";
import {
  motion,
  AnimatePresence,
  LayoutGroup,
  type Variants,
} from "framer-motion";
import { Plus, ArrowUpRight } from "lucide-react";
import { services, type Service, BOOKING_URL } from "@/lib/site";
import { EASE } from "@/lib/motion";

export function ServiceCards() {
  const [active, setActive] = useState<string | null>("voice");

  return (
    <section id="services" className="relative mx-auto max-w-[1400px] px-5 py-28 sm:px-8 sm:py-36">
      <SectionHeading
        eyebrow="What we build"
        title="Four ways to put AI to work."
        blurb="Collapsed is the pitch. Open one to see what's inside. Everything is custom-scoped — no templates, no seat math."
      />

      <LayoutGroup>
        <div className="mt-14 grid grid-cols-1 gap-4 md:grid-cols-2">
          {services.map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
              isActive={active === service.id}
              onToggle={() =>
                setActive((cur) => (cur === service.id ? null : service.id))
              }
            />
          ))}
        </div>
      </LayoutGroup>
    </section>
  );
}

const contentVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.05 },
  },
};
const itemVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: EASE } },
};

function ServiceCard({
  service,
  isActive,
  onToggle,
}: {
  service: Service;
  isActive: boolean;
  onToggle: () => void;
}) {
  const Icon = service.icon;

  return (
    <motion.div
      layout
      onClick={onToggle}
      transition={{ layout: { duration: 0.5, ease: EASE } }}
      className={`group relative cursor-pointer overflow-hidden rounded-[var(--radius-card)] border p-6 transition-colors sm:p-8 ${
        isActive
          ? "border-accent/40 bg-panel md:col-span-2"
          : "border-line bg-panel/50 hover:border-line-strong hover:bg-panel"
      }`}
    >
      {/* accent wash only when open — keeps the one saturated color intentional */}
      <AnimatePresence>
        {isActive && (
          <motion.div
            key="wash"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(80%_120%_at_0%_0%,rgba(123,92,255,0.12),transparent_55%)]"
          />
        )}
      </AnimatePresence>

      <motion.div layout="position" className="relative flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-line-strong bg-canvas text-accent">
            <Icon className="h-5 w-5" strokeWidth={1.75} />
          </span>
          <div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs text-muted">{service.index}</span>
              <h3 className="font-display text-xl font-semibold sm:text-2xl">
                {service.name}
              </h3>
            </div>
            <p className="mt-1.5 max-w-md text-sm text-muted sm:text-base">
              {service.oneLiner}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-3">
          <span className="hidden font-mono text-[11px] uppercase tracking-wider text-muted sm:block">
            {service.anchor}
          </span>
          <span
            className={`grid h-8 w-8 place-items-center rounded-full border transition-all duration-500 ${
              isActive
                ? "rotate-45 border-accent/50 bg-accent/10 text-accent"
                : "border-line-strong text-muted group-hover:text-ink"
            }`}
          >
            <Plus className="h-4 w-4" />
          </span>
        </div>
      </motion.div>

      <AnimatePresence initial={false}>
        {isActive && (
          <motion.div
            key="body"
            layout
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.5, ease: EASE }}
            className="relative overflow-hidden"
          >
            <motion.div
              variants={contentVariants}
              initial="hidden"
              animate="show"
              className="mt-7 grid gap-8 border-t border-line pt-7 md:grid-cols-[1.4fr_1fr]"
            >
              <ul className="grid gap-3 sm:grid-cols-2">
                {service.features.map((f) => (
                  <motion.li
                    key={f}
                    variants={itemVariants}
                    className="flex items-start gap-2.5 text-sm text-ink/90"
                  >
                    <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-accent" />
                    {f}
                  </motion.li>
                ))}
              </ul>

              <motion.div
                variants={itemVariants}
                className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-line bg-canvas/60 p-5"
              >
                <p className="text-sm text-muted">
                  Scoped to your stack and volume. We'll size it on the call.
                </p>
                <a
                  href={BOOKING_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="group/cta inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-all hover:shadow-[0_0_28px_-6px_var(--color-accent)]"
                >
                  {service.cta}
                  <ArrowUpRight className="h-4 w-4 transition-transform group-hover/cta:translate-x-0.5 group-hover/cta:-translate-y-0.5" />
                </a>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  blurb,
}: {
  eyebrow: string;
  title: string;
  blurb?: string;
}) {
  return (
    <div className="max-w-2xl">
      <p className="mb-4 flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] text-accent">
        <span className="h-px w-8 bg-accent/50" />
        {eyebrow}
      </p>
      <h2 className="font-display text-[clamp(2rem,4.5vw,3.5rem)] font-semibold leading-[1.02] tracking-[-0.02em]">
        {title}
      </h2>
      {blurb && <p className="mt-5 text-lg leading-relaxed text-muted">{blurb}</p>}
    </div>
  );
}
