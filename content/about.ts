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

/**
 * The founder's story, supplied by the studio 13 Aug 2026 and used as sent.
 *
 * ⚠️ The message arrived truncated: the fourth paragraph was cut mid-sentence
 * at "Today, Bhumi channels that same passion and precision into ever…". Rather
 * than invent an ending for a real person's biography, the three complete
 * paragraphs are published and the fourth is omitted. Send the rest and it
 * drops straight into the array below.
 */
export const founder = {
  name: "Bhumi Sandhu",
  role: "Founder & Director, Riwaaya",
  imageSlot: "team-01-bhumi-sandhu",
  alt: "Portrait of Bhumi Sandhu, founder and director of Riwaaya.",
  /** Pulled out as the opening line so the section leads on the person. */
  lede: "Riwaaya is one person's studio, and that is the point — you are working with the founder, not a coordinator assigned to your file.",
  paragraphs: [
    "Bhumi Sandhu is the founder and director of Riwaaya, a Chandigarh-based wedding and event planning company built on her vision of turning celebrations into unforgettable experiences. Hailing from Jammu, Bhumi has always carried big dreams and an unshakeable drive to create something meaningful of her own.",
    "Her journey began in the world of modeling, where she first honed her eye for aesthetics, presentation, and detail. But destiny had other plans — a path that led her from the runway to the world of event planning, where her creative instincts found a bigger canvas to express themselves. What started as an unexpected shift soon became her true calling.",
  ],
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

/**
 * The three placeholder "Team member" entries that used to sit beside the
 * founder were cut on the studio's instruction, 13 Aug 2026 ("Only the
 * founder"). The About page now runs a founder profile instead of a team grid.
 *
 * TeamMember is kept because the grid can come back the moment there are real
 * names and headshots to put in it — see the git history for the markup.
 */
export const team: TeamMember[] = [];

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
