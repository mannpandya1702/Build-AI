"use client";

import Image from "next/image";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { ArrowDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/Button";
import { WhatsAppCTA } from "@/components/ui/WhatsAppCTA";
import { DEMO_HERO_POSTER, DEMO_HERO_VIDEO } from "@/lib/demoMedia";
import { EASE } from "@/lib/motion";

/**
 * Full-viewport opening.
 *
 * The entrance — headline wiping in line by line, backdrop scaling 1.06 → 1
 * over 1.2s — is CSS, not Framer Motion. The h1 is the LCP element, and
 * anything that keeps it masked until hydration shows up directly in the
 * mobile score. See the .hero-* classes in globals.css.
 *
 * Framer still drives the scroll parallax below, which is an enhancement and
 * can safely wait for hydration.
 *
 * The backdrop is a labelled slot — the client can drop in either a still or a
 * looping video without the layout changing. See README §Photography.
 */

/** Headline and subcopy are the studio's own, from the deck's website draft. */
const HEADLINE = ["A small number of weddings,", "planned all the way through."];

export function Hero() {
  const shouldReduce = useReducedMotion();
  const ref = useRef<HTMLElement>(null);

  // Motion background is a desktop-only enhancement — see the note below.
  const [wideScreen, setWideScreen] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(min-width: 768px)");
    const apply = () => setWideScreen(query.matches);
    apply();
    query.addEventListener("change", apply);
    return () => query.removeEventListener("change", apply);
  }, []);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const backdropY = useTransform(scrollYProgress, [0, 1], ["0%", "12%"]);
  const veilOpacity = useTransform(scrollYProgress, [0, 1], [1, 0.55]);

  return (
    <section
      ref={ref}
      aria-labelledby="hero-heading"
      className="relative flex min-h-[100svh] items-end overflow-hidden bg-ink"
    >
      {/* Outer layer owns the scroll parallax; the inner one owns the CSS
          load zoom, so the two never fight over `transform`. */}
      <motion.div
        className="absolute inset-0"
        style={shouldReduce ? undefined : { y: backdropY }}
      >
        <div
          data-slot="hero-backdrop"
          aria-hidden
          className="hero-zoom h-full w-full bg-ink-soft"
        >
          {DEMO_HERO_VIDEO ? (
            /* Temporary demo loop. The poster covers browsers that cannot
               decode WebM. Reduced-motion users, and phones, get the still
               instead: the loop is ~1.7MB, which is not a reasonable thing to
               push down a mobile connection for a background. */
            shouldReduce || !wideScreen ? (
              /* next/image with priority, not a bare <img>: this fills the
                 viewport, so it is the LCP element on phones. Un-prioritised
                 it was discovered late and LCP sat at 5.4s. */
              <Image
                src={DEMO_HERO_POSTER!}
                alt=""
                fill
                priority
                sizes="100vw"
                className="object-cover"
              />
            ) : (
              <video
                className="absolute inset-0 h-full w-full object-cover"
                src={DEMO_HERO_VIDEO}
                poster={DEMO_HERO_POSTER}
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
              />
            )
          ) : (
            <>
              {/* Placeholder fill: one flat brand tint — no decorative gradient,
                  and no seam where two blocks would meet. */}
              <div className="absolute inset-0 bg-pista/10" />
              <div className="absolute inset-x-0 top-24 flex justify-center px-4 md:top-28 md:justify-end md:px-gutter">
                <span className="rounded-full border border-dashed border-pista/40 px-5 py-2 text-center font-sans text-eyebrow uppercase text-pista">
                  Hero photo or video — 16:9
                </span>
              </div>
            </>
          )}
        </div>
      </motion.div>

      {/* Functional scrims, not decoration: these keep the headline and the
          overlaid nav legible at 4.5:1 over whatever photograph the client
          drops in behind them. The body scrim fades on scroll; the nav scrim
          does not, because the nav stays put until it solidifies. */}
      <motion.div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-t from-ink via-ink/75 to-ink/25"
        style={shouldReduce ? undefined : { opacity: veilOpacity }}
      />
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-ink/80 to-transparent"
      />

      <div className="shell relative z-10 flex flex-col gap-8 pb-16 pt-32 md:pb-24">
        <p
          className="rise-in font-sans text-eyebrow font-semibold uppercase text-pista"
          style={{ animationDelay: "60ms" }}
        >
          Weddings held in the old way, made new
        </p>

        <h1 id="hero-heading" className="max-w-5xl font-display text-display-xl font-light text-chandni">
          {HEADLINE.map((line, index) => (
            // Each line sits in an overflow-hidden box; the inner span wipes up.
            <span key={line} className="block overflow-hidden pb-[0.06em]">
              <span
                className="hero-line block"
                style={{ animationDelay: `${140 + index * 80}ms` }}
              >
                {line}
              </span>
            </span>
          ))}
        </h1>

        <p
          className="rise-in max-w-measure font-sans text-body-lg text-chandni/85"
          style={{ animationDelay: "420ms" }}
        >
          Riwaaya takes on a handful of celebrations each year — from the first
          roadmap to the final payment sheet, with a named person beside you the
          whole way.
        </p>

        <div
          className="rise-in flex flex-col gap-3 sm:flex-row sm:items-center"
          style={{ animationDelay: "500ms" }}
        >
          <Button href="/#enquiry" size="lg" variant="solid">
            Start a conversation
          </Button>
          <WhatsAppCTA variant="inline" tone="chandni" />
        </div>
      </div>

      <motion.a
        href="#intro"
        aria-label="Scroll to introduction"
        className="absolute bottom-8 right-6 z-10 hidden h-12 w-12 items-center justify-center rounded-full border border-chandni/30 text-chandni transition-colors duration-[250ms] ease-riwaaya hover:bg-chandni hover:text-ink md:flex"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9, duration: 0.6, ease: EASE }}
      >
        <ArrowDown aria-hidden className="h-4 w-4" strokeWidth={1.5} />
      </motion.a>
    </section>
  );
}
