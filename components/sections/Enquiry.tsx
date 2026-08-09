import { EnquiryForm } from "@/components/sections/EnquiryForm";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { TaakDivider } from "@/components/ui/TaakDivider";

/**
 * The enquiry section. The taak divider above it is the second and final use
 * of the arch shape on the home page.
 */
export function Enquiry() {
  return (
    <>
      <TaakDivider />

      <section id="enquiry" className="scroll-mt-24 bg-pista-mist pb-section pt-section-sm">
        <div className="shell">
          <div className="max-w-3xl">
            <SectionHeading eyebrow="Enquire" title="Tell us about your riwaayat.">
              A few questions to start. We read every enquiry ourselves and reply
              within a day — usually with more questions, because that is how the
              planning actually begins.
            </SectionHeading>
          </div>

          <EnquiryForm />
        </div>
      </section>
    </>
  );
}
