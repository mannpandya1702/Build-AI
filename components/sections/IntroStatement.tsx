import { Reveal, Stagger } from "@/components/motion/Reveal";
import { site } from "@/lib/site";

/**
 * One large Cormorant paragraph on off-white — the positioning statement from
 * the identity deck, kept in the brand's own words. Mostly whitespace on
 * purpose: it is the pause between the hero and the work.
 */
export function IntroStatement() {
  return (
    <section id="intro" className="bg-chandni py-section">
      <div className="shell">
        <Stagger className="mx-auto flex max-w-4xl flex-col gap-10">
          <Reveal asChild>
            <p className="font-sans text-eyebrow font-semibold uppercase text-pista-ink">
              riwaaya — from riwaayat
            </p>
          </Reveal>

          <Reveal asChild>
            <p className="font-display text-display-md font-light leading-[1.18] text-ink">
              {site.positioning}
            </p>
          </Reveal>

          <Reveal asChild>
            <p className="max-w-prose font-sans text-body-lg text-stone-deep">
              Riwaayat is custom — the practice a family repeats until it belongs
              to them. Riwaaya is that word in the singular: not tradition in
              general, but this family&rsquo;s version of it. We find the thread
              and build the celebration around it.
            </p>
          </Reveal>
        </Stagger>
      </div>
    </section>
  );
}
