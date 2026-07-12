"use client";

import { motion, useReducedMotion } from "framer-motion";
import { site, telHref } from "../lib/content";

// The one hero moment (CLAUDE.md §5c) in five structural variants (CLAUDE.md §5d: per-lead
// differentiation). "photo"/"split"/"bold" are dark atmosphere heroes; "frame" presents the photo
// as a wide framed canvas under the copy (structure adapted from a 21st.dev pattern, restyled to
// contract); "paper" is a LIGHT editorial hero: ink type on warm paper, angled photo right — it
// doubles the perceived range of the template so two prospects never read the same opening. All
// variants share the same conversion skeleton: top bar, location headline, dual-persona CTAs,
// stats strip at the base. Reduced motion respected throughout.

function useStagger() {
  const reduce = useReducedMotion();
  return (i: number) =>
    reduce
      ? { initial: { opacity: 1, y: 0 }, animate: { opacity: 1, y: 0 } }
      : {
          initial: { opacity: 0, y: 26 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.55, delay: 0.08 * i, ease: [0.22, 1, 0.36, 1] as const },
        };
}

type Tone = "dark" | "light";

// Anchor nav (desktop): smooth-scroll section links give the single-page demo an app-like feel
// (Website Mastery blueprint: navigation is part of perceived quality). Mobile stays clean — the
// sticky call bar is the navigation priority there (§5b: one primary action).
// Content-aware: a link only renders when its section will (a lead with no review texts has no
// Reviews section — a dead anchor reads as broken, worse than no link).
const NAV = [
  { href: "#services", label: "Services", show: site.services.length > 0 },
  { href: "#work", label: "Work", show: true },
  { href: "#reviews", label: "Reviews", show: site.reviews.length > 0 },
  { href: "#contact", label: "Contact", show: true },
].filter((n) => n.show);

function TopBar({ tone = "dark" }: { tone?: Tone }) {
  const href = telHref(site.phone);
  const light = tone === "light";
  return (
    <div className={`relative z-10 border-b backdrop-blur-md ${light ? "border-ink/10 bg-paper2/60" : "border-white/10 bg-white/5"}`}>
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-2.5 text-sm">
        <span className={`shrink-0 font-semibold tracking-wide ${light ? "text-ink/70" : "text-white/80"}`}>
          Serving {site.city}, {site.state}
        </span>
        <nav className="hidden gap-5 md:flex" aria-label="Sections">
          {NAV.map((n) => (
            <a
              key={n.href}
              href={n.href}
              className={`font-medium underline-offset-4 transition-colors duration-150 hover:underline ${
                light ? "text-ink/60 hover:text-ink" : "text-white/60 hover:text-white"
              }`}
            >
              {n.label}
            </a>
          ))}
        </nav>
        {href && (
          <a href={href} className={`shrink-0 font-bold underline-offset-4 hover:underline ${light ? "text-ink" : "text-white"}`}>
            {site.phone}
          </a>
        )}
      </div>
    </div>
  );
}

function Ctas({ center = false, tone = "dark" }: { center?: boolean; tone?: Tone }) {
  const href = telHref(site.phone);
  const light = tone === "light";
  return (
    <div className={`flex flex-col gap-3 sm:flex-row ${center ? "sm:justify-center" : ""}`}>
      {href ? (
        <a
          href={href}
          className="flex min-h-tap items-center justify-center rounded-full bg-brand px-8 py-3.5 font-display text-lg font-extrabold text-brandink shadow-cta transition-all hover:-translate-y-0.5 active:scale-95"
        >
          Call {site.phone}
        </a>
      ) : (
        <a
          href="#quote"
          className="flex min-h-tap items-center justify-center rounded-full bg-brand px-8 py-3.5 font-display text-lg font-extrabold text-brandink shadow-cta"
        >
          Get a free quote
        </a>
      )}
      <a
        href="#quote"
        className={`flex min-h-tap items-center justify-center rounded-full border-2 px-8 py-3.5 font-display text-lg font-semibold transition-colors active:scale-95 ${
          light ? "border-ink/30 text-ink hover:border-ink" : "border-white/40 text-white hover:border-white"
        }`}
      >
        Book a free inspection
      </a>
    </div>
  );
}

function StatsStrip({ stagger, tone = "dark" }: { stagger: ReturnType<typeof useStagger>; tone?: Tone }) {
  if (site.rating == null && site.reviewCount == null) return null;
  const light = tone === "light";
  const num = light ? "text-ink" : "text-white";
  const label = light ? "text-ink/50" : "text-white/50";
  return (
    <motion.div
      {...stagger(4)}
      className={`relative z-10 border-t backdrop-blur-md ${light ? "border-ink/10 bg-paper2/80" : "border-white/10 bg-ink/60"}`}
    >
      <div className={`mx-auto grid max-w-6xl grid-cols-3 divide-x px-2 py-5 md:py-6 ${light ? "divide-ink/10" : "divide-white/10"}`}>
        {site.rating != null && (
          <div className="px-3 text-center">
            <p className={`font-display text-2xl font-extrabold md:text-4xl ${num}`}>
              <span aria-hidden className={`mr-1 text-lg md:text-2xl ${light ? "text-amber-500" : "text-amber-400"}`}>★</span>
              {site.rating.toFixed(1)}
            </p>
            <p className={`mt-1 text-xs font-semibold uppercase tracking-wide md:text-sm ${label}`}>Google rating</p>
          </div>
        )}
        {site.reviewCount != null && (
          <div className="px-3 text-center">
            <p className={`font-display text-2xl font-extrabold md:text-4xl ${num}`}>{site.reviewCount}</p>
            <p className={`mt-1 text-xs font-semibold uppercase tracking-wide md:text-sm ${label}`}>Google reviews</p>
          </div>
        )}
        <div className="px-3 text-center">
          <p className={`font-display text-2xl font-extrabold md:text-4xl ${num}`}>{site.city}</p>
          <p className={`mt-1 text-xs font-semibold uppercase tracking-wide md:text-sm ${label}`}>Local &amp; nearby</p>
        </div>
      </div>
    </motion.div>
  );
}

function GradientBackdrop() {
  return (
    <div
      className="h-full w-full texture-shingle"
      style={{
        background:
          "radial-gradient(90% 70% at 15% 0%, rgb(var(--brand) / 0.45) 0%, transparent 60%), radial-gradient(70% 60% at 100% 100%, rgba(255,255,255,0.06) 0%, transparent 55%)",
      }}
    />
  );
}

// Personalized per lead by the builder (their reviews, their site); safe default otherwise.
const SUBLINE = site.heroSubline ?? "Local crew. Fast response. Your call answered.";

/** Variant A "photo": full-bleed photo (or gradient) behind left-aligned type. */
function HeroPhoto({ stagger }: { stagger: ReturnType<typeof useStagger> }) {
  return (
    <>
      <div aria-hidden className="absolute inset-0">
        {site.heroPhoto ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={site.heroPhoto} alt="" className="h-full w-full object-cover" fetchPriority="high" />
            <div className="absolute inset-0 bg-gradient-to-b from-ink/90 via-ink/80 to-ink" />
            <div className="absolute inset-0 bg-gradient-to-r from-ink/80 via-ink/40 to-transparent" />
          </>
        ) : (
          <GradientBackdrop />
        )}
      </div>
      <div className="relative z-10 mx-auto max-w-6xl px-5 pb-16 pt-12 md:pb-24 md:pt-20">
        <motion.p {...stagger(0)} className="font-display text-sm font-medium uppercase tracking-[0.2em] text-white/70">
          {site.businessName}
        </motion.p>
        <motion.h1 {...stagger(1)} className="mt-4 max-w-3xl font-display text-5xl font-extrabold leading-[0.98] tracking-tight md:text-7xl">
          {site.primaryService} in {site.city}, {site.state}
        </motion.h1>
        <motion.p {...stagger(2)} className="mt-5 max-w-xl text-lg text-white/85 md:text-xl">
          {SUBLINE}
          {site.reviewCount ? ` ${site.reviewCount} Google reviews and counting.` : ""}
        </motion.p>
        <motion.div {...stagger(3)} className="mt-9">
          <Ctas />
        </motion.div>
      </div>
    </>
  );
}

/** Variant B "split": type left, photo as a framed floating card right (stacks on mobile). */
function HeroSplit({ stagger }: { stagger: ReturnType<typeof useStagger> }) {
  return (
    <>
      <div aria-hidden className="absolute inset-0">
        <GradientBackdrop />
      </div>
      <div className="relative z-10 mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-5 pb-16 pt-12 md:grid-cols-[1.2fr_1fr] md:pb-24 md:pt-20">
        <div>
          <motion.p {...stagger(0)} className="font-display text-sm font-medium uppercase tracking-[0.2em] text-white/70">
            {site.businessName}
          </motion.p>
          <motion.h1 {...stagger(1)} className="mt-4 font-display text-5xl font-extrabold leading-[0.98] tracking-tight md:text-6xl">
            {site.primaryService} in {site.city}, {site.state}
          </motion.h1>
          <motion.p {...stagger(2)} className="mt-5 max-w-xl text-lg text-white/85">
            {SUBLINE}
            {site.reviewCount ? ` ${site.reviewCount} Google reviews and counting.` : ""}
          </motion.p>
          <motion.div {...stagger(3)} className="mt-9">
            <Ctas />
          </motion.div>
        </div>
        {site.heroPhoto && (
          <motion.div {...stagger(2)} className="hidden overflow-hidden rounded-3xl ring-1 ring-white/20 md:block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={site.heroPhoto} alt={`Work by ${site.businessName}`} className="aspect-[4/5] w-full object-cover" fetchPriority="high" />
          </motion.div>
        )}
      </div>
    </>
  );
}

/** Variant C "bold": centered massive type on atmosphere; photo appears later in the page. */
function HeroBold({ stagger }: { stagger: ReturnType<typeof useStagger> }) {
  return (
    <>
      <div aria-hidden className="absolute inset-0">
        <GradientBackdrop />
      </div>
      <div className="relative z-10 mx-auto max-w-5xl px-5 pb-16 pt-14 text-center md:pb-24 md:pt-24">
        <motion.p {...stagger(0)} className="font-display text-sm font-medium uppercase tracking-[0.3em] text-white/70">
          {site.businessName}
        </motion.p>
        <motion.h1 {...stagger(1)} className="mx-auto mt-5 max-w-4xl font-display text-5xl font-bold leading-[0.98] tracking-tight md:text-8xl">
          {site.primaryService} in {site.city}, {site.state}
        </motion.h1>
        <motion.p {...stagger(2)} className="mx-auto mt-6 max-w-xl text-lg text-white/85 md:text-xl">
          {SUBLINE}
          {site.reviewCount ? ` ${site.reviewCount} Google reviews and counting.` : ""}
        </motion.p>
        <motion.div {...stagger(3)} className="mt-10 flex justify-center">
          <Ctas center />
        </motion.div>
      </div>
    </>
  );
}

/** Variant D "frame": copy on dark atmosphere, then the photo as a wide framed canvas panel.
 *  Structure adapted from a 21st.dev hero pattern (app-frame-below-copy), restyled to contract:
 *  real work photo instead of a product screenshot, brand glow, conversion skeleton untouched. */
function HeroFrame({ stagger }: { stagger: ReturnType<typeof useStagger> }) {
  return (
    <>
      <div aria-hidden className="absolute inset-0">
        <GradientBackdrop />
      </div>
      <div className="relative z-10 mx-auto max-w-6xl px-5 pb-10 pt-12 md:pb-14 md:pt-20">
        <motion.p {...stagger(0)} className="font-display text-sm font-medium uppercase tracking-[0.2em] text-white/70">
          {site.businessName}
        </motion.p>
        <motion.h1 {...stagger(1)} className="mt-4 max-w-3xl font-display text-5xl font-extrabold leading-[0.98] tracking-tight md:text-7xl">
          {site.primaryService} in {site.city}, {site.state}
        </motion.h1>
        <motion.p {...stagger(2)} className="mt-5 max-w-xl text-lg text-white/85 md:text-xl">
          {SUBLINE}
          {site.reviewCount ? ` ${site.reviewCount} Google reviews and counting.` : ""}
        </motion.p>
        <motion.div {...stagger(3)} className="mt-9">
          <Ctas />
        </motion.div>
        {site.heroPhoto && (
          <motion.div {...stagger(4)} className="mt-12 overflow-hidden rounded-3xl ring-1 ring-white/20 shadow-2xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={site.heroPhoto}
              alt={`Work by ${site.businessName}`}
              className="aspect-[16/9] w-full object-cover md:aspect-[21/9]"
              fetchPriority="high"
            />
          </motion.div>
        )}
      </div>
    </>
  );
}

/** Variant E "paper": LIGHT editorial hero — ink type on warm paper, angled photo right.
 *  Structure adapted from a 21st.dev editorial split pattern, restyled to contract (warm paper,
 *  brand rule under the headline, accent reserved for the call CTA). */
function HeroPaper({ stagger }: { stagger: ReturnType<typeof useStagger> }) {
  return (
    <>
      <div
        aria-hidden
        className="absolute inset-0"
        style={{ background: "radial-gradient(80% 60% at 0% 0%, rgb(var(--brand) / 0.08) 0%, transparent 55%)" }}
      />
      <div className="relative z-10 mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-5 pb-14 pt-12 md:grid-cols-[1.15fr_1fr] md:pb-20 md:pt-16">
        <div>
          <motion.p {...stagger(0)} className="font-display text-sm font-semibold uppercase tracking-[0.2em] text-ink/60">
            {site.businessName}
          </motion.p>
          <motion.h1 {...stagger(1)} className="mt-4 font-display text-5xl font-extrabold leading-[0.98] tracking-tight text-ink md:text-7xl">
            {site.primaryService} in {site.city}, {site.state}
          </motion.h1>
          <motion.div {...stagger(1)} aria-hidden className="mt-6 h-1 w-16 rounded-full bg-brand" />
          <motion.p {...stagger(2)} className="mt-6 max-w-xl text-lg text-ink/70 md:text-xl">
            {SUBLINE}
            {site.reviewCount ? ` ${site.reviewCount} Google reviews and counting.` : ""}
          </motion.p>
          <motion.div {...stagger(3)} className="mt-9">
            <Ctas tone="light" />
          </motion.div>
        </div>
        {site.heroPhoto && (
          <motion.div
            {...stagger(2)}
            className="hidden overflow-hidden md:block"
            style={{ clipPath: "polygon(14% 0, 100% 0, 100% 100%, 0 100%)" }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={site.heroPhoto} alt={`Work by ${site.businessName}`} className="aspect-[4/5] w-full object-cover" fetchPriority="high" />
          </motion.div>
        )}
      </div>
    </>
  );
}

export default function Hero() {
  const stagger = useStagger();
  const variant = site.theme.heroVariant;
  const tone: Tone = variant === "paper" ? "light" : "dark";
  return (
    <header className={`relative overflow-hidden ${tone === "light" ? "bg-paper text-ink" : "bg-ink text-white"}`}>
      <TopBar tone={tone} />
      {variant === "split" ? (
        <HeroSplit stagger={stagger} />
      ) : variant === "bold" ? (
        <HeroBold stagger={stagger} />
      ) : variant === "frame" ? (
        <HeroFrame stagger={stagger} />
      ) : variant === "paper" ? (
        <HeroPaper stagger={stagger} />
      ) : (
        <HeroPhoto stagger={stagger} />
      )}
      <StatsStrip stagger={stagger} tone={tone} />
    </header>
  );
}
