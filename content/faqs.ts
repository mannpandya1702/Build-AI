/**
 * FAQ accordion content. Answers stay short and direct — if an answer needs
 * more than four sentences it probably belongs on a service page instead.
 */

export type Faq = {
  id: string;
  question: string;
  answer: string;
};

export const faqs: Faq[] = [
  {
    id: "faq-cost",
    question: "How do you charge?",
    answer:
      "A flat planning fee based on the scale of the event, agreed before we start. We do not take commission from vendors, and every vendor quote comes to you unmarked.",
  },
  {
    id: "faq-scale",
    question: "Is there a minimum event size?",
    answer:
      "No. We have run a sixty-guest wedding at home and a four-day one for three hundred and forty. The planning is the same discipline at either end.",
  },
  {
    id: "faq-vendors",
    question: "Can we keep our own vendors?",
    answer:
      "Yes. If your family has used a caterer for thirty years, that caterer stays. We will brief them and hold them to the run sheet like anyone else.",
  },
  {
    id: "faq-when",
    question: "When should we get in touch?",
    answer:
      "As soon as you have a rough date and a rough number. Six to nine months of runway is comfortable; we have worked with three, and we will tell you what changes when it is tight.",
  },
  {
    id: "faq-where",
    question: "Where do you work?",
    answer:
      "Bengaluru, Jaipur, Udaipur, Goa and Delhi NCR regularly. Elsewhere in India on request — travel and stay are quoted separately and shown to you at cost.",
  },
  {
    id: "faq-rituals",
    question: "We are not sure which rituals to keep.",
    answer:
      "That conversation is most of our first meeting. We will ask what your families actually do, what has quietly stopped, and what you want back. Nothing gets added because it photographs well.",
  },
  {
    id: "faq-team",
    question: "Who will actually be at our wedding?",
    answer:
      "The people you meet in the first meeting. We take one wedding per week so the team that planned it is the team on the ground.",
  },
];
