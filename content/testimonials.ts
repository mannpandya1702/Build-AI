/**
 * Testimonials. Keep quotes short — they are set at display size, one at a
 * time, so anything past ~200 characters starts to wrap badly on mobile.
 */

/**
 * ⚠️ Every quote below is INVENTED. They were written so the section had the
 * right shape and length while the page was built. The names are not real
 * clients and these must not be published as real client words.
 *
 * Flip this to false the moment the quotes below are replaced with real,
 * permissioned ones. The launch-readiness panel on /admin reads this flag, so
 * it is the single switch that tells the studio whether the site is safe to
 * publish on this point.
 */
export const TESTIMONIALS_ARE_PLACEHOLDERS = true;

export type Testimonial = {
  id: string;
  quote: string;
  name: string;
  /** Event and city, e.g. "Wedding, Udaipur". Shown small under the name. */
  context: string;
};

export const testimonials: Testimonial[] = [
  {
    id: "t-1",
    quote:
      "They asked about my grandmother's taak before they asked about the budget. That told me everything.",
    name: "Aditi & Rohan",
    context: "Wedding, Udaipur",
  },
  {
    id: "t-2",
    quote:
      "The haldi ran forty minutes late and I only found out afterwards, because nobody standing in that courtyard could tell.",
    name: "Meher S.",
    context: "Mehndi & Haldi, Bengaluru",
  },
  {
    id: "t-3",
    quote:
      "We had 340 guests across four days and my mother did not carry a single phone call. That was the whole point.",
    name: "The Anand family",
    context: "Wedding, Jaipur",
  },
  {
    id: "t-4",
    quote:
      "Our sangeet had eleven performances and it finished on time. I still do not know how.",
    name: "Kavya & Ishaan",
    context: "Sangeet, Goa",
  },
  {
    id: "t-5",
    quote:
      "They pushed back on two things we wanted and they were right both times. I would rather have that than a yes.",
    name: "Farhan Q.",
    context: "Engagement, Delhi NCR",
  },
];
