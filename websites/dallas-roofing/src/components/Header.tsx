/**
 * Header: fixed, minimal. Logo mark, phone (top-right), Free Inspection button.
 * Gains a subtle glass background once the user scrolls past the hero fold.
 */

import { useEffect, useState } from 'react'
import { Phone } from 'lucide-react'
import { siteConfig } from '../site.config'

export default function Header() {
  const { company } = siteConfig
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-500 ${
        scrolled ? 'glass' : 'bg-transparent'
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 md:px-8">
        <a
          href="#top"
          className="flex items-center gap-2 text-sm font-semibold tracking-[0.18em] text-ink"
        >
          <span className="grid h-7 w-7 place-items-center rounded-sm border border-copper-deep/70 text-copper-deep">
            <span className="text-[13px] font-bold">L</span>
          </span>
          <span className="hidden sm:inline">{company.logoMark}</span>
        </a>

        <div className="flex items-center gap-3 md:gap-5">
          <a
            href={company.phoneHref}
            className="flex items-center gap-2 text-sm font-medium text-ink/85 transition-colors hover:text-copper-deep"
          >
            <Phone className="h-4 w-4 text-copper-deep" />
            <span className="hidden md:inline">{company.phone}</span>
          </a>
          <a
            href="#book"
            className="rounded-full bg-copper-deep px-4 py-2 text-sm font-semibold text-cream transition-transform duration-300 hover:-translate-y-0.5 hover:bg-copper"
          >
            Free Inspection
          </a>
        </div>
      </div>
    </header>
  )
}
