/**
 * Stats strip. Numbers animate up once when the band scrolls into view.
 * PLACEHOLDER VALUES — confirm the real figures with the client before launch.
 */

export type Stat = {
  id: string;
  value: number;
  /** Rendered after the number, e.g. "+". Leave empty for none. */
  suffix?: string;
  label: string;
};

export const stats: Stat[] = [
  { id: "stat-events", value: 180, suffix: "+", label: "Events delivered" },
  { id: "stat-cities", value: 14, label: "Cities" },
  { id: "stat-years", value: 9, label: "Years" },
  { id: "stat-weddings", value: 1, label: "Wedding per week" },
];
