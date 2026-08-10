import Link from "next/link";

import { Wordmark } from "@/components/brand/Wordmark";
import { Reveal, Stagger } from "@/components/motion/Reveal";
import { WhatsAppCTA } from "@/components/ui/WhatsAppCTA";
import { services } from "@/content/services";
import { WHATSAPP_DISPLAY, nav, site } from "@/lib/site";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-ink text-chandni">
      <div className="shell py-section-sm">
        <Stagger className="grid gap-12 border-b border-chandni/15 pb-14 md:grid-cols-12 md:gap-8">
          <Reveal asChild className="md:col-span-4">
            <div className="flex flex-col gap-6">
              {/* The deck's stacked signature lockup — the one place the full
                  "by Bhumi Sandhu" line belongs. */}
              <Wordmark size="lg" tone="chandni" signature />
              <p className="max-w-measure font-sans text-body text-chandni/70">
                {site.tagline}
              </p>
              <WhatsAppCTA variant="inline" tone="chandni" className="w-fit" />
            </div>
          </Reveal>

          <Reveal asChild className="md:col-span-4">
            <nav aria-label="Services">
              <h2 className="mb-5 font-sans text-eyebrow font-semibold uppercase text-pista">
                Eleven lines of work
              </h2>
              {/* Two columns so eleven links do not tower over the others. */}
              <ul className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
                {services.map((service) => (
                  <li key={service.slug}>
                    <Link
                      href={`/services/${service.slug}`}
                      className="sweep-underline font-sans text-micro text-chandni/75 transition-colors duration-[250ms] ease-riwaaya hover:text-chandni"
                    >
                      {service.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </Reveal>

          <Reveal asChild className="md:col-span-2">
            <nav aria-label="Footer">
              <h2 className="mb-5 font-sans text-eyebrow font-semibold uppercase text-pista">
                Studio
              </h2>
              <ul className="flex flex-col gap-3">
                {nav.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="sweep-underline font-sans text-body text-chandni/75 transition-colors duration-[250ms] ease-riwaaya hover:text-chandni"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </Reveal>

          <Reveal asChild className="md:col-span-2">
            <div>
              <h2 className="mb-5 font-sans text-eyebrow font-semibold uppercase text-pista">
                Contact
              </h2>
              <ul className="flex flex-col gap-3 font-sans text-body text-chandni/75">
                <li>
                  <a
                    href={`mailto:${site.email}`}
                    className="sweep-underline transition-colors duration-[250ms] ease-riwaaya hover:text-chandni"
                  >
                    {site.email}
                  </a>
                </li>
                <li>
                  <a
                    href={`tel:+${WHATSAPP_DISPLAY.replace(/\D/g, "")}`}
                    className="sweep-underline transition-colors duration-[250ms] ease-riwaaya hover:text-chandni"
                  >
                    {WHATSAPP_DISPLAY}
                  </a>
                </li>
                {site.socials.map((social) => (
                  <li key={social.href}>
                    <a
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="sweep-underline transition-colors duration-[250ms] ease-riwaaya hover:text-chandni"
                    >
                      {social.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </Stagger>

        <div className="flex flex-col gap-4 pt-8 font-sans text-micro text-chandni/50 md:flex-row md:items-center md:justify-between">
          <p>
            © {year} {site.name}. Weddings and events across {site.cities.slice(0, 3).join(", ")} and beyond.
          </p>
          <p>
            riwaaya, from riwaayat — custom, tradition.
          </p>
        </div>
      </div>
    </footer>
  );
}
