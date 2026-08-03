import { SiteNav, StickyBookBar } from "@/components/site/nav";
import { CalEmbedInit } from "@/components/site/cal-embed";
import { Hero } from "@/components/site/hero";
import { ServiceCards } from "@/components/site/service-cards";
import { StatsCounter } from "@/components/site/stats-counter";
import { VoiceBeat } from "@/components/site/voice-beat";
import { GlobalReach } from "@/components/site/global-reach";
import { Comparison } from "@/components/site/comparison";
import { Testimonials } from "@/components/site/testimonials";
import { Marquee } from "@/components/site/marquee";
import { Process } from "@/components/site/process";
import { Faq } from "@/components/site/faq";
import { FooterCta } from "@/components/site/footer-cta";

export default function Home() {
  return (
    <>
      <CalEmbedInit />
      <SiteNav />
      <main>
        <Hero />
        <ServiceCards />
        <StatsCounter />
        <VoiceBeat />
        <GlobalReach />
        <Comparison />
        <Testimonials />
        <Marquee />
        <Process />
        <Faq />
        <FooterCta />
      </main>
      <StickyBookBar />
    </>
  );
}
