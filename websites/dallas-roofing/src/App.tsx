/**
 * App: composes the single-page site and wires Lenis smooth scroll (into the
 * GSAP ticker) for the lifetime of the page. Every section reads its content
 * from src/site.config.ts.
 */

import { useEffect } from 'react'
import { initSmoothScroll } from './lib/lenis'
import Header from './components/Header'
import Hero from './components/Hero/Hero'
import Services from './components/Services'
import Materials from './components/Materials'
import Process from './components/Process'
import TrustBand from './components/TrustBand'
import LeadForm from './components/LeadForm'
import Footer from './components/Footer'

export default function App() {
  useEffect(() => {
    const cleanup = initSmoothScroll()
    return cleanup
  }, [])

  return (
    <div id="top" className="min-h-screen bg-charcoal text-offwhite">
      <Header />
      <main>
        <Hero />
        <Services />
        <Materials />
        <Process />
        <TrustBand />
        <LeadForm />
      </main>
      <Footer />
    </div>
  )
}
