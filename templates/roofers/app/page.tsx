import Hero from "../components/Hero";
import { StatsStrip, Services, StormBand, Process, Gallery, Reviews, Faq, Contact } from "../components/Sections";
import QuoteForm from "../components/QuoteForm";
import { site } from "../lib/content";

// Home does the heavy lifting as a landing page (CLAUDE.md §5b): hero → proof → services →
// the niche-need moment → process → gallery → reviews → quote → FAQ → contact. One primary
// action throughout: call, or get a quote.
export default function Page() {
  return (
    <main className="pb-24 md:pb-0">
      <Hero />
      <StatsStrip />
      <Services />
      <StormBand />
      <Process />
      <Gallery />
      <Reviews />

      <section id="quote" className="mx-auto max-w-6xl px-5 py-16 md:py-20">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 md:items-center">
          <div>
            <p className="font-display text-sm font-medium uppercase tracking-[0.2em] text-brand">Free quote</p>
            <h2 className="mt-2 font-display text-4xl font-extrabold tracking-tight text-ink md:text-5xl">
              Tell us what&apos;s going on up there
            </h2>
            <p className="mt-4 text-lg text-ink/70">
              Takes under a minute. We answer fast and there is no charge to get a number.
            </p>
            {site.phone && (
              <p className="mt-3 text-ink/80">
                Or just call: <span className="font-display font-extrabold text-ink">{site.phone}</span>
              </p>
            )}
          </div>
          <QuoteForm />
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
