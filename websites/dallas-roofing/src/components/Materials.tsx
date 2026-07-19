/**
 * Materials showcase: three tiers with a color swatch and short blurb.
 * Data-driven from siteConfig.materials.
 */

import { useRef } from 'react'
import { siteConfig } from '../site.config'
import { useReveal } from '../lib/reveal'

export default function Materials() {
  const ref = useRef<HTMLElement | null>(null)
  useReveal(ref, '[data-reveal]', 0.1)

  return (
    <section
      ref={ref}
      id="materials"
      className="relative bg-charcoal py-24 md:py-32"
    >
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <div className="max-w-2xl" data-reveal>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-copper">
            Materials
          </p>
          <h2 className="mt-4 text-3xl font-light leading-tight tracking-tight text-offwhite sm:text-4xl md:text-5xl">
            Pick the roof that fits your home.
          </h2>
          <p className="mt-4 text-muted">
            Three tiers, all installed to manufacturer spec. We will tell you
            straight which one makes sense for your house and your budget.
          </p>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {siteConfig.materials.map((m) => (
            <article
              key={m.name}
              data-reveal
              className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/8 bg-slate/50 transition-colors duration-300 hover:border-copper/40"
            >
              {/* Swatch band */}
              <div
                className="relative h-28 w-full"
                style={{ backgroundColor: m.swatch }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                <span className="absolute bottom-3 left-4 text-xs font-medium uppercase tracking-[0.2em] text-white/85">
                  {m.tier}
                </span>
              </div>
              <div className="flex flex-1 flex-col p-6">
                <h3 className="text-lg font-semibold text-offwhite">
                  {m.name}
                </h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">
                  {m.blurb}
                </p>
                <p className="mt-5 border-t border-white/8 pt-4 text-xs uppercase tracking-[0.15em] text-copper">
                  Best for: <span className="text-offwhite/80">{m.bestFor}</span>
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
