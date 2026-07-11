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

/**
 * Services as a bento, not a uniform grid (§5b-bis bans the "N identical cards" slop): the first
 * service is the featured panel (brand-tinted, larger type, its own quote link), the rest are
 * compact cards with a brand hairline. Asymmetry reads designed; sameness reads generated.
 */
export function Services() {
  const [first, ...rest] = site.services;
  if (!first) return null;
  return (
    <section
      id="services"
      className="relative py-20 md:py-28"
      style={{ background: "radial-gradient(70% 50% at 0% 0%, rgb(var(--brand) / 0.06) 0%, transparent 55%)" }}
    >
      <div className="mx-auto max-w-6xl px-5">
        <SectionTitle kicker="What we do" title="Roof work, done right" />
        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* Featured service: a full-width panel so the grid below always balances, whatever the
              service count. Brand-tinted, its own quote link — the #1 service earns the emphasis. */}
          <Reveal className="group relative col-span-full overflow-hidden rounded-3xl bg-brand/[0.08] p-7 ring-1 ring-brand/20 transition-all hover:-translate-y-0.5 md:p-9">
            <div className="grid grid-cols-1 items-center gap-6 md:grid-cols-[1.2fr_1fr]">
              <div>
                <span className="font-display text-sm font-extrabold tracking-wide text-brand">01</span>
                <h3 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-ink md:text-4xl">{first.name}</h3>
                <p className="mt-3 max-w-xl text-lg text-ink/70">{first.blurb}</p>
              </div>
              <div className="md:text-right">
                <a href="#quote" className="inline-flex items-center gap-1.5 font-display text-lg font-extrabold text-brand underline-offset-4 hover:underline">
                  Get a quote for this <span aria-hidden>→</span>
                </a>
              </div>
            </div>
            <div
              aria-hidden
              className="pointer-events-none absolute -bottom-20 -right-16 h-56 w-56 rounded-full"
              style={{ background: "radial-gradient(closest-side, rgb(var(--brand) / 0.14), transparent)" }}
            />
          </Reveal>
          {rest.map((s, i) => (
            <Reveal
              key={s.name}
              delay={(i + 1) * 0.05}
              className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-card ring-1 ring-ink/5 transition-all hover:-translate-y-0.5 hover:shadow-cardhover hover:ring-brand/25"
            >
              <span aria-hidden className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-brand/60 to-transparent" />
              <span className="font-display text-sm font-extrabold text-brand/50">{String(i + 2).padStart(2, "0")}</span>
              <h3 className="mt-1 font-display text-xl font-extrabold text-ink">{s.name}</h3>
              <p className="mt-2 text-ink/70">{s.blurb}</p>
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
    <section className="texture-shingle-ink bg-paper2 py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-5">
        <SectionTitle kicker="How it works" title="Three steps. That's it." />
        <div className="relative mt-12 grid grid-cols-1 gap-10 md:grid-cols-3 md:gap-4">
          {/* the connecting line: the three steps read as one path, not three loose cards */}
          <div aria-hidden className="absolute left-1/2 top-6 hidden h-px w-2/3 -translate-x-1/2 bg-gradient-to-r from-transparent via-brand/30 to-transparent md:block" />
          {steps.map((s, i) => (
            <Reveal key={s.t} delay={i * 0.08} className="relative">
              <div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full bg-brand font-display text-xl font-extrabold text-brandink shadow-cta md:mx-auto">
                {i + 1}
              </div>
              <div className="mt-4 rounded-2xl bg-white p-6 shadow-card ring-1 ring-ink/5 md:text-center">
                <h3 className="font-display text-2xl font-extrabold text-ink">{s.t}</h3>
                <p className="mt-2 text-ink/70">{s.d}</p>
              </div>
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
          {Array.from({ length: 5 }).map((_, i) => (
            <Reveal
              key={i}
              delay={i * 0.04}
              className={`texture-shingle-ink relative flex aspect-square items-center justify-center rounded-2xl border-2 border-dashed ${
                i % 2 ? "border-ink/15 bg-gradient-to-br from-ink/[0.04] to-ink/[0.1]" : "border-brand/25 bg-gradient-to-br from-brand/[0.05] to-brand/[0.12]"
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
            <Reveal key={f.q} className="py-5 pl-5" >
              <div className="relative">
                <span aria-hidden className="absolute -left-5 top-1 h-4 w-1 rounded-full bg-brand/60" />
                <h3 className="font-display text-lg font-extrabold text-ink">{f.q}</h3>
                <p className="mt-2 text-ink/70">{f.a}</p>
              </div>
            </Reveal>
          ))}
        </div>
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
        <SectionTitle kicker="Find us" title={`${site.city}, ${site.state}`} />
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
                className="mt-7 inline-flex min-h-tap items-center justify-center rounded-full bg-brand px-7 py-3 font-display text-lg font-extrabold text-brandink shadow-cta transition-transform hover:-translate-y-0.5 active:scale-95"
              >
                Call {site.phone}
              </a>
            ) : (
              <a
                href="#quote"
                className="mt-7 inline-flex min-h-tap items-center justify-center rounded-full bg-brand px-7 py-3 font-display text-lg font-extrabold text-brandink shadow-cta"
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
