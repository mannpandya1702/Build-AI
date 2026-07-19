/**
 * Footer: company name, service-area line, phone, hours, socials placeholder,
 * small print. All from siteConfig.
 */

import { Phone } from 'lucide-react'
import { siteConfig } from '../site.config'

export default function Footer() {
  const { company, footer, serviceAreaLine } = siteConfig
  const year = 2026 // Placeholder copyright year; wire to build date if desired.

  return (
    <footer className="border-t border-white/8 bg-charcoal py-14">
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2">
              <span className="grid h-7 w-7 place-items-center rounded-sm border border-copper/60 text-copper">
                <span className="text-[13px] font-bold">L</span>
              </span>
              <span className="text-sm font-semibold tracking-[0.18em] text-offwhite">
                {company.logoMark}
              </span>
            </div>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted">
              {footer.blurb}
            </p>
            <p className="mt-4 text-sm text-muted">{serviceAreaLine}</p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-offwhite/80">
              Get in touch
            </p>
            <a
              href={company.phoneHref}
              className="mt-4 flex items-center gap-2 text-sm text-offwhite transition-colors hover:text-copper"
            >
              <Phone className="h-4 w-4 text-copper" />
              {company.phone}
            </a>
            <a
              href={`mailto:${company.email}`}
              className="mt-2 block text-sm text-muted transition-colors hover:text-copper"
            >
              {company.email}
            </a>
            <p className="mt-2 text-sm text-muted">{company.hours}</p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-offwhite/80">
              Follow
            </p>
            <ul className="mt-4 space-y-2">
              {footer.socials.map((s) => (
                <li key={s.label}>
                  <a
                    href={s.href}
                    className="text-sm text-muted transition-colors hover:text-copper"
                  >
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-white/8 pt-6 text-xs text-muted md:flex-row md:items-center md:justify-between">
          <p>
            &copy; {year} {company.name}. {footer.license}
          </p>
          <ul className="flex gap-5">
            {footer.legalLinks.map((l) => (
              <li key={l.label}>
                <a href={l.href} className="transition-colors hover:text-copper">
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  )
}
