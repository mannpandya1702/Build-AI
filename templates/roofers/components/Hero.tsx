"use client";

import { motion, useReducedMotion } from "framer-motion";
import { site, telHref } from "../lib/content";

// The one hero moment (CLAUDE.md §5c) in three structural variants (CLAUDE.md §5d: per-lead
// differentiation). All variants share the same conversion skeleton: top bar, location headline,
// dual-persona CTAs, glass stats strip at the base. Reduced motion respected throughout.

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

function TopBar() {
  const href = telHref(site.phone);
  return (
    <div className="relative z-10 border-b border-white/10 bg-white/5 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-2.5 text-sm">
        <span className="font-semibold tracking-wide text-white/80">
          Serving {site.city}, {site.state}
        </span>
        {href && (
          <a href={href} className="font-bold text-white underline-offset-4 hover:underline">
            {site.phone}
          </a>
        )}
      </div>
    </div>
  );
}

function Ctas({ center = false }: { center?: boolean }) {
  const href = telHref(site.phone);
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
        className="flex min-h-tap items-center justify-center rounded-full border-2 border-white/40 px-8 py-3.5 font-display text-lg font-semibold text-white transition-colors hover:border-white active:scale-95"
      >
        Book a free inspection
      </a>
    </div>
  );
}

function StatsStrip({ stagger }: { stagger: ReturnType<typeof useStagger> }) {
  if (site.rating == null && site.reviewCount == null) return null;
  return (
    <motion.div {...stagger(4)} className="relative z-10 border-t border-white/10 bg-white/5 backdrop-blur-md">
      <div className="mx-auto grid max-w-6xl grid-cols-3 divide-x divide-white/10 px-2 py-5 md:py-6">
        {site.rating != null && (
          <div className="px-3 text-center">
            <p className="font-display text-2xl font-extrabold text-white md:text-4xl">
              <span aria-hidden className="mr-1 text-lg text-amber-400 md:text-2xl">★</span>
              {site.rating.toFixed(1)}
            </p>
            <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-white/50 md:text-sm">Google rating</p>
          </div>
        )}
        {site.reviewCount != null && (
          <div className="px-3 text-center">
            <p className="font-display text-2xl font-extrabold text-white md:text-4xl">{site.reviewCount}</p>
            <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-white/50 md:text-sm">Google reviews</p>
          </div>
        )}
        <div className="px-3 text-center">
          <p className="font-display text-2xl font-extrabold text-white md:text-4xl">{site.city}</p>
          <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-white/50 md:text-sm">Local &amp; nearby</p>
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

const SUBLINE = "Local crew. Fast response. Your call answered.";

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

export default function Hero() {
  const stagger = useStagger();
  const variant = site.theme.heroVariant;
  return (
    <header className="relative overflow-hidden bg-ink text-white">
      <TopBar />
      {variant === "split" ? <HeroSplit stagger={stagger} /> : variant === "bold" ? <HeroBold stagger={stagger} /> : <HeroPhoto stagger={stagger} />}
      <StatsStrip stagger={stagger} />
    </header>
  );
}
