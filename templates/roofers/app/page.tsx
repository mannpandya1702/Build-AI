import Hero from "../components/Hero";
import { Services, StormBand, Process, Gallery, Reviews, Faq, Contact } from "../components/Sections";
import QuoteForm from "../components/QuoteForm";
import { site } from "../lib/content";

// Home follows the validated narrative order (CLAUDE.md §5b): hook (hero with the stats strip at
// its base) → THE PROBLEM (storm card, inset on paper) → solution (services) → how it works →
// proof (gallery, review marquee) → offer (quote, the second dark anchor) → objections (FAQ) →
// find us. Section color rhythm: dark bookends, one warm-dark moment between, light bands
// alternating paper/paper2 — never two dark bands touching.
export default function Page() {
  return (
    <main className="pb-24 md:pb-0">
      <Hero />
      <StormBand />
      <Services />
      <Process />
      <Gallery />
      <Reviews />

      {/* The offer: the page's second dark anchor. The white form card pops on ink. */}
      <section id="quote" className="bg-ink py-20 text-white md:py-28">
        <div className="mx-auto max-w-6xl px-5">
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

      <footer className="bg-ink py-10 text-center text-sm text-white/60">
        <p className="font-display text-base font-extrabold text-white/90">{site.businessName}</p>
        <p className="mt-1">
          {site.city}, {site.state} · Roofing you can reach with one tap.
        </p>
      </footer>
    </main>
  );
}
