"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ExternalLink } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Reveal } from "@/components/motion/Reveal";
import { WhatsAppCTA } from "@/components/ui/WhatsAppCTA";
import { services } from "@/content/services";
import { buildFormUrl } from "@/lib/googleForm";
import { EASE } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * The Google Form embed.
 *
 * Three things make an embedded form survivable:
 *  1. a skeleton shimmer holds the space until onLoad fires, so nothing jumps;
 *  2. an "open in a new tab" link always sits under the frame;
 *  3. if the iframe has not loaded after 8s — blocked, offline, form deleted —
 *     we stop pretending and surface WhatsApp instead.
 *
 * The two-field pre-qualifier above deep-links its answers into the form via
 * entry.XXXX params. Those IDs live in lib/googleForm.ts as documented
 * constants; until the real ones are pasted in, the form still opens, it just
 * arrives blank.
 */

const LOAD_TIMEOUT_MS = 8000;

export function EnquiryForm() {
  const [eventType, setEventType] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const shouldReduce = useReducedMotion();
  const timeoutRef = useRef<number | null>(null);

  const embedSrc = buildFormUrl({ eventType, eventDate });
  const newTabSrc = buildFormUrl({ eventType, eventDate }, { embedded: false });

  // Changing a pre-qualifier answer swaps the iframe src, so the skeleton has
  // to come back. Adjusted during render so the stale "loaded" frame is never
  // shown against the new URL for a paint.
  const [lastSrc, setLastSrc] = useState(embedSrc);
  if (embedSrc !== lastSrc) {
    setLastSrc(embedSrc);
    setLoaded(false);
    setFailed(false);
  }

  /**
   * Do not mount the iframe until the card is close to the viewport.
   *
   * loading="lazy" alone is not enough: the browser's own threshold is
   * generous, so on shorter pages Google's form was still being fetched during
   * initial load and dragging the mobile score down. The observer keeps the
   * third-party request out of the critical path entirely.
   */
  const cardRef = useRef<HTMLDivElement>(null);
  const [inRange, setInRange] = useState(false);

  useEffect(() => {
    const node = cardRef.current;
    if (!node || inRange) return;

    // No observer support: mount it anyway rather than hide the form. Deferred
    // to a task so this is not a synchronous setState inside the effect body.
    if (typeof IntersectionObserver === "undefined") {
      const id = window.setTimeout(() => setInRange(true), 0);
      return () => window.clearTimeout(id);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) setInRange(true);
      },
      { rootMargin: "600px 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [inRange]);

  // The failure timer only makes sense once the iframe is actually mounted.
  useEffect(() => {
    if (loaded || !inRange) return;
    timeoutRef.current = window.setTimeout(() => setFailed(true), LOAD_TIMEOUT_MS);
    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    };
  }, [loaded, inRange, embedSrc]);

  return (
    <div className="mt-12 flex flex-col gap-6">
      {/* Pre-qualifier — two fields, deep-linked into the form. */}
      <Reveal>
        {/* min-w-0 matters: a fieldset defaults to min-inline-size: min-content
            and will not shrink below its widest option label, which pushes the
            page into horizontal scroll on narrow screens. */}
        <fieldset className="min-w-0 rounded-sm border border-ink/10 bg-chandni p-6 md:p-8">
          <legend className="px-2 font-sans text-eyebrow font-semibold uppercase text-pista-ink">
            Start here
          </legend>

          <div className="mt-2 grid gap-6 sm:grid-cols-2">
            <div className="flex min-w-0 flex-col gap-2">
              <label
                htmlFor="event-type"
                className="font-sans text-micro font-semibold text-ink"
              >
                What are you planning?
              </label>
              <select
                id="event-type"
                name="event-type"
                value={eventType}
                onChange={(event) => setEventType(event.target.value)}
                className="min-h-[48px] w-full min-w-0 cursor-pointer rounded-sm border border-ink/20 bg-chandni px-4 font-sans text-body text-ink transition-colors duration-[250ms] ease-riwaaya hover:border-ink/40"
              >
                <option value="">Select an event</option>
                {services.map((service) => (
                  <option key={service.slug} value={service.title}>
                    {service.title}
                  </option>
                ))}
                <option value="Something else">Something else</option>
              </select>
              <p className="font-sans text-[0.75rem] text-stone-deep">
                Carried into the form below.
              </p>
            </div>

            <div className="flex min-w-0 flex-col gap-2">
              <label
                htmlFor="event-date"
                className="font-sans text-micro font-semibold text-ink"
              >
                Roughly when?
              </label>
              <input
                id="event-date"
                name="event-date"
                type="date"
                value={eventDate}
                onChange={(event) => setEventDate(event.target.value)}
                className="min-h-[48px] w-full min-w-0 rounded-sm border border-ink/20 bg-chandni px-4 font-sans text-body text-ink transition-colors duration-[250ms] ease-riwaaya hover:border-ink/40"
              />
              <p className="font-sans text-[0.75rem] text-stone-deep">
                An approximate date is fine.
              </p>
            </div>
          </div>
        </fieldset>
      </Reveal>

      {/* The embed itself, inside a chandni card. */}
      <Reveal>
        <div
          ref={cardRef}
          className="relative overflow-hidden rounded-sm border border-ink/10 bg-chandni"
        >
          {failed && !loaded ? (
            <FormFallback href={newTabSrc} />
          ) : (
            <>
              <AnimatePresence>
                {!loaded && (
                  <motion.div
                    className="absolute inset-0 z-10 bg-chandni p-6 md:p-10"
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: shouldReduce ? 0.15 : 0.4, ease: EASE }}
                  >
                    <FormSkeleton />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Spacer reserves the frame's exact height before the iframe
                  mounts, so deferring it costs no layout shift. */}
              {!inRange && <div aria-hidden className="min-h-[900px] w-full md:min-h-[780px]" />}

              {inRange && (
              <iframe
                key={embedSrc}
                src={embedSrc}
                title="Riwaaya enquiry form"
                loading="lazy"
                onLoad={() => {
                  setLoaded(true);
                  setFailed(false);
                }}
                className={cn(
                  "no-scrollbar w-full border-0 transition-opacity duration-500",
                  "min-h-[900px] md:min-h-[780px]",
                  loaded ? "opacity-100" : "opacity-0",
                )}
              >
                Your browser does not support embedded forms.
              </iframe>
              )}
            </>
          )}
        </div>
      </Reveal>

      <Reveal>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <a
            href={newTabSrc}
            target="_blank"
            rel="noopener noreferrer"
            className="sweep-underline inline-flex items-center gap-2 font-sans text-micro font-semibold uppercase tracking-[0.14em] text-pista-ink"
          >
            <ExternalLink aria-hidden className="h-4 w-4" strokeWidth={1.5} />
            Open the form in a new tab
          </a>
          <p className="font-sans text-micro text-stone-deep">
            Prefer to talk? Message us and we will reply the same day.
          </p>
        </div>
      </Reveal>
    </div>
  );
}

/** Shown when the iframe never loads — never a dead frame. */
function FormFallback({ href }: { href: string }) {
  return (
    <div className="flex min-h-[420px] flex-col items-start justify-center gap-6 p-8 md:p-12">
      <p className="max-w-prose font-display text-display-sm font-light text-ink">
        The form did not load.
      </p>
      <p className="max-w-prose font-sans text-body text-stone-deep">
        It may be blocked by your browser or network. You can open it directly,
        or simply message us — either reaches the same inbox.
      </p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="sweep-fill inline-flex min-h-[56px] items-center justify-center gap-2 rounded-full border border-pista-ink bg-pista-ink px-8 py-4 font-sans text-micro font-semibold uppercase tracking-[0.14em] text-chandni before:bg-ink"
        >
          <ExternalLink aria-hidden className="h-4 w-4" strokeWidth={1.5} />
          Open the form
        </a>
        <WhatsAppCTA variant="inline" />
      </div>
    </div>
  );
}

/** Skeleton shimmer matching the shape of a Google Form. */
function FormSkeleton() {
  return (
    <div aria-hidden className="flex flex-col gap-6">
      <div className="shimmer h-10 w-2/3 rounded-sm bg-pista-mist" />
      <div className="shimmer h-4 w-1/2 rounded-sm bg-pista-mist" />
      <div className="mt-4 flex flex-col gap-8">
        {[0, 1, 2, 3, 4].map((row) => (
          <div key={row} className="flex flex-col gap-3">
            <div className="shimmer h-4 w-1/3 rounded-sm bg-pista-mist" />
            <div className="shimmer h-11 w-full rounded-sm bg-pista-mist" />
          </div>
        ))}
      </div>
      <span className="sr-only">Loading the enquiry form</span>
    </div>
  );
}
