/**
 * "How we work" — the client journey, in the order a wedding moves through it.
 * Each step maps to a group of the eleven lines of work in content/services.ts.
 *
 * The four names are the studio's own, supplied 13 Aug 2026 as "one cohesive
 * suite… like a client journey":
 *
 *   First Word — the introductory call
 *   Threshold  — onboarding, contracts, trust
 *   Architecture — planning and budget
 *   Unfolding  — execution, on-site and after
 *
 * They replace Roots / Order / Welcome / Presence here. Those four stay on the
 * About page as the brand pillars from the identity deck — they are a different
 * thing (what the studio believes, not what happens when) and dropping them
 * site-wide would leave hospitality unnamed anywhere. Say the word and the
 * About page takes these names too.
 */

export type ProcessStep = {
  id: string;
  /** Displayed as 01, 02… in Cormorant. */
  index: string;
  /** The step name. */
  title: string;
  /** The service group it covers. */
  label: string;
  body: string;
};

export const processSteps: ProcessStep[] = [
  {
    id: "step-first-word",
    index: "01",
    title: "First Word",
    label: "The introductory call",
    body: "We listen before we suggest anything. You tell us the date, the numbers and what your families already do; we come back with the options that actually fit — not a moodboard, and not a package.",
  },
  {
    id: "step-threshold",
    index: "02",
    title: "Threshold",
    label: "Onboarding & contracts",
    body: "Scope in writing, signed, before any money moves. You know exactly what is contracted and what is not, who your named contact is, and how decisions get made from here.",
  },
  {
    id: "step-architecture",
    index: "03",
    title: "Architecture",
    label: "Planning & budget",
    body: "The shape before the celebration. Roadmaps, vendor sheets, payment schedules — calm is a document, not a mood. You approve every contract and every payment sheet before it moves.",
  },
  {
    id: "step-unfolding",
    index: "04",
    title: "Unfolding",
    label: "On-site & after",
    body: "The plan, becoming the day. A hospitality desk that never closes, shadows for the couple, showrunners for the hour nobody scheduled — then a debrief and every rupee in writing.",
  },
];
