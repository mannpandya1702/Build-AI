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

// Stats now live inside the hero as a glass strip (see Hero.tsx): trust joins the first
// impression instead of sitting as a thin light sliver between two dark bands.

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

/**
 * The niche-need band (CLAUDE.md §5a/§5b): the Dallas storm/insurance moment. Flag-gated.
 * An inset floating card in a warm near-black (a storm material, distinct from the hero's slate),
 * framed by paper on all sides so there is no dark-on-dark seam (section rhythm, §5b-bis).
 */
export function StormBand() {
  if (!site.stormBand) return null;
  const href = telHref(site.phone);
  return (
    <section aria-label="Storm damage" className="px-4 pt-14 md:px-6 md:pt-20">
      <Reveal className="mx-auto max-w-6xl">
        <div
          className="texture-shingle relative overflow-hidden rounded-3xl text-white ring-1 ring-white/10"
          style={{
            background:
              "radial-gradient(110% 130% at 90% -10%, rgb(var(--brand) / 0.5) 0%, transparent 55%), linear-gradient(150deg, rgb(26 14 9) 0%, rgb(15 9 6) 100%)",
          }}
        >
          <div className="px-6 py-12 md:px-14 md:py-16">
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
                  className="inline-flex min-h-tap items-center justify-center rounded-full bg-brand px-8 py-3 font-display text-lg font-extrabold text-brandink shadow-cta transition-transform hover:-translate-y-0.5 active:scale-95"
                >
                  Get an inspection first
                </a>
              ) : (
                <a
                  href="#quote"
                  className="inline-flex min-h-tap items-center justify-center rounded-full bg-brand px-8 py-3 font-display text-lg font-extrabold text-brandink shadow-cta"
                >
                  Get an inspection first
                </a>
              )}
            </div>
          </div>
        </div>
      </Reveal>
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
    <section className="bg-paper2 py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-5">
        <SectionTitle kicker="How it works" title="Three steps. That's it." />
        <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-3">
          {steps.map((s, i) => (
            <Reveal key={s.t} delay={i * 0.08} className="relative rounded-2xl bg-white p-6 shadow-card ring-1 ring-ink/5">
              <span className="font-display text-5xl font-extrabold leading-none text-brand/25">{i + 1}</span>
              <h3 className="mt-3 font-display text-2xl font-extrabold text-ink">{s.t}</h3>
              <p className="mt-2 text-ink/70">{s.d}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/**
 * With fewer than 3 real photos, the gallery becomes an honestly-labeled preview: designed
 * placeholder tiles that pitch the OWNER on sending their job photos. Never stock, never fake
 * (CLAUDE.md §0.1, §5b): the owner knows their own work on sight, and fake photos kill the pitch.
 */
function GalleryPreview() {
  return (
    <section id="work" className="bg-paper2 py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-5">
        <SectionTitle kicker="Recent work" title={`Your jobs, front and center`} />
        <p className="mt-4 max-w-xl text-ink/70">
          This section fills with real photos of your work: before-and-afters, finished roofs, the
          crew on site. Send them over and they are live the same day.
        </p>
        <div className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Reveal
              key={i}
              delay={i * 0.04}
              className="texture-shingle relative flex aspect-square items-center justify-center rounded-xl bg-gradient-to-br from-ink/[0.07] to-ink/[0.16] ring-1 ring-ink/10"
            >
              <span aria-hidden className="font-display text-3xl font-extrabold text-ink/20">+</span>
              <span className="absolute bottom-3 left-3 text-xs font-semibold uppercase tracking-wide text-ink/40">
                Your photo
              </span>
            </Reveal>
          ))}
        </div>
        <p className="mt-4 text-sm text-ink/50">Real job photos only. No stock, ever.</p>
      </div>
    </section>
  );
}

export function Gallery() {
  // Fewer than 3 real photos: show the honestly-labeled preview instead of padding or faking.
  if (site.photos.length < 3) return <GalleryPreview />;
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

function ReviewCard({ r, fixed = true }: { r: (typeof site.reviews)[number]; fixed?: boolean }) {
  // Uniform card size: fixed height + line-clamp so a long review never stretches its card and
  // makes neighbors look empty. The clamp is visible truncation, not a rewrite.
  return (
    <figure
      className={`relative flex ${fixed ? "h-[280px] w-[320px] md:w-[380px]" : "min-h-[240px] w-full"} shrink-0 flex-col rounded-2xl bg-white p-6 pt-8 shadow-card ring-1 ring-ink/5`}
    >
      <span aria-hidden className="absolute right-5 top-2 font-display text-6xl font-extrabold leading-none text-brand/10">
        &rdquo;
      </span>
      <p className="text-amber-500" aria-label={`${r.rating} out of 5 stars`}>
        {"★".repeat(Math.round(r.rating))}
      </p>
      <blockquote className="mt-3 line-clamp-6 text-ink/80">&ldquo;{r.text}&rdquo;</blockquote>
      <figcaption className="mt-auto pt-4 font-display font-extrabold text-ink">{r.author}</figcaption>
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
            <ReviewCard key={i} r={r} fixed={false} />
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
