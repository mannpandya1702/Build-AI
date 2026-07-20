import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import FlowSpine from "@/components/FlowSpine";
import Services from "@/components/sections/Services";
import Why from "@/components/sections/Why";
import Booking from "@/components/sections/Booking";
import Footer from "@/components/sections/Footer";

export default function Home() {
  return (
    <>
      <Nav />
      <main className="relative">
        {/* Teal spine threads the whole document, anchored to the tooth roots. */}
        <FlowSpine />
        <Hero />
        <Services />
        <Why />
        <Booking />
        <Footer />
      </main>
    </>
  );
}
