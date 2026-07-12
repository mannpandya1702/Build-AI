"use client";

import { motion } from "framer-motion";
import { useReducedMotionSafe, ImageReveal } from "./Motion";
import FaqAccordion from "./FaqAccordion";
import { site, telHref, mapEmbedUrl } from "../lib/content";

// A single scroll-reveal wrapper reused across sections. Respects reduced motion.
function Reveal({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const reduce = useReducedMotionSafe();
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

// Editorial title: a giant ghost numeral sits behind each section heading — the oversized-index
// rhythm of expensive editorial sites, in pure type (no assets).
function SectionTitle({ kicker, title, index }: { kicker: string; title: string; index?: string }) {
  return (
    <Reveal className="relative">
      {index && (
        <span
          aria-hidden
          className="pointer-events-none absolute -left-3 -top-14 select-none font-display text-[8rem] font-extrabold leading-none text-ink/[0.05] md:-top-20 md:text-[12rem]"
        >
          {index}
        </span>
      )}
      <p className="relative font-display text-sm font-semibold uppercase tracking-[0.22em] text-brand">{kicker}</p>
      <h2 className="relative mt-2 font-display text-4xl font-extrabold tracking-tight text-ink md:text-6xl">{title}</h2>
    </Reveal>
  );
}

// Stats now live inside the hero as a glass strip (see Hero.tsx): trust joins the first
// impression instead of sitting as a thin light sliver between two dark bands.

/**
 * Services as a bento, not a uniform grid (§5b-bis bans the "N identical cards" slop): the first
 * service is the featured panel (brand-tinted, larger type, its own quote link), the rest are
 * compact cards with a brand hairline. Asymmetry reads designed; sameness reads generated.
 */
export function Services() {
  if (!site.services.length) return null;
  return (
    <section
      id="services"
      className="relative py-20 md:py-28"
      style={{ background: "radial-gradient(70% 50% at 0% 0%, rgb(var(--brand) / 0.06) 0%, transparent 55%)" }}
    >
      <div className="mx-auto max-w-6xl px-5">
        <SectionTitle index="01" kicker="What we do" title="Roof work, done right" />
        <div className="mt-12 border-t border-ink/10">
          {site.services.map((s, i) => (
            <Reveal key={s.name} delay={i * 0.04}>
              <a
                href="#quote"
                className="group grid grid-cols-[auto_1fr] items-baseline gap-x-5 gap-y-2 border-b border-ink/10 py-7 transition-colors duration-200 hover:bg-brand/[0.04] md:grid-cols-[4rem_1.1fr_1fr_auto] md:items-center md:gap-x-8 md:py-9"
              >
                <span className="font-display text-sm font-extrabold tracking-wide text-brand/60 transition-colors duration-200 group-hover:text-brand">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="font-display text-2xl font-extrabold tracking-tight text-ink transition-transform duration-200 group-hover:translate-x-1 md:text-4xl">
                  {s.name}
                </h3>
                <p className="col-start-2 max-w-md text-ink/60 md:col-start-3">{s.blurb}</p>
                <span
                  aria-hidden
                  className="hidden font-display text-2xl font-extrabold text-ink/20 transition-all duration-200 group-hover:translate-x-1 group-hover:text-brand md:block"
                >
                  →
                </span>
              </a>
            </Reveal>
          ))}
        </div>
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
            // per-look storm dark: the lead's ink warmed by its own brand (a DIFFERENT dark than
            // the hero's, per §5b-bis section rhythm), falling to near-black
            background:
              "linear-gradient(150deg, color-mix(in srgb, rgb(var(--ink)) 72%, rgb(var(--brand)) 28%) 0%, color-mix(in srgb, rgb(var(--ink)) 55%, rgb(8 6 5) 45%) 100%)",
          }}
        >
          {/* storm glow, alive (§5c atmosphere) */}
          <div
            aria-hidden
            className="glow-drift absolute -right-1/4 -top-1/2 h-[160%] w-[80%]"
            style={{ background: "radial-gradient(closest-side, rgb(var(--brand) / 0.5) 0%, transparent 70%)" }}
          />
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
                  className="inline-flex min-h-tap items-center justify-center rounded-full bg-gradient-to-b from-brand to-branddeep px-8 py-3 font-display text-lg font-extrabold text-brandink shadow-cta transition-transform hover:-translate-y-0.5 active:scale-95"
                >
                  Get an inspection first
                </a>
              ) : (
                <a
                  href="#quote"
                  className="inline-flex min-h-tap items-center justify-center rounded-full bg-gradient-to-b from-brand to-branddeep px-8 py-3 font-display text-lg font-extrabold text-brandink shadow-cta"
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
    <section className="texture-shingle-ink bg-paper2 py-20 md:py-32">
      <div className="mx-auto max-w-6xl px-5">
        <SectionTitle index="02" kicker="How it works" title="Three steps. That's it." />
        <div className="mt-14 grid grid-cols-1 gap-12 md:grid-cols-3 md:gap-8">
          {steps.map((s, i) => (
            <Reveal key={s.t} delay={i * 0.08} className="relative border-t-2 border-brand/25 pt-6">
              <span aria-hidden className="absolute -top-9 right-0 font-display text-7xl font-extrabold leading-none text-brand/10 md:text-8xl">
                {i + 1}
              </span>
              <h3 className="font-display text-2xl font-extrabold tracking-tight text-ink md:text-3xl">{s.t}</h3>
              <p className="mt-3 max-w-xs text-lg text-ink/60">{s.d}</p>
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
        <SectionTitle index="03" kicker="Recent work" title={`Your jobs, front and center`} />
        <p className="mt-4 max-w-xl text-ink/70">
          This section fills with real photos of your work: before-and-afters, finished roofs, the
          crew on site. Send them over and they are live the same day.
        </p>
        <div className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Reveal
              key={i}
              delay={i * 0.04}
              className={`texture-shingle-ink relative flex aspect-square items-center justify-center rounded-2xl border-2 border-dashed transition-colors duration-200 ${
                i % 2
                  ? "border-ink/15 bg-gradient-to-br from-ink/[0.04] to-ink/[0.1] hover:border-ink/30"
                  : "border-brand/25 bg-gradient-to-br from-brand/[0.05] to-brand/[0.12] hover:border-brand/45"
              }`}
            >
              <span aria-hidden className={`font-display text-4xl font-extrabold ${i % 2 ? "text-ink/25" : "text-brand/35"}`}>+</span>
              <span className="absolute bottom-3 left-3 text-xs font-bold uppercase tracking-wide text-ink/50">
                Your photo
              </span>
            </Reveal>
          ))}
          <Reveal delay={0.2} className="relative flex aspect-square flex-col items-center justify-center rounded-2xl bg-brand/[0.09] p-5 text-center ring-1 ring-brand/25">
            <p className="font-display text-lg font-extrabold leading-snug text-ink">Send your job photos</p>
            <p className="mt-1.5 text-sm text-ink/60">Live on this page the same day.</p>
          </Reveal>
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
        <SectionTitle index="03" kicker="Recent work" title={`On roofs around ${site.city}`} />
        <div className="mt-12 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          {site.photos.map((p, i) => (
            <ImageReveal
              key={`${i}-${p.src}`}
              delay={i * 0.06}
              className={`photo-grade overflow-hidden rounded-2xl ${i === 0 ? "col-span-2 row-span-2" : ""}`}
            >
              {/* Real GBP photo. loading=lazy keeps the mobile speed budget (CLAUDE.md §5b). */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.src}
                alt={p.alt}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                style={{ aspectRatio: "1 / 1" }}
              />
            </ImageReveal>
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
      className={`relative flex ${fixed ? "h-[280px] w-[320px] md:w-[380px]" : "min-h-[240px] w-full"} shrink-0 flex-col rounded-2xl bg-white p-6 pt-8 shadow-card ring-1 ring-ink/5 transition-all duration-200 hover:-translate-y-1 hover:shadow-cardhover hover:ring-brand/20`}
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
  const reduce = useReducedMotionSafe();
  if (site.reviews.length === 0) return null; // omit rather than invent (CLAUDE.md §0)

  return (
    <section id="reviews" className="overflow-hidden py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-5">
        <SectionTitle index="04" kicker="Real reviews" title={`What ${site.city} says`} />
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
        <SectionTitle index="05" kicker="Questions" title="Before you call" />
        <Reveal className="mt-8">
          <FaqAccordion />
        </Reveal>
      </div>
    </section>
  );
}

export function Contact() {
  const href = telHref(site.phone);
  return (
    <section
      id="contact"
      className="py-20 md:py-28"
      style={{ background: "radial-gradient(60% 60% at 100% 100%, rgb(var(--brand) / 0.05) 0%, transparent 55%)" }}
    >
      <div className="mx-auto max-w-6xl px-5">
        <SectionTitle index="06" kicker="Find us" title={`${site.city}, ${site.state}`} />
        <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-[1fr_1.3fr]">
          <Reveal className="flex flex-col justify-between rounded-3xl bg-white p-7 shadow-card ring-1 ring-ink/5 md:p-8">
            <div className="space-y-2.5 text-ink/80">
              <p className="font-display text-2xl font-extrabold tracking-tight text-ink">{site.businessName}</p>
              {site.address && <p>{site.address}</p>}
              <p>Serving {site.city} and nearby.</p>
            </div>
            {href ? (
              <a
                href={href}
                className="mt-7 inline-flex min-h-tap items-center justify-center rounded-full bg-gradient-to-b from-brand to-branddeep px-7 py-3 font-display text-lg font-extrabold text-brandink shadow-cta transition-transform hover:-translate-y-0.5 active:scale-95"
              >
                Call {site.phone}
              </a>
            ) : (
              <a
                href="#quote"
                className="mt-7 inline-flex min-h-tap items-center justify-center rounded-full bg-gradient-to-b from-brand to-branddeep px-7 py-3 font-display text-lg font-extrabold text-brandink shadow-cta"
              >
                Get a free quote
              </a>
            )}
          </Reveal>
          <Reveal delay={0.06} className="overflow-hidden rounded-3xl ring-1 ring-ink/10">
            <iframe
              title={`Map of ${site.businessName}`}
              src={mapEmbedUrl(site.mapQuery)}
              loading="lazy"
              className="h-72 w-full md:h-full md:min-h-[320px]"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/**
 * Full-bleed proof moment: one real job photo, color-graded, with the sharpest short REAL review
 * quoted large over it. Renders only when both exist (never stock, never invented). The single
 * most "designed" moment on the page after the hero.
 */
export function QuoteBand() {
  const photo = site.photos[1] ?? site.photos[0];
  const quote = [...site.reviews].filter((r) => r.rating >= 4).sort((a, b) => a.text.length - b.text.length)[0];
  if (!photo || !quote) return null;
  const text = quote.text.length > 190 ? quote.text.slice(0, 180).replace(/\s+\S*$/, "") + "..." : quote.text;
  return (
    <section aria-label="Customer quote" className="photo-grade relative overflow-hidden">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={photo.src} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
      <div aria-hidden className="absolute inset-0 z-[2]" style={{ background: "linear-gradient(100deg, rgb(var(--ink) / 0.92) 0%, rgb(var(--ink) / 0.55) 55%, rgb(var(--ink) / 0.25) 100%)" }} />
      <div className="relative z-[3] mx-auto max-w-6xl px-5 py-24 md:py-36">
        <Reveal>
          <p className="text-amber-400" aria-label={`${quote.rating} out of 5 stars`}>{"★".repeat(Math.round(quote.rating))}</p>
          <blockquote className="mt-5 max-w-3xl font-display text-3xl font-extrabold leading-tight tracking-tight text-white md:text-5xl">
            &ldquo;{text}&rdquo;
          </blockquote>
          <figcaption className="mt-6 text-sm font-semibold uppercase tracking-[0.2em] text-white/60">
            {quote.author} · Google review
          </figcaption>
        </Reveal>
      </div>
    </section>
  );
}
