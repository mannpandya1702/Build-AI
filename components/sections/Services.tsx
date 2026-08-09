import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { ImageSlot } from "@/components/media/ImageSlot";
import { Reveal, Stagger } from "@/components/motion/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { services } from "@/content/services";

/**
 * Six service cards. The image crop is the taak niche — this is one of the two
 * permitted uses of the shape on the home page (the other is the divider above
 * the enquiry section).
 *
 * The whole card is one link, so keyboard users get a single stop per card
 * rather than a title and an arrow.
 */
export function Services() {
  return (
    <section id="services" className="scroll-mt-24 bg-chandni pb-section">
      <div className="shell">
        <SectionHeading eyebrow="What we do" title="Six ways in.">
          Every one of them starts with the same conversation about your family.
          What changes is the scale.
        </SectionHeading>

        <Stagger className="mt-16 grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <Reveal asChild key={service.slug}>
              <article>
                <Link
                  href={`/services/${service.slug}`}
                  className="group/slot block transition-transform duration-[400ms] ease-riwaaya hover:-translate-y-1.5"
                >
                  <ImageSlot
                    slot={`service-${service.slug}-card`}
                    alt={`${service.title} — ${service.summary}`}
                    aspect="4 / 5"
                    taak
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />

                  <div className="mt-6 flex items-start justify-between gap-4">
                    <div className="flex flex-col gap-2">
                      <h3 className="font-display text-display-sm font-light text-ink transition-colors duration-[250ms] ease-riwaaya group-hover/slot:text-pista-ink">
                        {service.title}
                      </h3>
                      <p className="max-w-measure font-sans text-body text-stone-deep">
                        {service.summary}
                      </p>
                    </div>

                    <span
                      aria-hidden
                      className="mt-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-ink/15 text-ink transition-all duration-[400ms] ease-riwaaya group-hover/slot:border-pista-ink group-hover/slot:bg-pista-ink group-hover/slot:text-chandni"
                    >
                      <ArrowUpRight className="h-4 w-4" strokeWidth={1.5} />
                    </span>
                  </div>
                </Link>
              </article>
            </Reveal>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
