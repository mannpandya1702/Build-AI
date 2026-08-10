/**
 * "How we work" — the four brand pillars from the identity deck, in the order
 * a wedding actually moves through them. Each maps to a group of the eleven
 * lines of work in content/services.ts.
 *
 * Body copy is the deck's own, lightly extended.
 */

export type ProcessStep = {
  id: string;
  /** Displayed as 01, 02… in Cormorant. */
  index: string;
  /** The pillar name. */
  title: string;
  /** The service group it covers. */
  label: string;
  body: string;
};

export const processSteps: ProcessStep[] = [
  {
    id: "step-roots",
    index: "01",
    title: "Roots",
    label: "Consultation",
    body: "We start with the family's own customs, not a moodboard. The ritual sets the palette — so the first conversation is about what your families already do.",
  },
  {
    id: "step-order",
    index: "02",
    title: "Order",
    label: "Planning & budget",
    body: "Roadmaps, vendor sheets, payment schedules. Calm is a document, not a mood. You approve every contract and every payment sheet before it moves.",
  },
  {
    id: "step-welcome",
    index: "03",
    title: "Welcome",
    label: "Hospitality",
    body: "A desk that never closes, a call to every room. Guests should never have to ask twice — and the family should never be the one answering.",
  },
  {
    id: "step-presence",
    index: "04",
    title: "Presence",
    label: "On-site & after",
    body: "Shadows for the couple, showrunners for the day, a debrief after. We stay to the end, then put what it cost in writing.",
  },
];
