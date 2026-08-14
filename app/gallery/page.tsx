import type { Metadata } from "next";

import { PageHeader } from "@/components/layout/PageHeader";
import { GalleryGrid } from "@/components/sections/GalleryGrid";
import { Reveal, Stagger } from "@/components/motion/Reveal";
import { breadcrumbSchema } from "@/lib/schema";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Weddings We Have Planned",
  description:
    "Weddings, mehndi and haldi, sangeet, engagements and destination events planned by Riwaaya across India.",
  alternates: { canonical: "/gallery" },
  openGraph: {
    title: `Weddings we have planned — ${site.name}`,
    description:
      "Weddings, mehndi and haldi, sangeet, engagements and destination events planned by Riwaaya across India.",
    url: `${site.url}/gallery`,
  },
};

export default function GalleryPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbSchema([
              { name: "Home", path: "/" },
              { name: "Work", path: "/gallery" },
            ]),
          ),
        }}
      />

      <PageHeader
        eyebrow="Gallery"
        title="The work."
        lede="Rooms, courtyards and mornings from weddings and events we have planned. Filter by the kind of function you are thinking about."
        breadcrumb={[
          { label: "Home", href: "/" },
          { label: "Work", href: "/gallery" },
        ]}
      />

      {/*
        Standing copy above the grid.

        The studio panel flagged this page as thin — 255 words, almost all of it
        captions — and a page of pictures with no prose has nothing for a search
        engine to match a question against. It also read abruptly: straight from
        the header into a filter bar. These three paragraphs say what the
        pictures are and what they are not, which is worth saying to a reader
        regardless of what it does for search.
      */}
      <section className="bg-chandni pb-section-sm">
        <div className="shell grid gap-x-16 gap-y-8 lg:grid-cols-12">
          <Stagger className="lg:col-span-7">
            {[
              "Wedding photographs are not a portfolio of designs. What they actually record is whether the day held together — whether the mandap was ready before the guests arrived, whether the light was still good when the pheras began, whether anyone had to be asked twice for anything.",
              "So this page is grouped by function rather than by style. A mehndi and a reception ask for different things from a room, a schedule and a kitchen, and a family planning one is rarely comparing it against the other.",
              "Filter by the kind of function you are thinking about. If you want to know how a particular one was actually run — the timeline, the vendor list, what it cost — ask, and we will talk you through it properly.",
            ].map((paragraph) => (
              <Reveal
                asChild
                as="p"
                key={paragraph.slice(0, 24)}
                className="mb-6 max-w-prose font-sans text-body text-stone-deep last:mb-0"
              >
                {paragraph}
              </Reveal>
            ))}
          </Stagger>

          <Reveal className="lg:col-span-4 lg:col-start-9">
            <p className="font-sans text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-pista-ink">
              What you are looking at
            </p>
            <ul className="mt-4 flex flex-col">
              {[
                ["Weddings", "Pheras, baraat, reception"],
                ["Mehndi & Haldi", "Daytime functions, courtyards"],
                ["Sangeet", "Staging, sound, rehearsal"],
                ["Engagements", "Smaller rooms, tighter guest lists"],
                ["Destination", "Away from home, team travelling"],
                ["Hospitality", "Desks, rooming, guest movement"],
              ].map(([name, note]) => (
                <li
                  key={name}
                  className="grid gap-x-4 border-t border-ink/12 py-3 sm:grid-cols-[9rem_1fr]"
                >
                  <span className="font-display text-lg font-light text-ink">{name}</span>
                  <span className="font-sans text-micro text-stone-deep">{note}</span>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      <section className="bg-chandni pb-section">
        <GalleryGrid />
      </section>
    </>
  );
}
