/**
 * FAQ accordion content.
 *
 * Answers are grounded in the signed scope of work, so nothing here promises
 * something the contract does not cover. Keep them short — if an answer needs
 * more than four sentences it belongs on a service page.
 */

export type Faq = {
  id: string;
  question: string;
  answer: string;
};

export const faqs: Faq[] = [
  {
    id: "faq-scope",
    question: "What does full-service actually cover?",
    answer:
      "Eleven contracted lines of work: planning and consultations, budget, timeline, venue, vendors, payments, guest logistics, food and beverage, on-ground personnel, on-site coordination and post-event follow-up. Each one is listed on its own page.",
  },
  {
    id: "faq-partial",
    question: "Can we book only part of it?",
    answer:
      "The engagement is built to cover a wedding whole, because the lines depend on each other — a timeline without vendor coordination does not hold. Tell us what you have already arranged and we will tell you honestly whether we are the right fit.",
  },
  {
    id: "faq-volume",
    question: "How many weddings do you take?",
    answer:
      "A small number each year, and one at a time on the ground. The people you plan with are the people at your functions — that is the reason the calendar is capped.",
  },
  {
    id: "faq-vendors",
    question: "Can we keep our own vendors?",
    answer:
      "Yes. If your family has used a caterer for thirty years, that caterer stays. Our recommendations come from vendors we already have a working relationship with, but you are never restricted to them.",
  },
  {
    id: "faq-money",
    question: "How do payments work?",
    answer:
      "We build payment sheets for the venue and every vendor — advances, due dates, particulars — and you review and approve them before anything is processed. We send reminders ahead of each payment and chase the vendors, but the money goes from you to them.",
  },
  {
    id: "faq-onground",
    question: "Who is actually there on the day?",
    answer:
      "A designated representative plus a team organised into eight departments, including a shadow each for the bride and groom and showrunners for whatever was not on the schedule.",
  },
  {
    id: "faq-after",
    question: "What happens after the wedding?",
    answer:
      "A debrief with you, then a written report breaking down every expense across planning and execution, with any outstanding vendor payment identified.",
  },
  {
    id: "faq-when",
    question: "When should we get in touch?",
    answer:
      "As soon as you have a rough date and a rough number. The roadmap runs month by month, so the earlier it starts the more of it is useful.",
  },
];
