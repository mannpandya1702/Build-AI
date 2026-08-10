/**
 * About page content.
 *
 * The name explanation, positioning and the is / is not list are taken from
 * the Riwaaya Brand Identity Deck (2026) and kept close to its wording — it is
 * the brand's own voice and should not be paraphrased into something softer.
 */

export type Principle = {
  id: string;
  title: string;
  body: string;
};

export type TeamMember = {
  id: string;
  name: string;
  role: string;
  /** Named slot for the client's headshot. Square crop. */
  imageSlot: string;
  alt: string;
};

export const story = {
  lede: "Riwaaya is riwaayat in the singular — not tradition in general, but this family's version of it.",
  /** From the deck: what was taken from the word. */
  fromTheName: ["Inherited, not invented", "Specific to one family", "Meant to be passed on"],
  paragraphs: [
    "Riwaayat is an Urdu and Hindi noun: custom, tradition — the practice a family repeats until it belongs to them. The brand exists to find that one thread in every wedding and build the celebration around it.",
    "So we take on a small number of weddings each year, for families who want the rituals taken seriously and would rather their celebration feel quietly theirs than loudly grand. The work is full-service: eleven lines of it, from the first roadmap to the final payment sheet.",
    "Every choice we make exists to keep one thing legible — that this wedding belongs to this family, and no one else.",
  ],
};

/** The deck's "Riwaaya is / is not" list, verbatim in substance. */
export const isIsNot: { is: string; isNot: string }[] = [
  {
    is: "Restrained. Pastel, paper, daylight.",
    isNot: "Maximal. No gold-on-gold, no spotlights.",
  },
  {
    is: "Ritual-first. The ceremony leads the design.",
    isNot: "Trend-led. No theme borrowed from a feed.",
  },
  {
    is: "Documented. Sheets, timelines, receipts.",
    isNot: "Volume. Not many weddings at once.",
  },
  {
    is: "Present. A named person on the ground.",
    isNot: "Anonymous. No faceless coordination.",
  },
];

export const principles: Principle[] = [
  {
    id: "p-roots",
    title: "Roots",
    body: "We start with the family's own customs, not a moodboard. The ritual sets the palette.",
  },
  {
    id: "p-order",
    title: "Order",
    body: "Roadmaps, vendor sheets, payment schedules. Calm is a document, not a mood.",
  },
  {
    id: "p-welcome",
    title: "Welcome",
    body: "A desk that never closes, a call to every room. Guests should never have to ask twice.",
  },
  {
    id: "p-presence",
    title: "Presence",
    body: "Shadows for the couple, showrunners for the day, a debrief after. We stay to the end.",
  },
];

export const team: TeamMember[] = [
  {
    id: "team-1",
    name: "Bhumi Sandhu",
    role: "Founder",
    imageSlot: "team-01-bhumi-sandhu",
    alt: "Portrait of Bhumi Sandhu, founder of Riwaaya.",
  },
  // PLACEHOLDER — replace names, roles and headshots with the real team.
  {
    id: "team-2",
    name: "Team member",
    role: "Planning & budget",
    imageSlot: "team-02-headshot",
    alt: "Portrait of Riwaaya's planning and budget lead.",
  },
  {
    id: "team-3",
    name: "Team member",
    role: "Hospitality",
    imageSlot: "team-03-headshot",
    alt: "Portrait of Riwaaya's hospitality lead.",
  },
  {
    id: "team-4",
    name: "Team member",
    role: "On-site production",
    imageSlot: "team-04-headshot",
    alt: "Portrait of Riwaaya's on-site production lead.",
  },
];

/** The eight on-site departments, from the scope of work. */
export const departments = [
  "Hospitality & check-ins",
  "Bride & groom concierge",
  "Food & dining",
  "Bar management",
  "Floral & decor",
  "Sound & production",
  "Vendor audit",
  "Payments",
] as const;
