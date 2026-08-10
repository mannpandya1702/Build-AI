"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ExternalLink, MessageCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Reveal } from "@/components/motion/Reveal";
import { WhatsAppCTA } from "@/components/ui/WhatsAppCTA";
import { services } from "@/content/services";
import { buildFormUrl, isFormConfigured } from "@/lib/googleForm";
import { EASE } from "@/lib/motion";
import { WHATSAPP_NUMBER, site } from "@/lib/site";
import { cn } from "@/lib/utils";

/**
 * The enquiry section has two modes:
 *
 *  - Google Form configured → embed it, as the brief asks.
 *  - Not configured (the default today) → a native, brand-styled form that
 *    composes a WhatsApp message.
 *
 * The second mode exists because the alternative was worse: with a placeholder
 * form URL the embed always failed, and the page showed a large "The form did
 * not load" card above a mostly-empty box. That is a dead end on the site's
 * primary conversion route. The native form works right now with no backend,
 * and quietly steps aside the moment a real form URL is set.
 */
export function EnquiryForm() {
  return isFormConfigured() ? <GoogleFormEmbed /> : <DirectEnquiryForm />;
}

/* ------------------------------------------------------------------ */
/* Native form → WhatsApp                                              */
/* ------------------------------------------------------------------ */

const CITIES = [...site.cities, "Somewhere else"];

const inputBase =
  "min-h-[52px] w-full min-w-0 rounded-sm border border-ink/20 bg-chandni px-4 font-sans text-body text-ink transition-colors duration-[250ms] ease-riwaaya hover:border-ink/40 focus:border-pista-ink";

function Field({
  label,
  hint,
  htmlFor,
  children,
  className,
}: {
  label: string;
  hint?: string;
  htmlFor: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-2", className)}>
      <label htmlFor={htmlFor} className="font-sans text-micro font-semibold text-ink">
        {label}
      </label>
      {children}
      {hint && <p className="font-sans text-[0.75rem] text-stone-deep">{hint}</p>}
    </div>
  );
}

function DirectEnquiryForm() {
  const [sent, setSent] = useState(false);
  const shouldReduce = useReducedMotion();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const get = (k: string) => String(data.get(k) ?? "").trim();

    // One readable message rather than a wall of "Field: value".
    const lines = [
      `Hi Riwaaya, I'd like to enquire about planning a wedding.`,
      ``,
      `Name: ${get("name")}`,
      get("event") && `Function: ${get("event")}`,
      get("date") && `Approximate date: ${get("date")}`,
      get("city") && `Where: ${get("city")}`,
      get("guests") && `Guests: about ${get("guests")}`,
      get("email") && `Email: ${get("email")}`,
      get("message") && ``,
      get("message") && get("message"),
    ].filter(Boolean);

    window.open(
      `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(lines.join("\n"))}`,
      "_blank",
      "noopener,noreferrer",
    );
    setSent(true);
  }

  return (
    <div className="mt-12">
      <Reveal>
        <form
          onSubmit={handleSubmit}
          className="rounded-sm border border-ink/10 bg-chandni p-6 md:p-10"
        >
          <div className="grid gap-6 md:grid-cols-2">
            <Field label="Your name" htmlFor="enq-name">
              <input
                id="enq-name"
                name="name"
                type="text"
                required
                autoComplete="name"
                placeholder="Who are we speaking to?"
                className={inputBase}
              />
            </Field>

            <Field label="Email" htmlFor="enq-email" hint="Optional — we reply on WhatsApp first.">
              <input
                id="enq-email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                className={inputBase}
              />
            </Field>

            <Field label="Which function?" htmlFor="enq-event">
              <select id="enq-event" name="event" required className={cn(inputBase, "cursor-pointer")}>
                <option value="">Select one</option>
                <option value="A full wedding">A full wedding</option>
                <option value="Mehndi">Mehndi</option>
                <option value="Haldi">Haldi</option>
                <option value="Sangeet">Sangeet</option>
                <option value="Engagement">Engagement</option>
                <option value="Reception">Reception</option>
                <option value="Something else">Something else</option>
              </select>
            </Field>

            <Field label="Roughly when?" htmlFor="enq-date" hint="An approximate date is fine.">
              <input id="enq-date" name="date" type="date" className={inputBase} />
            </Field>

            <Field label="Where?" htmlFor="enq-city">
              <select id="enq-city" name="city" className={cn(inputBase, "cursor-pointer")}>
                <option value="">Select a city</option>
                {CITIES.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="How many guests?" htmlFor="enq-guests" hint="A rough number helps.">
              <input
                id="enq-guests"
                name="guests"
                type="number"
                min={1}
                inputMode="numeric"
                placeholder="e.g. 250"
                className={inputBase}
              />
            </Field>

            <Field
              label="Anything you want us to know?"
              htmlFor="enq-message"
              className="md:col-span-2"
              hint="The rituals that matter, a venue you have in mind, a question."
            >
              <textarea
                id="enq-message"
                name="message"
                rows={4}
                placeholder="Tell us about your riwaayat."
                className={cn(inputBase, "min-h-[130px] resize-y py-3 leading-relaxed")}
              />
            </Field>
          </div>

          <div className="mt-8 flex flex-col gap-4 border-t border-ink/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="submit"
              className="sweep-fill inline-flex min-h-[56px] items-center justify-center gap-2 rounded-full border border-pista-ink bg-pista-ink px-8 py-4 font-sans text-micro font-semibold uppercase tracking-[0.14em] text-chandni before:bg-ink"
            >
              <MessageCircle aria-hidden className="h-4 w-4" strokeWidth={1.5} />
              Send on WhatsApp
            </button>

            <p className="max-w-sm font-sans text-micro text-stone-deep">
              This opens WhatsApp with your answers filled in — check it over, then
              press send.
            </p>
          </div>

          {/* Confirmation, announced politely rather than shown as an alert. */}
          <AnimatePresence>
            {sent && (
              <motion.p
                role="status"
                initial={shouldReduce ? { opacity: 0 } : { opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: shouldReduce ? 0.15 : 0.4, ease: EASE }}
                className="mt-5 rounded-sm bg-pista-mist px-4 py-3 font-sans text-micro text-ink"
              >
                WhatsApp should have opened in a new tab. If it did not, message us
                on {site.email} and we will pick it up from there.
              </motion.p>
            )}
          </AnimatePresence>
        </form>
      </Reveal>

      <Reveal>
        <p className="mt-5 font-sans text-micro text-stone-deep">
          Prefer email? Write to{" "}
          <a
            href={`mailto:${site.email}`}
            className="sweep-underline font-semibold text-pista-ink"
          >
            {site.email}
          </a>
          .
        </p>
      </Reveal>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Google Form embed — used once a real form URL is configured          */
/* ------------------------------------------------------------------ */

const LOAD_TIMEOUT_MS = 8000;

function GoogleFormEmbed() {
  const [eventType, setEventType] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const shouldReduce = useReducedMotion();
  const timeoutRef = useRef<number | null>(null);

  const embedSrc = buildFormUrl({ eventType, eventDate });
  const newTabSrc = buildFormUrl({ eventType, eventDate }, { embedded: false });

  const [lastSrc, setLastSrc] = useState(embedSrc);
  if (embedSrc !== lastSrc) {
    setLastSrc(embedSrc);
    setLoaded(false);
    setFailed(false);
  }

  // Keep the third-party frame out of the critical path.
  const cardRef = useRef<HTMLDivElement>(null);
  const [inRange, setInRange] = useState(false);

  useEffect(() => {
    const node = cardRef.current;
    if (!node || inRange) return;
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

  useEffect(() => {
    if (loaded || !inRange) return;
    timeoutRef.current = window.setTimeout(() => setFailed(true), LOAD_TIMEOUT_MS);
    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    };
  }, [loaded, inRange, embedSrc]);

  return (
    <div className="mt-12 flex flex-col gap-6">
      <Reveal>
        <fieldset className="min-w-0 rounded-sm border border-ink/10 bg-chandni p-6 md:p-8">
          <legend className="px-2 font-sans text-eyebrow font-semibold uppercase text-pista-ink">
            Start here
          </legend>

          <div className="mt-2 grid gap-6 sm:grid-cols-2">
            <Field label="What are you planning?" htmlFor="event-type" hint="Carried into the form below.">
              <select
                id="event-type"
                name="event-type"
                value={eventType}
                onChange={(event) => setEventType(event.target.value)}
                className={cn(inputBase, "cursor-pointer")}
              >
                <option value="">Select an event</option>
                {services.map((service) => (
                  <option key={service.slug} value={service.title}>
                    {service.title}
                  </option>
                ))}
                <option value="Something else">Something else</option>
              </select>
            </Field>

            <Field label="Roughly when?" htmlFor="event-date" hint="An approximate date is fine.">
              <input
                id="event-date"
                name="event-date"
                type="date"
                value={eventDate}
                onChange={(event) => setEventDate(event.target.value)}
                className={inputBase}
              />
            </Field>
          </div>
        </fieldset>
      </Reveal>

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
    <div className="flex flex-col items-start justify-center gap-5 p-8 md:p-10">
      <p className="max-w-prose font-display text-display-sm font-light text-ink">
        The form did not load.
      </p>
      <p className="max-w-prose font-sans text-body text-stone-deep">
        It may be blocked by your browser or network. Open it directly, or simply
        message us — either reaches the same inbox.
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
