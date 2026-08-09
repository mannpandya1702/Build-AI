import type { Metadata } from "next";

import { PageHeader } from "@/components/layout/PageHeader";
import { ImageSlot } from "@/components/media/ImageSlot";
import { Reveal, Stagger } from "@/components/motion/Reveal";
import { Stats } from "@/components/sections/Stats";
import { Button } from "@/components/ui/Button";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { WhatsAppCTA } from "@/components/ui/WhatsAppCTA";
import { principles, story, team } from "@/content/about";
import { breadcrumbSchema } from "@/lib/schema";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "About",
  description:
    "Riwaaya is a ritual-first wedding and events studio. One wedding a week, no vendor commission, and a team that stays with you from the first call to the last car.",
  alternates: { canonical: "/about" },
  openGraph: {
    title: `About — ${site.name}`,
    description:
      "Riwaaya is a ritual-first wedding and events studio in India. One wedding a week, no vendor commission.",
    url: `${site.url}/about`,
  },
};

export default function AboutPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbSchema([
              { name: "Home", path: "/" },
              { name: "About", path: "/about" },
            ]),
          ),
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
            {story.paragraphs.map((paragraph) => (
              <Reveal asChild key={paragraph.slice(0, 24)}>
                <p className="mb-7 max-w-prose font-sans text-body-lg text-stone-deep last:mb-0">
                  {paragraph}
                </p>
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

      <section className="border-y border-ink/10 bg-pista-mist py-section">
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

      <section className="bg-chandni py-section">
        <div className="shell">
          <SectionHeading eyebrow="The team" title="Who you will actually meet.">
            The people in this list are the people on the ground at your
            functions. That is the whole reason we cap the calendar.
          </SectionHeading>

          <Stagger className="mt-14 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
            {team.map((member) => (
              <Reveal asChild key={member.id}>
                <div>
                  <ImageSlot
                    slot={member.imageSlot}
                    alt={member.alt}
                    aspect="1 / 1"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  />
                  <h3 className="mt-5 font-display text-2xl font-light text-ink">
                    {member.name}
                  </h3>
                  <p className="mt-1 font-sans text-micro uppercase tracking-[0.14em] text-stone-deep">
                    {member.role}
                  </p>
                </div>
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
