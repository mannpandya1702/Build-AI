import type { Metadata } from "next";

import { Enquiry } from "@/components/sections/Enquiry";
import { Faq } from "@/components/sections/Faq";
import { Hero } from "@/components/sections/Hero";
import { IntroStatement } from "@/components/sections/IntroStatement";
import { Process } from "@/components/sections/Process";
import { Services } from "@/components/sections/Services";
import { SignatureWork } from "@/components/sections/SignatureWork";
import { Stats } from "@/components/sections/Stats";
import { Testimonials } from "@/components/sections/Testimonials";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  // Absolute so the "%s — Riwaaya" template does not append the name twice.
  title: {
    absolute: `${site.name} — Luxury & Destination Wedding Planner, Chandigarh`,
  },
  description: site.description,
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return (
    <>
      <Hero />
      <IntroStatement />
      <Services />
      <SignatureWork />
      <Process />
      <Testimonials />
      <Stats />
      <Faq />
      <Enquiry />
    </>
  );
}
