"use client";

import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { BOOKING_URL, site, nav } from "@/lib/site";
import { EASE } from "@/lib/motion";

export function FooterCta() {
  return (
    <footer id="contact" className="relative overflow-hidden">
      {/* big final beat */}
      <div className="relative mx-auto max-w-[1400px] px-5 pb-16 pt-28 sm:px-8 sm:pt-36">
        <div className="pointer-events-none absolute inset-x-0 top-10 -z-10 mx-auto h-64 max-w-2xl rounded-full bg-accent/20 blur-[120px]" />

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, ease: EASE }}
          className="mx-auto max-w-3xl text-center"
        >
          <p className="mb-5 font-mono text-xs uppercase tracking-[0.2em] text-accent">
            Let&apos;s talk
          </p>
          <h2 className="font-display text-[clamp(2.5rem,6vw,5rem)] font-semibold leading-[0.98] tracking-[-0.03em]">
            One call. One clear next step.
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-lg text-muted">
            Twenty minutes, no deck, no pressure. We&apos;ll tell you the one thing
            worth automating first — even if it isn&apos;t with us.
          </p>

          <a
            href={BOOKING_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="group mt-10 inline-flex items-center gap-2 rounded-full bg-accent px-8 py-4 text-lg font-semibold text-white shadow-[0_0_40px_-6px_var(--color-accent)] transition-all hover:shadow-[0_0_64px_-4px_var(--color-accent)]"
          >
            Book a call
            <ArrowUpRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </a>
        </motion.div>
      </div>

      {/* footer bar */}
      <div className="border-t border-line">
        <div className="mx-auto flex max-w-[1400px] flex-col items-center justify-between gap-6 px-5 py-8 sm:flex-row sm:px-8">
          <div className="flex items-center gap-2.5">
            <span className="grid h-7 w-7 place-items-center rounded-md border border-line-strong bg-panel">
              <span className="h-1.5 w-1.5 rounded-full bg-accent shadow-[0_0_10px_2px_var(--color-accent)]" />
            </span>
            <span className="font-display text-base font-semibold">{site.name}</span>
            <span className="ml-2 hidden text-sm text-muted sm:inline">
              {site.tagline}
            </span>
          </div>

          <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            {nav.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="font-mono text-xs uppercase tracking-wider text-muted transition-colors hover:text-ink"
              >
                {item.label}
              </a>
            ))}
            <a
              href={`mailto:${site.email}`}
              className="font-mono text-xs uppercase tracking-wider text-muted transition-colors hover:text-ink"
            >
              {site.email}
            </a>
          </nav>
        </div>
        <p className="pb-8 text-center font-mono text-[11px] text-muted/60">
          © {2026} {site.name}. One accent, on purpose.
        </p>
      </div>
    </footer>
  );
}
