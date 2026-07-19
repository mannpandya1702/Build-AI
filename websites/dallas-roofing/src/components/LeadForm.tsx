/**
 * LeadForm: "Book your free roof inspection."
 * Client-side validated placeholder form (no backend). Shows a success state.
 * The phone number is offered as the prominent primary alternative.
 */

import { useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Phone, CheckCircle2 } from 'lucide-react'
import { siteConfig } from '../site.config'
import { useReveal } from '../lib/reveal'

interface FormState {
  name: string
  address: string
  phone: string
  damage: string
}

const EMPTY: FormState = { name: '', address: '', phone: '', damage: '' }

export default function LeadForm() {
  const { cta, company } = siteConfig
  const ref = useRef<HTMLElement | null>(null)
  useReveal(ref, '[data-reveal]', 0.08)

  const [form, setForm] = useState<FormState>(EMPTY)
  const [errors, setErrors] = useState<Partial<FormState>>({})
  const [submitted, setSubmitted] = useState(false)

  const validate = (f: FormState): Partial<FormState> => {
    const e: Partial<FormState> = {}
    if (f.name.trim().length < 2) e.name = 'Tell us your name.'
    if (f.address.trim().length < 5) e.address = 'A street address helps us find the roof.'
    // Loose US phone check: at least 10 digits.
    if ((f.phone.replace(/\D/g, '').length ?? 0) < 10)
      e.phone = 'A 10 digit phone number, please.'
    if (!f.damage) e.damage = 'Pick the closest match.'
    return e
  }

  const update = (key: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  const onSubmit = (ev: FormEvent) => {
    ev.preventDefault()
    const e = validate(form)
    setErrors(e)
    if (Object.keys(e).length === 0) {
      // No backend: this is where a real submit would POST the lead.
      setSubmitted(true)
    }
  }

  const fieldClass = (key: keyof FormState) =>
    `w-full rounded-xl border bg-charcoal/60 px-4 py-3 text-sm text-offwhite placeholder:text-muted/70 outline-none transition-colors focus:border-copper ${
      errors[key] ? 'border-red-400/70' : 'border-white/10'
    }`

  return (
    <section
      ref={ref}
      id="book"
      className="relative overflow-hidden bg-gradient-to-b from-charcoal via-slate to-charcoal py-24 md:py-32"
    >
      <div className="pointer-events-none absolute inset-0 blueprint-grid opacity-[0.12]" />
      <div className="pointer-events-none absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-copper/8 blur-3xl" />

      <div className="relative mx-auto grid max-w-6xl gap-12 px-5 md:grid-cols-2 md:px-8">
        {/* Pitch + prominent phone */}
        <div data-reveal>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-copper">
            Get started
          </p>
          <h2 className="mt-4 text-3xl font-light leading-tight tracking-tight text-offwhite sm:text-4xl md:text-5xl">
            Book your{' '}
            <span className="font-script italic text-copper">free</span> roof
            inspection.
          </h2>
          <p className="mt-4 max-w-md text-muted">{cta.sub}</p>

          <a
            href={company.phoneHref}
            className="mt-8 inline-flex items-center gap-3 rounded-2xl border border-copper/40 bg-copper/10 px-5 py-4 transition-colors hover:bg-copper/20"
          >
            <Phone className="h-5 w-5 text-copper" />
            <span>
              <span className="block text-xs uppercase tracking-[0.2em] text-muted">
                Or call us now
              </span>
              <span className="block text-xl font-semibold text-offwhite">
                {company.phone}
              </span>
            </span>
          </a>
          <p className="mt-4 text-sm text-muted">{company.hours}</p>
        </div>

        {/* Form / success state */}
        <div data-reveal className="glass rounded-3xl p-6 md:p-8">
          {submitted ? (
            <div className="flex h-full min-h-72 flex-col items-center justify-center text-center">
              <CheckCircle2 className="h-14 w-14 text-copper" strokeWidth={1.4} />
              <h3 className="mt-5 text-2xl font-semibold text-offwhite">
                {cta.successTitle}
              </h3>
              <p className="mt-3 max-w-sm text-muted">{cta.successBody}</p>
              <button
                type="button"
                onClick={() => {
                  setForm(EMPTY)
                  setSubmitted(false)
                }}
                className="mt-6 text-sm font-medium text-copper underline-offset-4 hover:underline"
              >
                Book another inspection
              </button>
            </div>
          ) : (
            <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
              <div>
                <label htmlFor="lf-name" className="mb-1.5 block text-sm text-offwhite/90">
                  Full name
                </label>
                <input
                  id="lf-name"
                  type="text"
                  autoComplete="name"
                  value={form.name}
                  onChange={(e) => update('name', e.target.value)}
                  className={fieldClass('name')}
                  placeholder="Jordan Ramirez"
                />
                {errors.name && (
                  <p className="mt-1 text-xs text-red-300">{errors.name}</p>
                )}
              </div>

              <div>
                <label htmlFor="lf-address" className="mb-1.5 block text-sm text-offwhite/90">
                  Property address
                </label>
                <input
                  id="lf-address"
                  type="text"
                  autoComplete="street-address"
                  value={form.address}
                  onChange={(e) => update('address', e.target.value)}
                  className={fieldClass('address')}
                  placeholder="123 Oak St, Dallas, TX"
                />
                {errors.address && (
                  <p className="mt-1 text-xs text-red-300">{errors.address}</p>
                )}
              </div>

              <div>
                <label htmlFor="lf-phone" className="mb-1.5 block text-sm text-offwhite/90">
                  Phone
                </label>
                <input
                  id="lf-phone"
                  type="tel"
                  autoComplete="tel"
                  value={form.phone}
                  onChange={(e) => update('phone', e.target.value)}
                  className={fieldClass('phone')}
                  placeholder="(214) 555-0148"
                />
                {errors.phone && (
                  <p className="mt-1 text-xs text-red-300">{errors.phone}</p>
                )}
              </div>

              <div>
                <label htmlFor="lf-damage" className="mb-1.5 block text-sm text-offwhite/90">
                  Type of damage
                </label>
                <select
                  id="lf-damage"
                  value={form.damage}
                  onChange={(e) => update('damage', e.target.value)}
                  className={`${fieldClass('damage')} appearance-none`}
                >
                  <option value="" disabled>
                    Select one
                  </option>
                  {cta.damageTypes.map((d) => (
                    <option key={d.value} value={d.value} className="bg-slate">
                      {d.label}
                    </option>
                  ))}
                </select>
                {errors.damage && (
                  <p className="mt-1 text-xs text-red-300">{errors.damage}</p>
                )}
              </div>

              <button
                type="submit"
                className="mt-2 rounded-xl bg-copper px-5 py-3.5 text-sm font-semibold text-charcoal transition-transform duration-300 hover:-translate-y-0.5 hover:bg-copper-soft"
              >
                Request my free inspection
              </button>
              <p className="text-center text-xs text-muted">
                No cost, no obligation. We respect your time.
              </p>
            </form>
          )}
        </div>
      </div>
    </section>
  )
}
