"use client";

import { motion, useReducedMotion } from "framer-motion";
import { site, telHref, mapEmbedUrl } from "../lib/content";

// A single scroll-reveal wrapper reused across sections. Respects reduced motion.
function Reveal({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-70px" }}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function SectionTitle({ kicker, title }: { kicker: string; title: string }) {
  return (
    <Reveal>
      <p className="font-display text-sm font-medium uppercase tracking-[0.2em] text-brand">{kicker}</p>
      <h2 className="mt-2 font-display text-4xl font-extrabold tracking-tight text-ink md:text-5xl">{title}</h2>
    </Reveal>
  );
}

/** Stats strip: real numbers only, straight from the GBP (CLAUDE.md §5b). Omits what it lacks. */
export function StatsStrip() {
  const stats: { value: string; label: string }[] = [];
  if (site.rating != null) stats.push({ value: site.rating.toFixed(1), label: "Google rating" });
  if (site.reviewCount != null) stats.push({ value: String(site.reviewCount), label: "Google reviews" });
  stats.push({ value: site.city, label: "Local & nearby" });
  if (stats.length < 2) return null;
  return (
    <section aria-label="Highlights" className="border-y border-ink/10 bg-paper2">
      <div className="mx-auto grid max-w-6xl grid-cols-3 divide-x divide-ink/10 px-2 py-6 md:py-8">
        {stats.slice(0, 3).map((s, i) => (
          <Reveal key={s.label} delay={i * 0.06} className="px-3 text-center">
            <p className="font-display text-3xl font-extrabold text-ink md:text-4xl">{s.value}</p>
            <p className="mt-1 text-sm font-semibold uppercase tracking-wide text-ink/60">{s.label}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

export function Services() {
  return (
    <section id="services" className="mx-auto max-w-6xl px-5 py-20 md:py-28">
      <SectionTitle kicker="What we do" title="Roof work, done right" />
      <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {site.services.map((s, i) => (
          <Reveal
            key={s.name}
            delay={i * 0.05}
            className="group rounded-2xl bg-white p-6 shadow-card ring-1 ring-ink/5 transition-all hover:-translate-y-0.5 hover:shadow-cardhover"
          >
            <span className="font-display text-sm font-extrabold text-ink/30">{String(i + 1).padStart(2, "0")}</span>
            <h3 className="mt-1 font-display text-xl font-extrabold text-ink">{s.name}</h3>
            <p className="mt-2 text-ink/70">{s.blurb}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/** The niche-need band (CLAUDE.md §5a/§5b): the Dallas storm/insurance moment. Flag-gated. */
export function StormBand() {
  if (!site.stormBand) return null;
  const href = telHref(site.phone);
  return (
    <section aria-label="Storm damage" className="bg-ink text-white">
      <div className="texture-shingle">
        <div className="mx-auto max-w-6xl px-5 py-20 md:py-24">
          <Reveal>
            <p className="font-display text-sm font-medium uppercase tracking-[0.2em] text-amber-400">
              After the storm
            </p>
            <h2 className="mt-2 max-w-2xl font-display text-3xl font-extrabold tracking-tight md:text-5xl">
              Hail or wind damage in {site.city}? Get it documented before you call your insurance.
            </h2>
            <p className="mt-4 max-w-xl text-white/80">
              A proper inspection with photos is the difference between a smooth claim and a fight.
              Start with the roof, not the paperwork.
            </p>
            <div className="mt-7">
              {href ? (
                <a
                  href={href}
                  className="inline-flex min-h-tap items-center justify-center rounded-full bg-brand px-8 py-3 font-display text-lg font-extrabold text-brandink shadow-lg active:scale-95"
                >
                  Get an inspection first
                </a>
              ) : (
                <a
                  href="#quote"
                  className="inline-flex min-h-tap items-center justify-center rounded-full bg-brand px-8 py-3 font-display text-lg font-extrabold text-brandink shadow-lg"
                >
                  Get an inspection first
                </a>
              )}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/** Three steps, not five: kills the "what happens if I call" hesitation (CLAUDE.md §5b). */
export function Process() {
  const steps = [
    { t: "Look", d: `We inspect the roof and show you photos of exactly what we find.` },
    { t: "Quote", d: "One clear number. No surprise line items, no pressure." },
    { t: "Done", d: "The work, finished and cleaned up. You see it before we leave." },
  ];
  return (
    <section className="mx-auto max-w-6xl px-5 py-20 md:py-28">
      <SectionTitle kicker="How it works" title="Three steps. That's it." />
      <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-3">
        {steps.map((s, i) => (
          <Reveal key={s.t} delay={i * 0.08} className="relative rounded-2xl bg-paper2 p-6">
            <span className="font-display text-5xl font-extrabold leading-none text-brand/25">{i + 1}</span>
            <h3 className="mt-3 font-display text-2xl font-extrabold text-ink">{s.t}</h3>
            <p className="mt-2 text-ink/70">{s.d}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

export function Gallery() {
  const hasPhotos = site.photos.length > 0;
  if (!hasPhotos) return null; // no photos: omit rather than fake it (CLAUDE.md §0)
  return (
    <section id="work" className="bg-paper2 py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-5">
        <SectionTitle kicker="Recent work" title={`On roofs around ${site.city}`} />
        <div className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-3">
          {site.photos.map((p, i) => (
            <Reveal key={p.src} delay={i * 0.04} className="overflow-hidden rounded-xl">
              {/* Real GBP photo. loading=lazy keeps the mobile speed budget (CLAUDE.md §5b). */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.src}
                alt={p.alt}
                loading="lazy"
                className="aspect-square w-full object-cover transition-transform duration-500 hover:scale-105"
              />
            </Reveal>
          ))}
        </div>
        <p className="mt-4 text-sm text-ink/50">Photos from our Google Business Profile.</p>
      </div>
    </section>
  );
}

function ReviewCard({ r }: { r: (typeof site.reviews)[number] }) {
  return (
    <figure className="relative w-[320px] shrink-0 rounded-2xl bg-white p-6 pt-8 shadow-card ring-1 ring-ink/5 md:w-[380px]">
      <span aria-hidden className="absolute right-5 top-2 font-display text-6xl font-extrabold leading-none text-brand/10">
        &rdquo;
      </span>
      <p className="text-amber-500" aria-label={`${r.rating} out of 5 stars`}>
        {"★".repeat(Math.round(r.rating))}
      </p>
      <blockquote className="mt-3 text-ink/80">&ldquo;{r.text}&rdquo;</blockquote>
      <figcaption className="mt-4 font-display font-extrabold text-ink">{r.author}</figcaption>
    </figure>
  );
}

/**
 * Reviews as a slow horizontal marquee: the list rendered twice inside a CSS-animated track
 * (translateX -50% loops seamlessly), pause on hover/focus, duplicate copy aria-hidden. Under
 * prefers-reduced-motion it falls back to a static grid, per WCAG and CLAUDE.md §5c.
 */
export function Reviews() {
  const reduce = useReducedMotion();
  if (site.reviews.length === 0) return null; // omit rather than invent (CLAUDE.md §0)

  return (
    <section id="reviews" className="overflow-hidden py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-5">
        <SectionTitle kicker="Real reviews" title={`What ${site.city} says`} />
      </div>

      {reduce ? (
        <div className="mx-auto mt-10 grid max-w-6xl grid-cols-1 gap-4 px-5 md:grid-cols-2">
          {site.reviews.map((r, i) => (
            <ReviewCard key={i} r={r} />
          ))}
        </div>
      ) : (
        <div className="marquee relative mt-10">
          {/* Edge fades so cards drift in and out instead of getting clipped. */}
          <div aria-hidden className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-paper to-transparent" />
          <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-paper to-transparent" />
          {/* Two identical groups: translateX(-50%) shifts exactly one group width = seamless loop. */}
          <div className="marquee-track flex w-max pb-2">
            <div className="flex gap-4 pr-4">
              {site.reviews.map((r, i) => (
                <ReviewCard key={`a-${i}`} r={r} />
              ))}
            </div>
            <div aria-hidden className="flex gap-4 pr-4">
              {site.reviews.map((r, i) => (
                <ReviewCard key={`b-${i}`} r={r} />
              ))}
            </div>
          </div>
        </div>
      )}

      <p className="mx-auto mt-5 max-w-6xl px-5 text-sm text-ink/50">Pulled from real Google reviews. Hover to pause.</p>
    </section>
  );
}

/** FAQ, fact-safe: answers built only from known data (CLAUDE.md §5b). */
export function Faq() {
  if (site.faq.length === 0) return null;
  return (
    <section className="bg-paper2 py-20 md:py-28">
      <div className="mx-auto max-w-3xl px-5">
        <SectionTitle kicker="Questions" title="Before you call" />
        <div className="mt-8 divide-y divide-ink/10">
          {site.faq.map((f) => (
            <Reveal key={f.q} className="py-5">
              <h3 className="font-display text-lg font-extrabold text-ink">{f.q}</h3>
              <p className="mt-2 text-ink/70">{f.a}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Contact() {
  return (
    <section id="contact" className="mx-auto max-w-6xl px-5 py-20 md:py-28">
      <SectionTitle kicker="Find us" title={`${site.city}, ${site.state}`} />
      <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="space-y-2 text-ink/80">
          <p className="font-display text-xl font-extrabold text-ink">{site.businessName}</p>
          {site.address && <p>{site.address}</p>}
          {site.phone && (
            <p>
              Phone: <span className="font-bold text-ink">{site.phone}</span>
            </p>
          )}
          <p>Serving {site.city} and nearby.</p>
        </div>
        <div className="overflow-hidden rounded-2xl border border-ink/10">
          <iframe
            title={`Map of ${site.businessName}`}
            src={mapEmbedUrl(site.mapQuery)}
            loading="lazy"
            className="h-64 w-full"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </div>
    </section>
  );
}
