import { Reveal, Stagger } from "@/components/motion/Reveal";

/**
 * One large Cormorant paragraph on off-white. This section is mostly
 * whitespace on purpose — it is the pause between the hero and the work.
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
              Most weddings are planned outward from a venue. We plan them outward
              from a ritual — the haldi your family does in the courtyard, the taak
              your grandmother still lights, the order your mother insists on.
            </p>
          </Reveal>

          <Reveal asChild>
            <p className="max-w-prose font-sans text-body-lg text-stone-deep">
              Then we build the day around it. Fewer things, chosen properly, with
              one team from the first phone call to the last car. It is quieter
              than most of what this industry makes, and that is the point.
            </p>
          </Reveal>
        </Stagger>
      </div>
    </section>
  );
}
