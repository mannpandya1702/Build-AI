/**
 * "How we work" — the four-step timeline on the home page.
 * Keep it at four. The connecting line is drawn on scroll between them.
 */

export type ProcessStep = {
  id: string;
  /** Displayed as 01, 02… in Cormorant. */
  index: string;
  title: string;
  body: string;
};

export const processSteps: ProcessStep[] = [
  {
    id: "step-1",
    index: "01",
    title: "We listen",
    body: "One long conversation about your families — what they keep, what they quietly stopped doing, and what you want back. No moodboards yet.",
  },
  {
    id: "step-2",
    index: "02",
    title: "We shape it",
    body: "A written plan: the rituals, the order, the budget and the honest version of what each one costs. You change it until it reads like your family.",
  },
  {
    id: "step-3",
    index: "03",
    title: "We build it",
    body: "Vendors contracted, run sheets written, rehearsals scheduled. You approve; we chase. Every quote reaches you unmarked.",
  },
  {
    id: "step-4",
    index: "04",
    title: "We run it",
    body: "Our team is on the ground from the first function to the last car. You are a guest at your own wedding, which is the entire point.",
  },
];
