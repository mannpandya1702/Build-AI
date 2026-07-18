import { SiteNav, StickyBookBar } from "@/components/site/nav";
import { Hero } from "@/components/site/hero";
import { ServiceCards } from "@/components/site/service-cards";
import { VoiceBeat } from "@/components/site/voice-beat";
import { Marquee } from "@/components/site/marquee";
import { Process } from "@/components/site/process";
import { FooterCta } from "@/components/site/footer-cta";

export default function Home() {
  return (
    <>
      <SiteNav />
      <main>
        <Hero />
        <ServiceCards />
        <VoiceBeat />
        <Marquee />
        <Process />
        <FooterCta />
      </main>
      <StickyBookBar />
    </>
  );
}
