/**
 * Services: glassmorphism cards on a calm dark gradient (no moving wireframe
 * behind the glass). Data-driven from siteConfig.services. Cards stagger in.
 */

import { useRef } from 'react'
import { siteConfig } from '../site.config'
import { useReveal } from '../lib/reveal'

export default function Services() {
  const ref = useRef<HTMLElement | null>(null)
  useReveal(ref, '[data-reveal]', 0.07)

  return (
    <section
      ref={ref}
      id="services"
      className="relative overflow-hidden bg-gradient-to-b from-cream via-sand to-cream py-24 md:py-32"
    >
      {/* Calm, static backdrop for the glass to blur against. */}
      <div className="pointer-events-none absolute inset-0 blueprint-grid opacity-40" />
      <div className="pointer-events-none absolute -left-24 top-24 h-72 w-72 rounded-full bg-copper/10 blur-3xl" />

      <div className="relative mx-auto max-w-6xl px-5 md:px-8">
        <div className="max-w-2xl" data-reveal>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-copper-deep">
            What we do
          </p>
          <h2 className="mt-4 text-3xl font-light leading-tight tracking-tight text-ink sm:text-4xl md:text-5xl">
            Roofing done the honest way, start to finish.
          </h2>
          <p className="mt-4 text-muted">
            From a hail claim to a full replacement, one Dallas crew handles it
            all and stands behind the work.
          </p>
        </div>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {siteConfig.services.map((s) => {
            const Icon = s.icon
            return (
              <article
                key={s.title}
                data-reveal
                className="group glass relative overflow-hidden rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:border-copper-deep/40"
              >
                {/* soft inner glow on hover */}
                <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 [background:radial-gradient(circle_at_30%_0%,rgba(201,112,42,0.1),transparent_60%)]" />
                <div className="relative">
                  <span className="grid h-11 w-11 place-items-center rounded-xl border border-ink/10 bg-copper/10 text-copper-deep">
                    <Icon className="h-5 w-5" strokeWidth={1.6} />
                  </span>
                  <h3 className="mt-5 text-lg font-semibold text-ink">
                    {s.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">
                    {s.description}
                  </p>
                  {/* accent underline on hover */}
                  <span className="mt-4 block h-px w-0 bg-copper-deep transition-all duration-300 group-hover:w-12" />
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
