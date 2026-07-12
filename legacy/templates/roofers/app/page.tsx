import Hero, { StatsCard, PillNav, BrandMark } from "../components/Hero";
import { Services, StormBand, Process, Gallery, QuoteBand, Reviews, Faq, Contact } from "../components/Sections";
import QuoteForm from "../components/QuoteForm";
import { site, telHref } from "../lib/content";

// Home follows the validated narrative order (CLAUDE.md §5b): hook (hero with the stats strip at
// its base) → THE PROBLEM (storm card, inset on paper) → solution (services) → how it works →
// proof (gallery, review marquee) → offer (quote, the second dark anchor) → objections (FAQ) →
// find us. Section color rhythm: dark bookends, one warm-dark moment between, light bands
// alternating paper/paper2 — never two dark bands touching.
export default function Page() {
  return (
    <main className="pb-24 md:pb-0">
      <PillNav />
      <Hero />
      <StatsCard />
      <StormBand />
      <Services />
      <Process />
      <Gallery />
      <QuoteBand />
      <Reviews />

      {/* The offer: the page's second dark anchor. The white form card pops on ink; a brand glow
          keeps the band from reading flat (§5b-bis: this dark differs from the hero's). */}
      <section id="quote" className="texture-shingle relative overflow-hidden bg-ink py-20 text-white md:py-28">
        <div
          aria-hidden
          className="glow-drift absolute -right-1/4 -top-1/2 h-[160%] w-[80%]"
          style={{ background: "radial-gradient(closest-side, rgb(var(--brand) / 0.28) 0%, transparent 70%)" }}
        />
        <div className="relative mx-auto max-w-6xl px-5">
          <div className="grid grid-cols-1 gap-10 md:grid-cols-2 md:items-center">
            <div>
              <p className="font-display text-sm font-medium uppercase tracking-[0.2em] text-amber-400">Free quote</p>
              <h2 className="mt-2 font-display text-4xl font-extrabold tracking-tight md:text-5xl">
                Tell us what&apos;s going on up there
              </h2>
              <p className="mt-4 text-lg text-white/75">
                Takes under a minute. We answer fast and there is no charge to get a number.
              </p>
              {site.phone && (
                <p className="mt-3 text-white/85">
                  Or just call: <span className="font-display font-extrabold text-white">{site.phone}</span>
                </p>
              )}
            </div>
            <QuoteForm />
          </div>
        </div>
      </section>

      <Faq />
      <Contact />

      {/* Footer as a destination, not an afterthought: the last close (giant type + the number),
          structured NAP columns, then the business's own name at monumental outlined scale —
          brand identity as architecture. */}
      <footer className="relative overflow-hidden border-t border-white/10 bg-ink text-white/60">
        <div className="mx-auto max-w-6xl px-5 pt-16 md:pt-24">
          <div className="grid grid-cols-1 gap-10 md:grid-cols-[1.4fr_1fr] md:items-end">
            <div>
              <p className="font-display text-sm font-semibold uppercase tracking-[0.22em] text-brand">One more leak is one too many</p>
              <p className="mt-3 font-display text-4xl font-extrabold tracking-tight text-white md:text-6xl">
                One tap away.
              </p>
              {site.phone && telHref(site.phone) && (
                <a href={telHref(site.phone)!} className="mt-4 inline-block font-display text-2xl font-extrabold text-white/85 underline-offset-8 hover:underline md:text-4xl">
                  {site.phone}
                </a>
              )}
            </div>
            <div className="grid grid-cols-2 gap-8 text-sm md:justify-items-end">
              <div>
                <p className="mb-3 flex items-center gap-2 font-display font-extrabold text-white">
                  <BrandMark size="h-7 w-7 text-xs" /> {site.businessName}
                </p>
                {site.address && <p>{site.address}</p>}
                <p>
                  {site.city}, {site.state}
                </p>
                <p className="mt-1">Serving {site.city} and nearby.</p>
              </div>
              <nav aria-label="Footer" className="space-y-2">
                <a href="#services" className="block hover:text-white">Services</a>
                <a href="#work" className="block hover:text-white">Our work</a>
                <a href="#reviews" className="block hover:text-white">Reviews</a>
                <a href="#quote" className="block hover:text-white">Free quote</a>
                <a href="#contact" className="block hover:text-white">Contact</a>
              </nav>
            </div>
          </div>
          <p className="mt-12 border-t border-white/10 pt-6 text-xs text-white/40">
            Roofing you can reach with one tap.
          </p>
        </div>
        <p aria-hidden className="wordmark-outline pointer-events-none -mb-4 mt-6 select-none whitespace-nowrap text-center font-display text-[13vw] font-extrabold uppercase leading-[0.8] md:-mb-8">
          {site.businessName}
        </p>
      </footer>
    </main>
  );
}
