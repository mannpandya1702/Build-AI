import Hero from "../components/Hero";
import { Services, StormBand, Process, Gallery, Reviews, Faq, Contact } from "../components/Sections";
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
      <Hero />
      <StormBand />
      <Services />
      <Process />
      <Gallery />
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

      {/* Footer: composed close with full NAP (name, address, phone — §5b: consistent with GBP). */}
      <footer className="border-t border-white/10 bg-ink py-12 text-center text-sm text-white/60">
        <p className="mx-auto flex items-center justify-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand font-display text-base font-extrabold text-brandink">
            {site.businessName.charAt(0)}
          </span>
          <span className="font-display text-lg font-extrabold tracking-tight text-white">{site.businessName}</span>
        </p>
        <p className="mt-3">
          {site.address ? `${site.address} · ` : ""}
          {site.city}, {site.state}
        </p>
        {site.phone && telHref(site.phone) && (
          <p className="mt-1">
            <a href={telHref(site.phone)!} className="font-bold text-white/85 underline-offset-4 hover:underline">
              {site.phone}
            </a>
          </p>
        )}
        <p className="mt-4 border-t border-white/10 pt-4 text-xs text-white/40">Roofing you can reach with one tap.</p>
      </footer>
    </main>
  );
}
