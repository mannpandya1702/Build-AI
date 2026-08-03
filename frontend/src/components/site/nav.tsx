"use client";

import { useEffect, useState } from "react";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { nav, site, BOOKING_URL } from "@/lib/site";
import { EASE } from "@/lib/motion";

export function SiteNav() {
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);

  useMotionValueEvent(scrollY, "change", (y) => {
    setScrolled(y > 24);
  });

  return (
    <motion.header
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: EASE }}
      className="fixed inset-x-0 top-0 z-50"
    >
      <div
        className={`mx-auto flex max-w-[1400px] items-center justify-between gap-4 px-5 transition-all duration-500 sm:px-8 ${
          scrolled ? "py-3" : "py-5"
        }`}
      >
        {/* Wordmark */}
        <a
          href="#top"
          className="group flex items-center gap-2.5"
          aria-label={`${site.name} — home`}
        >
          <span className="relative grid h-8 w-8 place-items-center rounded-lg border border-line-strong bg-panel">
            <span className="h-2 w-2 rounded-full bg-accent shadow-[0_0_12px_2px_var(--color-accent)]" />
          </span>
          <span className="font-display text-lg font-semibold tracking-tight">
            {site.name}
          </span>
        </a>

        {/* Center nav — glassy pill, collapses on mobile */}
        <nav
          aria-label="Primary"
          className={`hidden items-center gap-1 rounded-full border border-line px-1.5 py-1.5 backdrop-blur-xl transition-colors duration-500 md:flex ${
            scrolled ? "bg-panel/70" : "bg-white/[0.02]"
          }`}
        >
          {nav.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="rounded-full px-4 py-1.5 font-mono text-xs uppercase tracking-wider text-muted transition-colors hover:bg-white/[0.05] hover:text-ink"
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* The one thing that must never get buried */}
        <a
          href={BOOKING_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="group inline-flex items-center gap-1.5 rounded-full bg-accent-strong px-4 py-2 text-sm font-semibold text-white shadow-[0_0_24px_-4px_var(--color-accent)] transition-all hover:shadow-[0_0_36px_-2px_var(--color-accent)] sm:px-5"
        >
          <span>Book a call</span>
          <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </a>
      </div>
    </motion.header>
  );
}

/** Slim, persistent bottom CTA bar so the ask is always one tap away on mobile. */
export function StickyBookBar() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 700);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.a
      href={BOOKING_URL}
      target="_blank"
      rel="noopener noreferrer"
      initial={false}
      animate={{ y: show ? 0 : 120, opacity: show ? 1 : 0 }}
      transition={{ duration: 0.4, ease: EASE }}
      style={{ bottom: "max(1rem, env(safe-area-inset-bottom))" }}
      className="fixed inset-x-4 z-50 flex items-center justify-center gap-2 rounded-full bg-accent-strong py-3.5 text-sm font-semibold text-white shadow-[0_10px_40px_-8px_var(--color-accent)] md:hidden"
    >
      Book a call — free 20 min
      <ArrowUpRight className="h-4 w-4" />
    </motion.a>
  );
}
