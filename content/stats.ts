/**
 * Stats strip.
 *
 * These three come from the scope of work and the identity deck's own website
 * draft — they are counts of what is contracted, not marketing claims, so they
 * can be published without needing to be verified against past events.
 *
 * (The earlier placeholder figures — events delivered, cities, years — were
 * invented and have been removed. If the studio wants that kind of number on
 * the page, it needs to come from them.)
 */

export type Stat = {
  id: string;
  /** Rendered large. A string so "24/7" reads correctly. */
  value: number;
  /** Rendered after the number. */
  suffix?: string;
  label: string;
  /** Set when the figure should not count up — e.g. "24/7". */
  literal?: string;
  /**
   * Optional second line, smaller, for a figure that needs disambiguating.
   * Only one stat uses it — see below. Keep labels short and put the
   * clarification here rather than stretching the label across the band.
   */
  note?: string;
};

export const stats: Stat[] = [
  { id: "stat-lines", value: 11, label: "Lines of work" },
  { id: "stat-desk", value: 24, literal: "24/7", label: "Hospitality desk" },
  { id: "stat-departments", value: 8, label: "On-site departments" },
  /**
   * The studio read "Wedding at a time" as a weddings-per-year figure — it is
   * not. It says the team is never split across two weddings on the same
   * dates, which is what makes "the people you planned with are the people on
   * site" true.
   *
   * First fix was to stretch the label to "Wedding on the ground at a time",
   * which cleared up the meaning and wrecked the band: at nearly double the
   * width of the other three it ran to the edge of the shell and broke the
   * rhythm of the row. The clarification belongs on its own line instead.
   *
   * If a real weddings-per-year figure is wanted here, it has to come from the
   * studio — nothing on this site invents a number.
   */
  {
    id: "stat-weddings",
    value: 1,
    label: "Wedding at a time",
    note: "Never two on the same dates",
  },
];
