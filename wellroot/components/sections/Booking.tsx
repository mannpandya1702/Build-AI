import Reveal from "../Reveal";

export default function Booking() {
  return (
    <section id="booking" className="relative bg-white py-28 md:py-40">
      <div className="mx-auto max-w-[1240px] px-6 md:px-10">
        <Reveal>
          <div className="relative overflow-hidden rounded-[28px] border border-line bg-mist px-8 py-16 text-center md:px-16 md:py-24">
            {/* Soft teal aura echoing the hero's breathing glow */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{
                background:
                  "radial-gradient(circle, rgba(18,179,171,0.18) 0%, rgba(18,179,171,0) 62%)",
              }}
            />
            <div className="relative">
              <p className="eyebrow mb-4">Booking</p>
              <h2
                className="mx-auto mb-6 max-w-[14ch]"
                style={{ fontSize: "var(--text-h2)" }}
              >
                Let&apos;s get you comfortable.
              </h2>
              <p className="mx-auto mb-10 max-w-[48ch] text-[17px] leading-relaxed text-muted">
                Pick a time that suits you. We will confirm within the hour, and
                you will know exactly what to expect and what it costs before you
                arrive.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-4">
                <a href="#booking" className="btn btn-primary">
                  Book a visit
                </a>
                <a href="tel:+918000000000" className="btn btn-ghost">
                  Call the clinic
                </a>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
