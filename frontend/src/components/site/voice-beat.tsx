"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { Phone, Calendar, PhoneForwarded } from "lucide-react";
import { BOOKING_URL, calAttrs } from "@/lib/site";
import { Eyebrow } from "./primitives";

/* The Three.js scene is only ever loaded in the browser, and only after the
   section nears the viewport (gated by useInView below). */
const RobotScene = dynamic(() => import("./robot-scene"), { ssr: false });

const points = [
  { icon: Phone, text: "Answers on the first ring, in a voice that sounds like your team." },
  { icon: Calendar, text: "Books, reschedules, and qualifies straight into your calendar." },
  { icon: PhoneForwarded, text: "Hands off to a human the moment the call needs one." },
];

export function VoiceBeat() {
  const ref = useRef<HTMLDivElement>(null);
  // live (two-directional) so we can pause the render loop when off-screen
  const inView = useInView(ref, { margin: "300px" });
  const reduced = useReducedMotion();

  // latch: once mounted, keep the scene mounted for the session
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    if (inView) setMounted(true);
  }, [inView]);

  // Reduced-motion users never pay the WebGL cost — they get the static stand-in.
  const showRobot = mounted && !reduced;

  return (
    <section
      id="voice"
      className="relative overflow-hidden border-y border-line bg-panel/40"
    >
      {/* subtle violet floor glow anchoring the character */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-[radial-gradient(60%_80%_at_50%_100%,rgba(123,92,255,0.16),transparent_70%)]"
      />

      <div className="relative mx-auto grid max-w-[1400px] items-center gap-8 px-5 py-24 sm:px-8 lg:grid-cols-2 lg:py-28">
        {/* copy */}
        <div className="order-2 lg:order-1">
          <Eyebrow label="03 — Voice" />
          <h2 className="max-w-[18ch] font-display text-[clamp(2rem,4.5vw,3.5rem)] font-semibold leading-[1.02] tracking-[-0.02em]">
            Meet the AI that answers your calls.
          </h2>
          <p className="mt-5 max-w-lg text-lg leading-relaxed text-muted">
            No hold music, no missed leads. A voice agent that talks like a person,
            works around the clock, and never forgets to write it down.
          </p>

          <ul className="mt-8 grid max-w-lg gap-4">
            {points.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-3">
                <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-line-strong bg-canvas text-accent">
                  <Icon className="h-4 w-4" strokeWidth={1.75} />
                </span>
                <span className="text-sm text-ink/90 sm:text-base">{text}</span>
              </li>
            ))}
          </ul>

          <a
            href={BOOKING_URL} {...calAttrs}
            target="_blank"
            rel="noopener noreferrer"
            className="group mt-9 inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-6 py-3 text-sm font-semibold text-ink transition-colors hover:bg-accent/20"
          >
            Hear it on a live call
            <span className="font-mono text-xs text-accent">↗</span>
          </a>
        </div>

        {/* the one 3D beat — decorative */}
        <div
          ref={ref}
          aria-hidden
          className="order-1 h-[380px] w-full sm:h-[460px] lg:order-2 lg:h-[560px]"
        >
          {showRobot ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8 }}
              className="h-full w-full"
            >
              {/* pause the render loop entirely while scrolled off-screen */}
              <RobotScene active={inView} />
            </motion.div>
          ) : (
            <RobotFallback />
          )}
        </div>
      </div>
    </section>
  );
}

/* Static stand-in shown before mount and under reduced-motion preferences. */
function RobotFallback() {
  return (
    <div className="grid h-full w-full place-items-center">
      <div className="relative">
        <div className="absolute inset-0 -z-10 rounded-full bg-accent/20 blur-3xl" />
        <div className="grid h-40 w-40 place-items-center rounded-full border border-line-strong bg-panel">
          <div className="grid h-24 w-24 place-items-center rounded-full bg-canvas">
            <div className="flex gap-2">
              <span className="h-6 w-1.5 rounded-full bg-accent shadow-[0_0_10px_var(--color-accent)]" />
              <span className="h-6 w-1.5 rounded-full bg-accent shadow-[0_0_10px_var(--color-accent)]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
