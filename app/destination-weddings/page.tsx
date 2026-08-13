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
  coverage,
  destinationDifferences,
  destinationFaqs,
  destinationIntro,
  destinations,
  venueCriteria,
} from "@/content/destinations";
import { breadcrumbSchema, destinationServiceSchema, faqSchema } from "@/lib/schema";
import { site, whatsappHref } from "@/lib/site";

export const metadata: Metadata = {
  title: "Destination Wedding Planner in India",
  description:
    "Riwaaya is a destination wedding planner based in Chandigarh, working across India — venue recce, rooming lists, guest movement, permissions and a team that travels with you.",
  alternates: { canonical: "/destination-weddings" },
  openGraph: {
    title: `Destination wedding planner — ${site.name}`,
    description:
      "Venue recce, rooming lists, guest movement and a team that travels with you. Destination weddings planned end to end, across India.",
    url: `${site.url}/destination-weddings`,
  },
};

export default function DestinationWeddingsPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            breadcrumbSchema([
              { name: "Home", path: "/" },
              { name: "Destination weddings", path: "/destination-weddings" },
            ]),
            destinationServiceSchema(),
            faqSchema(destinationFaqs),
          ]),
        }}
      />

      <PageHeader
        eyebrow={destinationIntro.eyebrow}
        title={destinationIntro.title}
        lede={destinationIntro.lede}
        breadcrumb={[
          { label: "Home", href: "/" },
          { label: "Destination weddings", href: "/destination-weddings" },
        ]}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button href="#where" size="lg" variant="outline">
            See the destinations
          </Button>
          <WhatsAppCTA
            variant="inline"
            message="Hi Riwaaya, we are considering a destination wedding."
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
            {destinationIntro.paragraphs.map((paragraph) => (
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
              slot="destination-hero"
              alt="A palace courtyard laid out for a wedding function at dusk."
              aspect="4 / 5"
              taak
              parallax
              sizes="(max-width: 1024px) 100vw, 40vw"
            />
          </Reveal>
        </div>
      </section>

      {/*
        The destinations themselves. An alternating editorial list rather than a
        card grid: six equal cards read as a catalogue, and these are meant to
        read as considered recommendations with real trade-offs in them.
      */}
      <section id="where" className="scroll-mt-24 border-t border-ink/10 bg-pista-mist py-section">
        <div className="shell">
          {/* Reworded 13 Aug 2026. This previously read "Six we know properly.
              Not a list of everywhere in India." — the studio corrected that:
              they work pan-India. The six long entries are now framed as the
              destinations asked for most, with the full list below them. */}
          <SectionHeading eyebrow="Where we work" title="Asked for most often.">
            We plan weddings across India. These six come up in nearly every
            conversation, so they are written out properly — season, travel, and
            the trade-off nobody mentions in the brochure.
          </SectionHeading>

          <Stagger as="ol" className="mt-16 flex flex-col gap-16 md:gap-24">
            {destinations.map((destination, index) => {
              const flipped = index % 2 === 1;

              return (
                <Reveal asChild as="li" key={destination.id}>
                  <article className="grid items-center gap-8 md:grid-cols-12 md:gap-12">
                    <div
                      className={
                        flipped
                          ? "md:col-span-6 md:col-start-7 md:row-start-1"
                          : "md:col-span-6"
                      }
                    >
                      <ImageSlot
                        slot={destination.imageSlot}
                        alt={destination.alt}
                        aspect="4 / 3"
                        parallax
                        sizes="(max-width: 768px) 100vw, 45vw"
                      />
                    </div>

                    <div
                      className={
                        flipped
                          ? "md:col-span-5 md:col-start-1 md:row-start-1"
                          : "md:col-span-5 md:col-start-8"
                      }
                    >
                      <p className="font-sans text-eyebrow font-semibold uppercase text-pista-ink">
                        {destination.region}
                      </p>
                      <h3 className="mt-3 font-display text-display-sm font-light text-ink">
                        {destination.name}
                      </h3>
                      <p className="mt-3 font-display text-xl font-light italic text-stone-deep">
                        {destination.blurb}
                      </p>
                      <p className="mt-5 max-w-measure font-sans text-body text-stone-deep">
                        {destination.body}
                      </p>

                      <dl className="mt-7 grid gap-x-6 gap-y-4 border-t border-ink/15 pt-5 sm:grid-cols-2">
                        <div>
                          <dt className="font-sans text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-pista-ink">
                            Season
                          </dt>
                          <dd className="mt-1.5 font-sans text-micro text-ink">
                            {destination.season}
                          </dd>
                        </div>
                        <div>
                          <dt className="font-sans text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-pista-ink">
                            Getting there
                          </dt>
                          <dd className="mt-1.5 font-sans text-micro text-ink">
                            {destination.travel}
                          </dd>
                        </div>
                      </dl>
                    </div>
                  </article>
                </Reveal>
              );
            })}
          </Stagger>

        </div>
      </section>

      {/*
        Full India coverage. Added 13 Aug 2026 — the studio works pan-India and
        asked for the city list a competitor runs as a mega-menu, domestic only.
        Rendered as four grouped columns rather than one long alphabetical list
        so it stays readable, and every city links into the matching region on
        /wedding-venues rather than to a page of its own: eighteen near-identical
        city pages with no real venue content is the pattern search engines
        demote. When there are real venues to name for a city, it graduates to
        its own page.
      */}
      <section className="border-t border-ink/10 bg-chandni py-section">
        <div className="shell">
          <SectionHeading eyebrow="Full coverage" title={coverage.title}>
            {coverage.lede}
          </SectionHeading>

          <Stagger className="mt-14 grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
            {coverage.groups.map((group) => (
              <Reveal asChild key={group.id}>
                <div className="border-t border-ink/15 pt-6">
                  <h3 className="font-display text-2xl font-light text-ink">{group.title}</h3>
                  <p className="mt-2 font-sans text-micro text-stone-deep">{group.note}</p>

                  <ul className="mt-5 flex flex-col gap-2.5">
                    {group.cities.map((city) => (
                      <li key={city.name}>
                        <Link
                          href={`/wedding-venues#${city.venueAnchor}`}
                          className="sweep-underline font-sans text-body text-ink transition-colors duration-[250ms] ease-riwaaya hover:text-pista-ink"
                        >
                          {city.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            ))}
          </Stagger>

          <Reveal className="mt-14">
            <p className="max-w-prose font-sans text-body text-stone-deep">
              Somewhere else in mind? Tell us where and we will say plainly
              whether we can staff it properly.{" "}
              <a
                href={whatsappHref("Hi Riwaaya, we are looking at a destination outside your list.")}
                target="_blank"
                rel="noopener noreferrer"
                className="sweep-underline font-semibold text-pista-ink"
              >
                Ask on WhatsApp
              </a>
            </p>
          </Reveal>
        </div>
      </section>

      {/* What actually differs, on a dark band to break the page up. */}
      <section className="bg-ink py-section">
        <div className="shell">
          <SectionHeading
            eyebrow="What changes"
            title="The wedding stays the same. The scaffolding does not."
            tone="chandni"
          >
            Six things a destination adds to the job. None of them are visible
            on the day, which is the point of doing them well.
          </SectionHeading>

          <Stagger as="ul" className="mt-14 grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {destinationDifferences.map((item, index) => (
              <Reveal asChild as="li" key={item.id}>
                <div className="border-t border-chandni/20 pt-6">
                  <span className="font-display text-lg font-light text-sona">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h3 className="mt-3 font-display text-2xl font-light text-chandni">
                    {item.title}
                  </h3>
                  <p className="mt-3 font-sans text-body text-chandni/70">{item.body}</p>
                </div>
              </Reveal>
            ))}
          </Stagger>
        </div>
      </section>

      {/* How a venue gets chosen. */}
      <section className="bg-chandni py-section">
        <div className="shell grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-4">
            <SectionHeading eyebrow="Choosing a venue" title="Six questions, in this order.">
              A venue is signed off against these before it is shown to you with
              a photograph attached.
            </SectionHeading>
          </div>

          <Stagger as="ol" className="lg:col-span-8">
            {venueCriteria.map((criterion, index) => (
              <Reveal asChild as="li" key={criterion.id}>
                <div className="grid gap-x-8 gap-y-2 border-b border-ink/12 py-7 first:border-t sm:grid-cols-[3rem_1fr]">
                  <span className="font-display text-2xl font-light text-pista-deep">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h3 className="font-display text-2xl font-light text-ink">
                      {criterion.title}
                    </h3>
                    <p className="mt-2 max-w-prose font-sans text-body text-stone-deep">
                      {criterion.body}
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
          </Stagger>

          {/* The bridge the studio asked for: destinations → venues. */}
          <Reveal className="lg:col-span-12">
            <p className="max-w-prose font-sans text-body text-stone-deep">
              What the venues are actually like in each region — types, guest
              ranges and the constraint that decides most of them — is set out
              on the{" "}
              <Link href="/wedding-venues" className="sweep-underline font-semibold text-pista-ink">
                wedding venues page
              </Link>
              .
            </p>
          </Reveal>
        </div>
      </section>

      <section className="border-t border-ink/10 bg-pista-mist py-section">
        <div className="shell grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-4">
            <SectionHeading eyebrow="Questions" title="Asked before every destination.">
              The general questions are answered on the home page. These are the
              ones that only come up when the wedding travels.
            </SectionHeading>
          </div>

          <Reveal className="lg:col-span-8">
            <Accordion items={destinationFaqs} />
          </Reveal>
        </div>
      </section>

      <section className="bg-chandni py-section">
        <div className="shell">
          <SectionHeading
            align="center"
            eyebrow="Next"
            title="Tell us the guest count first."
            className="mx-auto"
          >
            It decides more than the destination does. Send us a rough number
            and a month, and we will come back with three places that work.
          </SectionHeading>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button href="/contact" size="lg">
              Start an enquiry
            </Button>
            <WhatsAppCTA
              variant="inline"
              message="Hi Riwaaya, we are planning a destination wedding."
            />
          </div>
        </div>
      </section>
    </>
  );
}
