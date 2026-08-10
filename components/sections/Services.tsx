import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { Reveal, Stagger } from "@/components/motion/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { functions, pillars, services } from "@/content/services";

/**
 * The eleven lines of work, as a numbered index rather than a card grid.
 *
 * This follows the studio's own website draft: a numbered list, one line per
 * service, grouped by pillar. Eleven photo cards would bury the point — the
 * offering is one full-service engagement, not a menu to pick from.
 */
export function Services() {
  return (
    <section id="services" className="scroll-mt-24 bg-chandni pb-section">
      <div className="shell">
        <SectionHeading eyebrow="What we do" title="Eleven lines of work.">
          One engagement covers the wedding whole — from the first roadmap to the
          final payment sheet. Each line below is contracted, not implied.
        </SectionHeading>

        <div className="mt-16 grid gap-12 lg:grid-cols-12 lg:gap-16">
          {/* The four pillars are the reading key for the list. Sticky on
              desktop so they stay beside whichever line you are reading,
              instead of leaving a column of dead space below them. */}
          <Stagger className="flex flex-col gap-8 lg:col-span-4 lg:sticky lg:top-28 lg:self-start">
            {pillars.map((pillar) => (
              <Reveal asChild key={pillar.name}>
                <div className="border-t border-ink/15 pt-5">
                  <div className="flex items-baseline gap-3">
                    <h3 className="font-display text-2xl font-light text-ink">
                      {pillar.name}
                    </h3>
                    <span className="font-sans text-[0.6875rem] uppercase tracking-[0.2em] text-pista-ink">
                      {pillar.label}
                    </span>
                  </div>
                  <p className="mt-2 max-w-measure font-sans text-micro text-stone-deep">
                    {pillar.body}
                  </p>
                </div>
              </Reveal>
            ))}
          </Stagger>

          <Stagger as="ol" className="lg:col-span-8" stagger={0.05}>
            {services.map((service) => (
              <Reveal asChild as="li" key={service.slug}>
                <Link
                  href={`/services/${service.slug}`}
                  className="group flex items-baseline gap-5 border-t border-ink/12 py-5 transition-colors duration-[250ms] ease-riwaaya hover:bg-pista-mist md:gap-8 md:px-3"
                >
                  <span className="w-7 shrink-0 font-display text-lg font-light text-pista-ink">
                    {service.index}
                  </span>

                  <span className="flex flex-1 flex-col gap-1">
                    <span className="font-display text-2xl font-light text-ink md:text-[1.75rem]">
                      {service.title}
                    </span>
                    <span className="font-sans text-micro text-stone-deep">
                      {service.summary}
                    </span>
                  </span>

                  <ArrowUpRight
                    aria-hidden
                    className="mt-1 h-4 w-4 shrink-0 text-stone-deep opacity-0 transition-all duration-[250ms] ease-riwaaya group-hover:opacity-100 group-focus-visible:opacity-100"
                    strokeWidth={1.5}
                  />
                </Link>
              </Reveal>
            ))}
          </Stagger>
        </div>

        {/* The functions families actually name, without pretending they are
            separate products. */}
        <Reveal className="mt-14 border-t border-ink/12 pt-8">
          <p className="font-sans text-micro text-stone-deep">
            <span className="font-semibold uppercase tracking-[0.2em] text-pista-ink">
              Functions we plan
            </span>
            <span className="mt-3 block font-display text-2xl font-light text-ink">
              {functions.join(" · ")}
            </span>
          </p>
        </Reveal>
      </div>
    </section>
  );
}
