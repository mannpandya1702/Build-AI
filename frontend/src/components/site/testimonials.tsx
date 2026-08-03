"use client";

import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";
import { testimonials, trust, type Testimonial } from "@/lib/site";
import { SectionHeading } from "./service-cards";
import { EASE } from "@/lib/motion";

function Stars({ n }: { n: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${n} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={i < n ? "fill-accent text-accent" : "text-line-strong"}
          style={{ width: 15, height: 15 }}
        />
      ))}
    </div>
  );
}

function initials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("");
}

function Card({ t, i }: { t: Testimonial; i: number }) {
  return (
    <motion.figure
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, delay: (i % 3) * 0.08, ease: EASE }}
      className="mb-4 flex break-inside-avoid flex-col gap-5 rounded-[var(--radius-card)] border border-line bg-panel/50 p-6 transition-colors hover:border-line-strong sm:p-7"
    >
      <div className="flex items-center justify-between">
        <Stars n={t.rating} />
        <Quote className="h-5 w-5 text-accent/40" />
      </div>

      <blockquote className="text-[15px] leading-relaxed text-ink/90">
        “{t.quote}”
      </blockquote>

      <div className="mt-auto flex items-center gap-3 border-t border-line pt-5">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-line-strong bg-canvas font-mono text-xs text-accent">
          {initials(t.name)}
        </span>
        <figcaption className="min-w-0">
          <div className="truncate text-sm font-semibold text-ink">{t.name}</div>
          <div className="truncate font-mono text-[11px] text-muted">
            {t.role} · {t.company}
          </div>
        </figcaption>
      </div>

      <div className="inline-flex w-fit items-center gap-2 rounded-full border border-accent/25 bg-accent/10 px-3 py-1 font-mono text-[11px] text-accent-soft">
        <span className="h-1 w-1 rounded-full bg-accent" />
        {t.metric}
      </div>
    </motion.figure>
  );
}

export function Testimonials() {
  return (
    <section id="reviews" className="relative mx-auto max-w-[1400px] px-5 py-28 sm:px-8 sm:py-36">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <SectionHeading
          eyebrow="Reviews"
          title="Quiet work. Loud results."
          blurb="The metric matters more than the adjective, so every review comes with a number."
        />

        {/* aggregate rating badge */}
        <div className="flex items-center gap-4 rounded-2xl border border-line bg-panel/50 px-5 py-4">
          <div className="font-display text-4xl font-semibold tabular-nums text-ink">
            {trust.rating}
          </div>
          <div>
            <Stars n={5} />
            <div className="mt-1 font-mono text-[11px] text-muted">
              {trust.ratingCount} reviews · {trust.clientCount} {trust.blurb}
            </div>
          </div>
        </div>
      </div>

      {/* masonry-ish via CSS columns so cards of different heights pack nicely */}
      <div className="mt-14 gap-4 [column-fill:_balance] sm:columns-2 lg:columns-3">
        {testimonials.map((t, i) => (
          <Card key={t.name} t={t} i={i} />
        ))}
      </div>
    </section>
  );
}
