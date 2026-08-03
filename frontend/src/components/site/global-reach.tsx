"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { motion, useInView } from "framer-motion";
import { Globe2, Clock, Languages } from "lucide-react";
import { BOOKING_URL } from "@/lib/site";
import { Eyebrow } from "./primitives";
import { EASE } from "@/lib/motion";

// d3 + the map only load once the section nears the viewport.
const RotatingEarth = dynamic(
  () => import("@/components/ui/wireframe-dotted-globe"),
  { ssr: false },
);

const points = [
  { icon: Clock, text: "9am in Sydney is 9am to us — the agent never clocks out." },
  { icon: Languages, text: "Every time zone, and the languages your customers actually speak." },
  { icon: Globe2, text: "One system answering, wherever the call comes from." },
];

export function GlobalReach() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: "200px" });
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    if (inView) setMounted(true);
  }, [inView]);

  return (
    <section
      id="reach"
      className="relative overflow-hidden border-y border-line bg-panel/30"
    >
      {/* violet floor glow tying the globe into the page */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-1/4 mx-auto h-72 max-w-3xl bg-[radial-gradient(50%_60%_at_50%_50%,rgba(123,92,255,0.14),transparent_70%)]"
      />

      <div className="relative mx-auto grid max-w-[1400px] items-center gap-10 px-5 py-24 sm:px-8 lg:grid-cols-2 lg:py-28">
        {/* copy */}
        <div>
          <Eyebrow label="Worldwide" />
          <h2 className="max-w-[16ch] font-display text-[clamp(2rem,4.5vw,3.5rem)] font-semibold leading-[1.02] tracking-[-0.02em]">
            Built for a world that never stops calling.
          </h2>
          <p className="mt-5 max-w-lg text-lg leading-relaxed text-muted">
            Your customers don&apos;t keep your office hours. Maana picks up every
            call, in every time zone — so a lead at 3am on the other side of the
            planet is still a lead you booked by morning.
          </p>

          <div className="mt-6 flex flex-wrap gap-2">
            <span className="rounded-full border border-line bg-canvas/60 px-3 py-1 font-mono text-xs text-muted">
              24/7
            </span>
            <span className="rounded-full border border-line bg-canvas/60 px-3 py-1 font-mono text-xs text-muted">
              every time zone
            </span>
            <span className="rounded-full border border-line bg-canvas/60 px-3 py-1 font-mono text-xs text-muted">
              no hold music
            </span>
          </div>

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
            href={BOOKING_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="group mt-9 inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-6 py-3 text-sm font-semibold text-ink transition-colors hover:bg-accent/20"
          >
            Put us in your time zone
            <span className="font-mono text-xs text-accent">↗</span>
          </a>
        </div>

        {/* globe */}
        <div ref={ref} className="flex min-h-[360px] items-center justify-center">
          {mounted ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.9, ease: EASE }}
              className="w-full"
            >
              <RotatingEarth maxWidth={560} />
            </motion.div>
          ) : (
            <div aria-hidden className="grid h-[420px] w-full place-items-center">
              <div className="h-72 w-72 rounded-full border border-line-strong bg-[radial-gradient(circle_at_35%_30%,#181824,#0b0b10)]" />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
