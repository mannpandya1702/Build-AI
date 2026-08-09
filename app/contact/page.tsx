import type { Metadata } from "next";
import { Mail, MapPin, Phone } from "lucide-react";

import { PageHeader } from "@/components/layout/PageHeader";
import { Reveal, Stagger } from "@/components/motion/Reveal";
import { EnquiryForm } from "@/components/sections/EnquiryForm";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { WhatsAppCTA } from "@/components/ui/WhatsAppCTA";
import { breadcrumbSchema } from "@/lib/schema";
import { WHATSAPP_DISPLAY, site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Message Riwaaya on WhatsApp or send an enquiry. We read every enquiry ourselves and reply within a day.",
  alternates: { canonical: "/contact" },
  openGraph: {
    title: `Contact — ${site.name}`,
    description: "Message Riwaaya on WhatsApp or send an enquiry.",
    url: `${site.url}/contact`,
  },
};

/** Coordinates come from lib/site.ts — update them there, not here. */
const mapSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${
  site.geo.lng - 0.02
}%2C${site.geo.lat - 0.012}%2C${site.geo.lng + 0.02}%2C${
  site.geo.lat + 0.012
}&layer=mapnik&marker=${site.geo.lat}%2C${site.geo.lng}`;

export default function ContactPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbSchema([
              { name: "Home", path: "/" },
              { name: "Contact", path: "/contact" },
            ]),
          ),
        }}
      />

      <PageHeader
        eyebrow="Contact"
        title="Say hello."
        lede="WhatsApp is fastest — we usually reply the same day. If you would rather write it all down, the enquiry form is below."
        breadcrumb={[
          { label: "Home", href: "/" },
          { label: "Contact", href: "/contact" },
        ]}
      >
        <div className="mt-4">
          <WhatsAppCTA variant="inline" />
        </div>
      </PageHeader>

      <section className="bg-chandni pb-section-sm">
        <div className="shell">
          <Stagger className="grid gap-10 border-y border-ink/10 py-12 md:grid-cols-3">
            <Reveal asChild>
              <div className="flex flex-col gap-3">
                <Phone aria-hidden className="h-5 w-5 text-pista-ink" strokeWidth={1.5} />
                <h2 className="font-sans text-eyebrow font-semibold uppercase text-stone-deep">
                  WhatsApp & phone
                </h2>
                <a
                  href={`tel:+${WHATSAPP_DISPLAY.replace(/\D/g, "")}`}
                  className="sweep-underline font-display text-2xl font-light text-ink"
                >
                  {WHATSAPP_DISPLAY}
                </a>
              </div>
            </Reveal>

            <Reveal asChild>
              <div className="flex flex-col gap-3">
                <Mail aria-hidden className="h-5 w-5 text-pista-ink" strokeWidth={1.5} />
                <h2 className="font-sans text-eyebrow font-semibold uppercase text-stone-deep">
                  Email
                </h2>
                <a
                  href={`mailto:${site.email}`}
                  className="sweep-underline font-display text-2xl font-light text-ink"
                >
                  {site.email}
                </a>
              </div>
            </Reveal>

            <Reveal asChild>
              <div className="flex flex-col gap-3">
                <MapPin aria-hidden className="h-5 w-5 text-pista-ink" strokeWidth={1.5} />
                <h2 className="font-sans text-eyebrow font-semibold uppercase text-stone-deep">
                  Studio
                </h2>
                <address className="font-display text-2xl font-light not-italic text-ink">
                  {site.address.locality}, {site.address.region}
                </address>
                <p className="font-sans text-micro text-stone-deep">
                  Working across {site.cities.join(", ")}.
                </p>
              </div>
            </Reveal>
          </Stagger>
        </div>
      </section>

      <section id="enquiry" className="scroll-mt-24 bg-pista-mist py-section">
        <div className="shell">
          <div className="max-w-3xl">
            <SectionHeading eyebrow="Enquire" title="Tell us about your riwaayat.">
              A few questions to start. We read every enquiry ourselves and reply
              within a day.
            </SectionHeading>
          </div>

          <EnquiryForm />
        </div>
      </section>

      <section className="bg-chandni py-section-sm">
        <div className="shell">
          <SectionHeading eyebrow="Find us" title="Where we are." />

          <Reveal className="mt-10">
            <div className="overflow-hidden rounded-sm border border-ink/10">
              <iframe
                src={mapSrc}
                title={`Map showing Riwaaya's studio in ${site.address.locality}`}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="h-[380px] w-full border-0 md:h-[460px]"
              />
            </div>
          </Reveal>

          <Reveal className="mt-6">
            <p className="font-sans text-micro text-stone-deep">
              Visits are by appointment. Message us and we will find a time.
            </p>
          </Reveal>
        </div>
      </section>
    </>
  );
}
