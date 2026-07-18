"use client";

import { motion } from "framer-motion";
import { ArrowUpRight, ArrowDown } from "lucide-react";
import { GradientMesh } from "./gradient-mesh";
import { useCursorGlow } from "@/hooks/use-cursor-glow";
import { BOOKING_URL, metrics } from "@/lib/site";
import { EASE } from "@/lib/motion";

const rise = {
  hidden: { opacity: 0, y: 20 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, delay: 0.15 + i * 0.08, ease: EASE },
  }),
};

export function Hero() {
  const { containerRef, glowRef } = useCursorGlow<HTMLElement>();

  return (
    <section
      ref={containerRef}
      id="top"
      className="relative isolate flex min-h-dvh flex-col justify-center overflow-hidden"
    >
      {/* instant, GPU-cheap background */}
      <GradientMesh />

      {/* faint grid — mostly invisible until the cursor glow lights it */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.5]"
        style={{
          backgroundImage:
            "linear-gradient(to right, var(--color-line) 1px, transparent 1px), linear-gradient(to bottom, var(--color-line) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
          maskImage:
            "radial-gradient(120% 80% at 50% 40%, black, transparent 75%)",
          WebkitMaskImage:
            "radial-gradient(120% 80% at 50% 40%, black, transparent 75%)",
        }}
      />

      {/* cursor glow — single radial element, rAF-driven, additive light */}
      <div
        ref={glowRef}
        aria-hidden
        className="pointer-events-none absolute left-0 top-0 -ml-[350px] -mt-[350px] h-[700px] w-[700px] opacity-0 transition-opacity duration-500"
        style={{
          background:
            "radial-gradient(circle, rgba(123,92,255,0.22) 0%, rgba(123,92,255,0.07) 32%, transparent 62%)",
          mixBlendMode: "screen",
        }}
      />

      {/* content */}
      <div className="relative z-10 mx-auto w-full max-w-[1400px] px-5 pt-28 sm:px-8">
        <motion.p
          custom={0}
          variants={rise}
          initial="hidden"
          animate="show"
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-line bg-white/[0.02] px-3 py-1.5 font-mono text-xs uppercase tracking-[0.2em] text-muted"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-accent shadow-[0_0_10px_2px_var(--color-accent)]" />
          Maana — AI agency
        </motion.p>

        <motion.h1
          custom={1}
          variants={rise}
          initial="hidden"
          animate="show"
          className="max-w-[16ch] font-display text-[clamp(2.75rem,7vw,6.25rem)] font-semibold leading-[0.95] tracking-[-0.03em]"
        >
          The AI layer for teams who'd rather{" "}
          <span className="text-accent">ship</span> than shout.
        </motion.h1>

        <motion.p
          custom={2}
          variants={rise}
          initial="hidden"
          animate="show"
          className="mt-7 max-w-[52ch] text-lg leading-relaxed text-muted sm:text-xl"
        >
          We design and build websites, chatbots, voice agents, and automations —
          with the restraint of good engineering and none of the noise.
        </motion.p>

        <motion.div
          custom={3}
          variants={rise}
          initial="hidden"
          animate="show"
          className="mt-10 flex flex-wrap items-center gap-3"
        >
          <a
            href={BOOKING_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3.5 text-base font-semibold text-white shadow-[0_0_32px_-6px_var(--color-accent)] transition-all hover:shadow-[0_0_48px_-4px_var(--color-accent)]"
          >
            Book a call
            <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </a>
          <a
            href="#services"
            className="inline-flex items-center gap-2 rounded-full border border-line-strong px-6 py-3.5 text-base font-medium text-ink transition-colors hover:bg-white/[0.03]"
          >
            See what we build
            <ArrowDown className="h-4 w-4" />
          </a>
        </motion.div>

        {/* metrics — mono, quiet, factual */}
        <motion.dl
          custom={4}
          variants={rise}
          initial="hidden"
          animate="show"
          className="mt-20 grid max-w-3xl grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-4"
        >
          {metrics.map((m) => (
            <div key={m.label} className="bg-canvas px-5 py-6">
              <dt className="font-display text-2xl font-semibold text-ink">
                {m.value}
              </dt>
              <dd className="mt-1 font-mono text-[11px] uppercase leading-snug tracking-wider text-muted">
                {m.label}
              </dd>
            </div>
          ))}
        </motion.dl>
      </div>
    </section>
  );
}
