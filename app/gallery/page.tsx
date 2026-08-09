import type { Metadata } from "next";

import { PageHeader } from "@/components/layout/PageHeader";
import { GalleryGrid } from "@/components/sections/GalleryGrid";
import { breadcrumbSchema } from "@/lib/schema";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Work",
  description:
    "Weddings, mehndi and haldi, sangeet, engagements and destination events planned by Riwaaya across India.",
  alternates: { canonical: "/gallery" },
  openGraph: {
    title: `Work — ${site.name}`,
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

      <section className="bg-chandni pb-section">
        <GalleryGrid />
      </section>
    </>
  );
}
