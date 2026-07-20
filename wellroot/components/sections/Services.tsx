import Reveal from "../Reveal";

const services = [
  {
    title: "Checkups & cleaning",
    body: "A calm look at how things are, and a proper clean, twice a year.",
  },
  {
    title: "Whitening",
    body: "A brighter smile, done gently, with no surprises to your enamel.",
  },
  {
    title: "Implants & crowns",
    body: "Sturdy fixes for missing or broken teeth that feel like your own.",
  },
  {
    title: "Emergencies",
    body: "Sudden pain or a knock? Same-day slots so you are not left waiting.",
  },
];

export default function Services() {
  return (
    <section id="services" className="relative bg-white py-28 md:py-36">
      <div className="mx-auto max-w-[1240px] px-6 md:px-10">
        <Reveal>
          <p className="eyebrow mb-4">What we do</p>
        </Reveal>
        <Reveal delay={80}>
          <h2
            className="mb-16 max-w-[18ch]"
            style={{ fontSize: "var(--text-h2)" }}
          >
            Everyday care and the big stuff, under one calm roof.
          </h2>
        </Reveal>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {services.map((s, i) => (
            <Reveal key={s.title} delay={i * 90}>
              <article className="group h-full rounded-2xl border border-line bg-white p-7 transition-all duration-300 hover:-translate-y-1 hover:border-teal/50 hover:shadow-[0_18px_40px_-24px_rgba(11,107,102,0.35)]">
                <span className="mb-6 flex h-11 w-11 items-center justify-center rounded-full bg-mist text-teal-deep transition-colors group-hover:bg-teal group-hover:text-white">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M12 4c-2.6 0-4.3 1.6-4.3 3.7 0 1.2.4 2.1.8 3.4.3 1.3.2 3.4.8 5.1.2.8.6 1.5 1.1 1.5.6 0 .8-.9 1-1.7.1-.9.3-1.7.6-1.7s.5.8.6 1.7c.2.8.4 1.7 1 1.7.5 0 .9-.7 1.1-1.5.6-1.7.5-3.8.8-5.1.4-1.3.8-2.2.8-3.4C16.3 5.6 14.6 4 12 4Z"
                      fill="currentColor"
                    />
                  </svg>
                </span>
                <h3 className="mb-2 text-[19px] font-semibold text-ink">
                  {s.title}
                </h3>
                <p className="text-[15px] leading-relaxed text-muted">
                  {s.body}
                </p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
