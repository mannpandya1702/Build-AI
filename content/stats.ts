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
};

export const stats: Stat[] = [
  { id: "stat-lines", value: 11, label: "Lines of work" },
  { id: "stat-desk", value: 24, literal: "24/7", label: "Hospitality desk" },
  { id: "stat-departments", value: 8, label: "On-site departments" },
  { id: "stat-weddings", value: 1, label: "Wedding at a time" },
];
