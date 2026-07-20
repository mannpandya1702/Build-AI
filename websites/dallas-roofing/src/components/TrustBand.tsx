/**
 * TrustBand: horizontal band of trust signals rendered as simple styled chips
 * (not fake logos). Data-driven from siteConfig.trust.
 *
 * NOTE: These are PLACEHOLDER trust anchors (common US roofing signals).
 * Replace license numbers, certifications, warranty terms, financing details,
 * and review counts with the real, verified client data before launch.
 */

import { useRef } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { siteConfig } from '../site.config'
import { useReveal } from '../lib/reveal'

export default function TrustBand() {
  const ref = useRef<HTMLElement | null>(null)
  useReveal(ref, '[data-reveal]', 0.06)

  return (
    <section ref={ref} className="relative bg-cream py-16">
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <p
          className="mb-8 text-center text-xs font-semibold uppercase tracking-[0.3em] text-muted"
          data-reveal
        >
          Trusted across the metroplex
        </p>
        <div className="flex flex-wrap items-stretch justify-center gap-3">
          {siteConfig.trust.map((t) => (
            <div
              key={t.label}
              data-reveal
              className="flex items-center gap-3 rounded-xl border border-ink/10 bg-surface px-4 py-3 shadow-[0_8px_20px_-14px_rgba(43,38,32,0.25)]"
            >
              <CheckCircle2 className="h-5 w-5 shrink-0 text-copper-deep" strokeWidth={1.6} />
              <div className="text-left">
                <p className="text-sm font-semibold text-ink">{t.label}</p>
                <p className="text-xs text-muted">{t.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
