import { Reveal } from "@/components/motion/Reveal";
import { Accordion } from "@/components/ui/Accordion";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { faqs } from "@/content/faqs";
import { whatsappHref } from "@/lib/site";

export function Faq() {
  return (
    <section id="faq" className="scroll-mt-24 bg-chandni py-section">
      <div className="shell grid gap-12 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-4">
          <SectionHeading eyebrow="Questions" title="The things people ask first.">
            If yours is not here, message us. We answer WhatsApp faster than
            email, and we would rather tell you honestly than have you guess.
          </SectionHeading>

          <Reveal className="mt-8">
            <a
              href={whatsappHref("Hi Riwaaya, I have a question before enquiring.")}
              target="_blank"
              rel="noopener noreferrer"
              className="sweep-underline font-sans text-micro font-semibold uppercase tracking-[0.14em] text-pista-ink"
            >
              Ask on WhatsApp
            </a>
          </Reveal>
        </div>

        <Reveal className="lg:col-span-8">
          <Accordion items={faqs} />
        </Reveal>
      </div>
    </section>
  );
}
