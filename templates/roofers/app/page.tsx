import Hero from "../components/Hero";
import { Services, Gallery, Reviews, Contact } from "../components/Sections";
import QuoteForm from "../components/QuoteForm";
import { site } from "../lib/content";

// Home does the heavy lifting as a landing page (CLAUDE.md §5b): hero, services, proof, reviews,
// one clear quote form, and contact/map. One primary action: call, or get a quote.
export default function Page() {
  return (
    <main className="pb-24 md:pb-0">
      <Hero />
      <Services />

      <section id="quote" className="mx-auto max-w-3xl px-5 py-14 md:max-w-5xl">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 md:items-center">
          <div>
            <h2 className="text-3xl font-black text-gray-900 md:text-4xl">Get a free quote</h2>
            <p className="mt-3 text-gray-600">
              Tell us what is going on. We answer fast and there is no charge to get a number.
            </p>
            {site.phone && (
              <p className="mt-3 text-gray-700">
                Or just call: <span className="font-bold">{site.phone}</span>.
              </p>
            )}
          </div>
          <QuoteForm />
        </div>
      </section>

      <Gallery />
      <Reviews />
      <Contact />

      <footer className="bg-gray-950 py-8 text-center text-sm text-white/60">
        <p>{site.businessName} — {site.city}, {site.state}</p>
        <p className="mt-1">Roofing you can reach with one tap.</p>
      </footer>
    </main>
  );
}
