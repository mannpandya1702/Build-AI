import { Reveal, Stagger } from "@/components/motion/Reveal";
import { Counter } from "@/components/ui/Counter";
import { stats } from "@/content/stats";

/**
 * The one full-bleed pistachio band on the page. Numbers count up once when
 * the band enters view. ink on pista clears WCAG AA comfortably.
 */
export function Stats() {
  return (
    <section aria-label="Riwaaya in numbers" className="bg-pista py-section-sm">
      <div className="shell">
        <Stagger className="grid grid-cols-2 gap-y-12 lg:grid-cols-4">
          {stats.map((stat) => (
            <Reveal asChild key={stat.id}>
              <div className="flex flex-col gap-2">
                <p className="font-display text-display-md font-light leading-none text-ink">
                  {/* "24/7" is a fixed string, not a quantity — counting it up
                      would be meaningless, so it renders as written. */}
                  {stat.literal ? (
                    <span className="lining-nums tabular-nums">{stat.literal}</span>
                  ) : (
                    <Counter value={stat.value} suffix={stat.suffix} />
                  )}
                </p>
                <p className="font-sans text-micro uppercase tracking-[0.14em] text-ink/70">
                  {stat.label}
                </p>
                {/* Second line only where a figure needs disambiguating, so
                    the labels themselves stay the same length across the row. */}
                {stat.note && (
                  <p className="max-w-[16rem] font-sans text-[0.6875rem] leading-snug text-ink/55">
                    {stat.note}
                  </p>
                )}
              </div>
            </Reveal>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
