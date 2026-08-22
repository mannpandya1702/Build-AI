import type { Metadata } from "next";

import { PageHeader } from "@/components/layout/PageHeader";
import { ImageSlot } from "@/components/media/ImageSlot";
import { Reveal, Stagger } from "@/components/motion/Reveal";
import { Stats } from "@/components/sections/Stats";
import { Button } from "@/components/ui/Button";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { WhatsAppCTA } from "@/components/ui/WhatsAppCTA";
import { departments, founder, isIsNot, principles, story } from "@/content/about";
import { breadcrumbSchema, founderSchema, webPageSchema } from "@/lib/schema";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "About — Luxury Wedding Planner in Chandigarh",
  description:
    "Bhumi Sandhu founded Riwaaya, a ritual-first luxury wedding planner in Chandigarh. One wedding on the ground at a time, and the founder beside you throughout.",
  alternates: { canonical: "/about" },
  openGraph: {
    title: `About — ${site.name}`,
    description:
      "Bhumi Sandhu founded Riwaaya, a ritual-first luxury wedding planner in Chandigarh working across India.",
    url: `${site.url}/about`,
  },
};

export default function AboutPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            breadcrumbSchema([
              { name: "Home", path: "/" },
              { name: "About", path: "/about" },
            ]),
            founderSchema(),
            webPageSchema(
              "AboutPage",
              "About Riwaaya",
              "/about",
              "The riwaayat thesis, the four pillars, and founder Bhumi Sandhu.",
            ),
          ]),
        }}
      />

      <PageHeader
        eyebrow="About"
        title="One family's version of it."
        lede={story.lede}
        breadcrumb={[
          { label: "Home", href: "/" },
          { label: "About", href: "/about" },
        ]}
      />

      <section className="bg-chandni pb-section">
        <div className="shell grid gap-14 lg:grid-cols-12 lg:gap-16">
          <Stagger className="lg:col-span-7">
            {/* as="p" rather than a <p> nested inside Reveal: Reveal renders
                its own element, so nesting made every paragraph the only child
                of its own wrapper — which meant `last:mb-0` matched all of them
                and the intro ran together as one unbroken block. */}
            {story.paragraphs.map((paragraph) => (
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
              slot="about-studio-portrait"
              alt="The Riwaaya team at work in the studio."
              aspect="4 / 5"
              taak
              parallax
              sizes="(max-width: 1024px) 100vw, 40vw"
            />
          </Reveal>
        </div>
      </section>

      {/* The deck's is / is not list. Two columns that read across, so each
          promise sits directly opposite what it rules out. */}
      <section className="border-y border-ink/10 bg-ink py-section">
        <div className="shell">
          <SectionHeading eyebrow="Plainly" title="What we are, and are not." tone="chandni" />

          <Stagger className="mt-14 flex flex-col">
            <div className="grid grid-cols-2 gap-8 border-b border-chandni/20 pb-4">
              <p className="font-sans text-[0.6875rem] font-semibold uppercase tracking-[0.2em] text-pista">
                Riwaaya is
              </p>
              <p className="font-sans text-[0.6875rem] font-semibold uppercase tracking-[0.2em] text-chandni/50">
                Riwaaya is not
              </p>
            </div>

            {isIsNot.map((row) => (
              <Reveal asChild key={row.is}>
                <div className="grid grid-cols-2 gap-8 border-b border-chandni/15 py-6">
                  <p className="font-display text-xl font-light text-chandni md:text-2xl">
                    {row.is}
                  </p>
                  <p className="font-sans text-body text-chandni/60">{row.isNot}</p>
                </div>
              </Reveal>
            ))}
          </Stagger>
        </div>
      </section>

      <section className="border-b border-ink/10 bg-pista-mist py-section">
        <div className="shell">
          <SectionHeading eyebrow="Philosophy" title="Four things we hold to." />

          <Stagger className="mt-14 grid gap-x-8 gap-y-12 sm:grid-cols-2">
            {principles.map((principle) => (
              <Reveal asChild key={principle.id}>
                <div className="border-t border-ink/15 pt-6">
                  <h3 className="font-display text-display-sm font-light text-ink">
                    {principle.title}
                  </h3>
                  <p className="mt-3 max-w-measure font-sans text-body text-stone-deep">
                    {principle.body}
                  </p>
                </div>
              </Reveal>
            ))}
          </Stagger>
        </div>
      </section>

      {/*
        The founder, alone. This replaced a four-up team grid on 13 Aug 2026 —
        three of those four were placeholders and the studio asked for the
        founder only. A single square headshot in a 4-column grid looked like a
        mistake, so the section is rebuilt as a portrait-and-prose spread: a
        taller 4:5 crop beside the story, which is what one person's page wants.
      */}
      <section id="founder" className="scroll-mt-24 bg-chandni py-section">
        <div className="shell">
          <SectionHeading eyebrow="The founder" title="Who you will actually meet.">
            {founder.lede}
          </SectionHeading>

          <div className="mt-14 grid items-start gap-12 lg:grid-cols-12 lg:gap-16">
            {/* 4 columns, not 5: at 5 the 4:5 crop runs about 200px past the
                bottom of the prose beside it and the row reads unbalanced. */}
            <Reveal className="lg:col-span-4">
              <ImageSlot
                slot={founder.imageSlot}
                alt={founder.alt}
                aspect="4 / 5"
                taak
                sizes="(max-width: 1024px) 100vw, 32vw"
              />
            </Reveal>

            <Stagger className="lg:col-span-8">
              <Reveal asChild>
                <h3 className="font-display text-display-sm font-light text-ink">
                  {founder.name}
                </h3>
              </Reveal>
              <Reveal asChild>
                <p className="mt-2 font-sans text-micro uppercase tracking-[0.14em] text-sona-deep">
                  {founder.role}
                </p>
              </Reveal>

              {founder.paragraphs.map((paragraph) => (
                <Reveal asChild key={paragraph.slice(0, 24)}>
                  <p className="mt-7 max-w-prose font-sans text-body-lg text-stone-deep">
                    {paragraph}
                  </p>
                </Reveal>
              ))}
            </Stagger>
          </div>
        </div>
      </section>

      {/* The eight on-site departments, from the scope of work. */}
      <section className="bg-chandni pb-section">
        <div className="shell">
          <SectionHeading eyebrow="On the day" title="Eight departments.">
            The on-ground team is organised into these, so every part of the day
            has someone whose job it is.
          </SectionHeading>

          <Stagger as="ul" className="mt-12 grid gap-x-8 sm:grid-cols-2 lg:grid-cols-4">
            {departments.map((department, index) => (
              <Reveal
                asChild
                as="li"
                key={department}
                className="flex items-baseline gap-4 border-t border-ink/12 py-4"
              >
                <>
                  <span className="font-display text-lg font-light text-pista-ink">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="font-sans text-body text-ink">{department}</span>
                </>
              </Reveal>
            ))}
          </Stagger>
        </div>
      </section>

      <Stats />

      <section className="bg-chandni py-section">
        <div className="shell">
          <SectionHeading
            align="center"
            eyebrow="Next"
            title="Tell us what your family does."
            className="mx-auto"
          >
            That conversation is most of the first meeting, and it is free.
          </SectionHeading>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button href="/contact" size="lg">
              Start an enquiry
            </Button>
            <WhatsAppCTA variant="inline" />
          </div>
        </div>
      </section>
    </>
  );
}
