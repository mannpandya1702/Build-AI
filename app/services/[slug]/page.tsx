import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/layout/PageHeader";
import { ImageSlot } from "@/components/media/ImageSlot";
import { Reveal, Stagger } from "@/components/motion/Reveal";
import { Enquiry } from "@/components/sections/Enquiry";
import { Button } from "@/components/ui/Button";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { WhatsAppCTA } from "@/components/ui/WhatsAppCTA";
import { getService, services } from "@/content/services";
import { breadcrumbSchema, eventSchema } from "@/lib/schema";
import { site } from "@/lib/site";

/** Every service is known at build time — prerender all of them. */
export function generateStaticParams() {
  return services.map((service) => ({ slug: service.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const service = getService(slug);

  if (!service) return { title: "Not found" };

  return {
    title: service.title,
    description: service.summary,
    alternates: { canonical: `/services/${service.slug}` },
    openGraph: {
      title: `${service.title} — ${site.name}`,
      description: service.summary,
      url: `${site.url}/services/${service.slug}`,
      type: "article",
    },
  };
}

export default async function ServicePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const service = getService(slug);

  if (!service) notFound();

  const others = services.filter((item) => item.slug !== service.slug);
  const schema = eventSchema(service.slug);

  return (
    <>
      {schema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      )}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbSchema([
              { name: "Home", path: "/" },
              { name: service.title, path: `/services/${service.slug}` },
            ]),
          ),
        }}
      />

      <PageHeader
        eyebrow="Service"
        title={service.title}
        lede={service.intro}
        breadcrumb={[
          { label: "Home", href: "/" },
          { label: service.title, href: `/services/${service.slug}` },
        ]}
      >
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button href="#enquiry" size="lg">
            Enquire about {service.title.toLowerCase()}
          </Button>
          {/* Prefill names this service, so the first WhatsApp line is specific. */}
          <WhatsAppCTA variant="inline" message={service.whatsappPrefill} />
        </div>
      </PageHeader>

      <section className="bg-chandni pb-section-sm">
        <div className="shell">
          <Reveal>
            <ImageSlot
              slot={service.imageSlot}
              alt={`${service.title} planned by Riwaaya.`}
              aspect={service.heroAspect}
              parallax
              sizes="(max-width: 1024px) 100vw, 1200px"
            />
          </Reveal>
        </div>
      </section>

      <section className="bg-chandni pb-section">
        <div className="shell grid gap-14 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-5">
            <SectionHeading eyebrow="What is included" title="The work itself." />
          </div>

          {/* Stagger renders the <ul> itself and each Reveal renders an <li>,
              so no wrapper div ever lands between them and the list keeps its
              semantics for screen readers. */}
          <Stagger
            as="ul"
            className="divide-y divide-ink/10 border-y border-ink/10 lg:col-span-7"
          >
            {service.includes.map((item) => (
              <Reveal asChild as="li" key={item} className="py-5 font-sans text-body-lg text-ink">
                {item}
              </Reveal>
            ))}
          </Stagger>
        </div>
      </section>

      <section className="border-y border-ink/10 bg-pista-mist py-section-sm">
        <div className="shell grid gap-12 md:grid-cols-2 md:gap-16">
          {service.notes.map((note) => (
            <Reveal key={note.heading}>
              <h2 className="font-display text-display-sm font-light text-ink">
                {note.heading}
              </h2>
              <p className="mt-4 max-w-measure font-sans text-body-lg text-stone-deep">
                {note.body}
              </p>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="bg-chandni py-section-sm">
        <div className="shell">
          <SectionHeading eyebrow="Also" title="Other things we plan." />

          <Stagger className="mt-12 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-5">
            {others.map((other) => (
              <Reveal asChild key={other.slug}>
                <Link
                  href={`/services/${other.slug}`}
                  className="group/slot flex flex-col gap-3 border-t border-ink/15 pt-5 transition-colors duration-[250ms] ease-riwaaya hover:border-pista-deep"
                >
                  <h3 className="font-display text-2xl font-light text-ink transition-colors duration-[250ms] ease-riwaaya group-hover/slot:text-pista-ink">
                    {other.title}
                  </h3>
                  <p className="font-sans text-micro text-stone-deep">{other.summary}</p>
                </Link>
              </Reveal>
            ))}
          </Stagger>
        </div>
      </section>

      <Enquiry />
    </>
  );
}
