"use client";

import { motion, useReducedMotion } from "framer-motion";
import { site, telHref } from "../lib/content";

// The one hero moment (CLAUDE.md §5c): a location-specific headline + staggered reveal. Restrained,
// mobile-first, and it never blocks the call button. Reduced motion is respected via framer-motion.
export default function Hero() {
  const reduce = useReducedMotion();
  const href = telHref(site.phone);
  const rise = reduce
    ? { initial: { opacity: 1, y: 0 }, animate: { opacity: 1, y: 0 } }
    : { initial: { opacity: 0, y: 24 }, animate: { opacity: 1, y: 0 } };

  return (
    <header className="relative overflow-hidden bg-gray-950 text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{ background: "radial-gradient(60% 60% at 50% 0%, var(--brand) 0%, transparent 70%)" }}
      />
      <div className="relative mx-auto max-w-3xl px-5 pb-14 pt-10 md:max-w-5xl md:pb-20 md:pt-16">
        <div className="mb-6 flex items-center justify-between">
          <span className="text-sm font-bold uppercase tracking-wide text-white/80">{site.businessName}</span>
          {href && (
            <a
              href={href}
              className="hidden min-h-tap items-center rounded-full bg-brand px-5 font-bold text-brandink md:flex"
            >
              {site.phone}
            </a>
          )}
        </div>

        <motion.h1
          {...rise}
          transition={{ duration: 0.5 }}
          className="text-4xl font-black leading-tight md:text-6xl"
        >
          {site.primaryService} in {site.city}, {site.state}
        </motion.h1>

        <motion.p
          {...rise}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mt-4 max-w-xl text-lg text-white/80"
        >
          Local crew, fast response, and your call answered. {site.reviewCount ? `${site.reviewCount} Google reviews and counting.` : "Roofing done right the first time."}
        </motion.p>

        <motion.div
          {...rise}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-8 flex flex-col gap-3 sm:flex-row"
        >
          {href ? (
            <a
              href={href}
              className="flex min-h-tap items-center justify-center rounded-full bg-brand px-7 text-lg font-bold text-brandink shadow-lg active:scale-95"
            >
              Call {site.phone}
            </a>
          ) : (
            <a href="#quote" className="flex min-h-tap items-center justify-center rounded-full bg-brand px-7 text-lg font-bold text-brandink shadow-lg">
              Get a free quote
            </a>
          )}
          <a
            href="#quote"
            className="flex min-h-tap items-center justify-center rounded-full border border-white/30 px-7 text-lg font-semibold text-white active:scale-95"
          >
            Free quote
          </a>
        </motion.div>

        {site.rating != null && (
          <p className="mt-6 text-sm text-white/70">
            {site.rating.toFixed(1)} stars on Google{site.reviewCount ? ` from ${site.reviewCount} reviews` : ""}.
          </p>
        )}
      </div>
    </header>
  );
}
