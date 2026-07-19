/**
 * Process: four numbered steps. Data-driven from siteConfig.process.
 */

import { useRef } from 'react'
import { siteConfig } from '../site.config'
import { useReveal } from '../lib/reveal'

export default function Process() {
  const ref = useRef<HTMLElement | null>(null)
  useReveal(ref, '[data-reveal]', 0.1)

  return (
    <section
      ref={ref}
      id="process"
      className="relative bg-gradient-to-b from-charcoal via-slate to-charcoal py-24 md:py-32"
    >
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <div className="max-w-2xl" data-reveal>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-copper">
            How it goes
          </p>
          <h2 className="mt-4 text-3xl font-light leading-tight tracking-tight text-offwhite sm:text-4xl md:text-5xl">
            Four steps. No surprises.
          </h2>
        </div>

        <ol className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {siteConfig.process.map((step, i) => (
            <li
              key={step.title}
              data-reveal
              className="relative rounded-2xl border border-white/8 bg-slate/40 p-6"
            >
              <span className="font-script text-5xl leading-none text-copper/80">
                {i + 1}
              </span>
              <h3 className="mt-4 text-lg font-semibold text-offwhite">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {step.description}
              </p>
              {i < siteConfig.process.length - 1 && (
                <span className="absolute right-5 top-7 hidden text-copper/30 lg:block">
                  &rarr;
                </span>
              )}
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
