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
    <footer className="bg-espresso py-14 text-cream/90">
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2">
              <span className="grid h-7 w-7 place-items-center rounded-sm border border-copper-soft/70 text-copper-soft">
                <span className="text-[13px] font-bold">L</span>
              </span>
              <span className="text-sm font-semibold tracking-[0.18em] text-cream">
                {company.logoMark}
              </span>
            </div>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-cream/60">
              {footer.blurb}
            </p>
            <p className="mt-4 text-sm text-cream/60">{serviceAreaLine}</p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cream/70">
              Get in touch
            </p>
            <a
              href={company.phoneHref}
              className="mt-4 flex items-center gap-2 text-sm text-cream transition-colors hover:text-copper-soft"
            >
              <Phone className="h-4 w-4 text-copper-soft" />
              {company.phone}
            </a>
            <a
              href={`mailto:${company.email}`}
              className="mt-2 block text-sm text-cream/60 transition-colors hover:text-copper-soft"
            >
              {company.email}
            </a>
            <p className="mt-2 text-sm text-cream/60">{company.hours}</p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cream/70">
              Follow
            </p>
            <ul className="mt-4 space-y-2">
              {footer.socials.map((s) => (
                <li key={s.label}>
                  <a
                    href={s.href}
                    className="text-sm text-cream/60 transition-colors hover:text-copper-soft"
                  >
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-cream/15 pt-6 text-xs text-cream/50 md:flex-row md:items-center md:justify-between">
          <p>
            &copy; {year} {company.name}. {footer.license}
          </p>
          <ul className="flex gap-5">
            {footer.legalLinks.map((l) => (
              <li key={l.label}>
                <a href={l.href} className="transition-colors hover:text-copper-soft">
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
