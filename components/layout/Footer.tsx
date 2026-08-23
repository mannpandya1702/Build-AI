import Link from "next/link";

import { Logo } from "@/components/brand/Logo";
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
              {/* The client's stacked lockup, reproduced in full — the one
                  place the monogram and the signature line both belong. */}
              <Logo size="lg" layout="stack" tone="chandni" />
              <p className="max-w-measure font-sans text-body text-chandni/70">
                {site.tagline}
              </p>
              <WhatsAppCTA variant="inline" tone="chandni" className="w-fit" />
            </div>
          </Reveal>

          <Reveal asChild className="md:col-span-6 lg:col-span-4">
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

          <Reveal asChild className="md:col-span-6 lg:col-span-2">
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

          <Reveal asChild className="md:col-span-6 lg:col-span-2">
            <div>
              <h2 className="mb-5 font-sans text-eyebrow font-semibold uppercase text-pista">
                Contact
              </h2>
              {/*
                text-micro, not text-body: at lg this column is two of twelve,
                which is about 130px, and a full phone number set at 16px is
                wider than that. It overflowed the page rather than wrapping,
                because a number has no break opportunity Chrome will take.
              */}
              <ul className="flex flex-col gap-3 font-sans text-micro text-chandni/75 [overflow-wrap:anywhere]">
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
                {/* The studio address, confirmed 13 Aug 2026. NAP consistency
                    — name, address, phone identical here, on the contact page
                    and in the LocalBusiness JSON-LD — is what local search
                    actually rewards. */}
                <li className="pt-2 text-chandni/55">
                  <address className="not-italic">
                    {site.address.street}
                    <br />
                    {site.address.locality}, {site.address.region}
                  </address>
                </li>
              </ul>
            </div>
          </Reveal>
        </Stagger>

        <div className="flex flex-col gap-4 pt-8 font-sans text-micro text-chandni/50 md:flex-row md:items-center md:justify-between">
          <p>
            © {year} {site.name}. Weddings and events across India, from {site.baseCity}.
          </p>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
            <p>riwaaya, from riwaayat — custom, tradition.</p>

            {/*
              The studio's own way in. A footer link is where a visitor never
              looks and the owner always knows to look — putting it in the nav
              would advertise an admin door to every guest on the site.
              The page behind it asks for a password regardless.

              A plain <a>, deliberately, NOT next/link. Link prefetches routes
              as they scroll into view, so every visitor who reached the footer
              had /admin fetched in the background — that request came back 401
              with a WWW-Authenticate header, and the browser answered it by
              opening its native sign-in box. A password prompt appearing
              unbidden on a wedding site is about the worst thing this footer
              could do. A plain anchor never prefetches, and clicking it does a
              full navigation, so the prompt only ever appears on /admin itself,
              which is where it belongs.
            */}
            <a
              href="/admin"
              rel="nofollow"
              className="inline-flex items-center gap-2 self-start rounded-full border border-chandni/20 px-4 py-2 text-chandni/70 transition-colors duration-[250ms] ease-riwaaya hover:border-chandni/45 hover:text-chandni"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 12 14"
                className="h-3 w-3 shrink-0"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.3"
              >
                <rect x="1.4" y="6" width="9.2" height="7.1" rx="1.4" />
                <path d="M3.6 6V3.9a2.4 2.4 0 0 1 4.8 0V6" strokeLinecap="round" />
              </svg>
              Studio login
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
