import type { Metadata } from "next";
import Link from "next/link";

import { PageHeader } from "@/components/layout/PageHeader";
import { ImageSlot } from "@/components/media/ImageSlot";
import { Reveal, Stagger } from "@/components/motion/Reveal";
import { Accordion } from "@/components/ui/Accordion";
import { Button } from "@/components/ui/Button";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { WhatsAppCTA } from "@/components/ui/WhatsAppCTA";
import {
  venueFaqs,
  venueIntro,
  venueProcess,
  venueRegions,
  venueTypes,
} from "@/content/venues";
import { breadcrumbSchema, faqSchema, venueServiceSchema } from "@/lib/schema";
import { site, whatsappHref } from "@/lib/site";

/**
 * /wedding-venues — the venue hub, linked from the destinations page.
 *
 * The route is /wedding-venues rather than /venues on purpose: it is the phrase
 * families actually search, and the URL is one of the few places a keyword
 * still carries weight without making the visible copy read like SEO filler.
 */
export const metadata: Metadata = {
  title: "Wedding Venues Across India",
  description:
    "How a destination wedding planner reads a venue: rooms before capacity, kitchen covers, service access, wet-weather plan. Venue types across India.",
  alternates: { canonical: "/wedding-venues" },
  openGraph: {
    title: `Wedding venues — ${site.name}`,
    description:
      "Venue types and regions across India, and the questions we ask of a property before it reaches your shortlist.",
    url: `${site.url}/wedding-venues`,
  },
};

export default function WeddingVenuesPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            breadcrumbSchema([
              { name: "Home", path: "/" },
              { name: "Wedding venues", path: "/wedding-venues" },
            ]),
            venueServiceSchema(),
            faqSchema(venueFaqs),
          ]),
        }}
      />

      <PageHeader
        eyebrow={venueIntro.eyebrow}
        title={venueIntro.title}
        lede={venueIntro.lede}
        breadcrumb={[
          { label: "Home", href: "/" },
          { label: "Wedding venues", href: "/wedding-venues" },
        ]}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button href="#regions" size="lg" variant="outline">
            Venues by region
          </Button>
          <WhatsAppCTA
            variant="inline"
            message="Hi Riwaaya, we are looking for a wedding venue."
          />
        </div>
      </PageHeader>

      {/* Opening statement. Taak crop — first of two on this page. */}
      <section className="bg-chandni pb-section">
        <div className="shell grid gap-14 lg:grid-cols-12 lg:gap-16">
          <Stagger className="lg:col-span-7">
            {/* as="p" rather than a <p> nested inside Reveal: Reveal renders
                its own element, so nesting made every paragraph the only child
                of its own wrapper — which meant `last:mb-0` matched all of them
                and the intro ran together as one unbroken block. */}
            {venueIntro.paragraphs.map((paragraph) => (
              <Reveal
                asChild
                as="p"
                key={paragraph.slice(0, 24)}
                className="mb-7 max-w-prose font-sans text-body-lg text-stone-deep last:mb-0"
              >
                {paragraph}
              </Reveal>
            ))}
          </Stagger>

          <Reveal className="lg:col-span-5">
            <ImageSlot
              slot="venue-hero"
              alt="A haveli courtyard laid out for a wedding function."
              aspect="4 / 5"
              taak
              parallax
              sizes="(max-width: 1024px) 100vw, 40vw"
            />
          </Reveal>
        </div>
      </section>

      {/*
        Venue types. A two-column list rather than cards — each entry carries a
        guest range and a named failure mode, which is more text than a card
        holds without turning into a wall.
      */}
      <section className="border-y border-ink/10 bg-pista-mist py-section">
        <div className="shell">
          <SectionHeading eyebrow="What you are choosing between" title="Six kinds of venue.">
            Every one of these can hold a beautiful wedding. They fail in
            different ways, which is the part worth knowing before you visit.
          </SectionHeading>

          <Stagger as="ul" className="mt-14 grid gap-x-12 gap-y-12 md:grid-cols-2">
            {venueTypes.map((type) => (
              <Reveal asChild as="li" key={type.id}>
                <div className="border-t border-ink/15 pt-6">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                    <h3 className="font-display text-2xl font-light text-ink md:text-[1.75rem]">
                      {type.title}
                    </h3>
                    <p className="font-sans text-micro uppercase tracking-[0.14em] text-sona-deep">
                      {type.guests}
                    </p>
                  </div>

                  <p className="mt-4 max-w-measure font-sans text-body text-stone-deep">
                    {type.body}
                  </p>
                  <p className="mt-4 max-w-measure border-l border-pista-deep pl-4 font-sans text-micro text-ink/75">
                    <span className="font-semibold uppercase tracking-[0.14em] text-pista-ink">
                      Watch{" "}
                    </span>
                    {type.watch}
                  </p>
                </div>
              </Reveal>
            ))}
          </Stagger>
        </div>
      </section>

      {/*
        Regions. Anchor ids match `venueAnchor` in content/destinations.ts, so a
        city on the destinations page links straight into its section here.
      */}
      <section id="regions" className="scroll-mt-24 bg-chandni py-section">
        <div className="shell">
          <SectionHeading eyebrow="By region" title="What the venues are actually like.">
            We work across India from Chandigarh. Below is what to expect from
            each region — the shape of a typical wedding there, and the
            constraint that decides most of them.
          </SectionHeading>

          <Stagger as="ol" className="mt-16 flex flex-col gap-16 md:gap-24">
            {venueRegions.map((region, index) => {
              const flipped = index % 2 === 1;

              return (
                <Reveal asChild as="li" key={region.id}>
                  <article id={region.id} className="scroll-mt-28 grid items-center gap-8 md:grid-cols-12 md:gap-12">
                    <div
                      className={
                        flipped
                          ? "md:col-span-6 md:col-start-7 md:row-start-1"
                          : "md:col-span-6"
                      }
                    >
                      <ImageSlot
                        slot={region.imageSlot}
                        alt={region.alt}
                        aspect="4 / 3"
                        parallax
                        sizes="(max-width: 768px) 100vw, 45vw"
                      />
                    </div>

                    <div className={flipped ? "md:col-span-6 md:row-start-1" : "md:col-span-6"}>
                      <h3 className="font-display text-display-sm font-light text-ink">
                        {region.title}
                      </h3>
                      <p className="mt-2 font-sans text-micro uppercase tracking-[0.14em] text-sona-deep">
                        {region.cities}
                      </p>
                      <p className="mt-5 max-w-measure font-sans text-body text-stone-deep">
                        {region.body}
                      </p>

                      <dl className="mt-7 flex flex-col gap-3">
                        {region.notes.map((note) => (
                          <div
                            key={note.label}
                            className="grid gap-1 border-t border-ink/12 pt-3 sm:grid-cols-[7rem_1fr] sm:gap-4"
                          >
                            <dt className="font-sans text-micro uppercase tracking-[0.14em] text-pista-ink">
                              {note.label}
                            </dt>
                            <dd className="font-sans text-micro text-stone-deep">{note.value}</dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                  </article>
                </Reveal>
              );
            })}
          </Stagger>
        </div>
      </section>

      {/* How the shortlist gets built. Dark band, gold numerals — the one
          moment of gold on this page outside the eyebrow rules. */}
      <section className="border-y border-ink/10 bg-ink py-section">
        <div className="shell">
          <SectionHeading
            eyebrow="How we shortlist"
            title="Four steps to a signed venue."
            tone="chandni"
          />

          <Stagger as="ol" className="mt-14 grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
            {venueProcess.map((step) => (
              <Reveal asChild as="li" key={step.id}>
                <div className="border-t border-chandni/25 pt-6">
                  <p className="font-display text-3xl font-light text-sona">{step.index}</p>
                  <h3 className="mt-4 font-display text-2xl font-light text-chandni">
                    {step.title}
                  </h3>
                  <p className="mt-3 font-sans text-micro text-chandni/70">{step.body}</p>
                </div>
              </Reveal>
            ))}
          </Stagger>
        </div>
      </section>

      <section className="bg-chandni py-section">
        <div className="shell grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-4">
            <SectionHeading eyebrow="Venue questions" title="Asked most often." />
          </div>
          <div className="lg:col-span-8">
            <Accordion items={venueFaqs} />
          </div>
        </div>
      </section>

      <section className="border-t border-ink/10 bg-pista-mist py-section">
        <div className="shell">
          <SectionHeading
            align="center"
            eyebrow="Next"
            title="Tell us the guest count first."
            className="mx-auto"
          >
            That one number rules out most of the shortlist, and it is the
            fastest way for us to be useful to you.
          </SectionHeading>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button href="/contact" size="lg">
              Start an enquiry
            </Button>
            <Button
              href={whatsappHref("Hi Riwaaya, we are looking for a wedding venue.")}
              size="lg"
              variant="outline"
            >
              Ask on WhatsApp
            </Button>
          </div>

          <p className="mt-8 text-center font-sans text-micro text-stone-deep">
            Planning away from home?{" "}
            <Link href="/destination-weddings" className="sweep-underline text-pista-ink">
              See how a destination wedding differs
            </Link>
            .
          </p>
        </div>
      </section>
    </>
  );
}
