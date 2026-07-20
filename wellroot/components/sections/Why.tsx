import Reveal from "../Reveal";

const stats = [
  { value: "Same day", label: "Emergency slots kept open every day" },
  { value: "Upfront", label: "Pricing shown to you before we begin" },
  { value: "12,000+", label: "Visits from families across Bengaluru" },
  { value: "Every step", label: "Explained in plain words, no jargon" },
];

export default function Why() {
  return (
    <section id="why" className="relative bg-mist py-28 md:py-36">
      <div className="mx-auto max-w-[1240px] px-6 md:px-10">
        <div className="grid grid-cols-1 gap-14 lg:grid-cols-[1fr_1fr] lg:gap-20">
          <div>
            <Reveal>
              <p className="eyebrow mb-4">Why it feels different</p>
            </Reveal>
            <Reveal delay={80}>
              <h2
                className="mb-6 max-w-[16ch]"
                style={{ fontSize: "var(--text-h2)" }}
              >
                The dentist, minus the dread.
              </h2>
            </Reveal>
            <Reveal delay={140}>
              <p className="max-w-[46ch] text-[17px] leading-relaxed text-muted">
                Most people put off the dentist because it feels rushed, cold,
                or unclear. We built Wellroot to be the opposite. You get time,
                a quiet room, and someone who talks you through what is
                happening and what it costs, before anything starts.
              </p>
            </Reveal>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {stats.map((s, i) => (
              <Reveal key={s.label} delay={i * 90}>
                <div className="h-full rounded-2xl border border-line bg-white p-7">
                  <p className="mb-2 font-display text-[32px] font-semibold leading-none text-teal-deep">
                    {s.value}
                  </p>
                  <p className="text-[14.5px] leading-relaxed text-muted">
                    {s.label}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
