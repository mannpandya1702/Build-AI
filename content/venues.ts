/**
 * Wedding venues.
 *
 * Asked for by the studio 13 Aug 2026 — a venue page, linked from the
 * destinations page, following the structure of a competitor site they sent
 * (a domestic city list, each city leading to venue content).
 *
 * Built as ONE page with a section per region rather than ~18 separate
 * city pages. Reasoning, so the decision is reversible with the argument
 * intact: per-city pages rank better only when each carries real, distinct
 * content — named properties, room counts, photographs. Riwaaya has not sent
 * those yet, and eighteen near-identical pages of generic copy is the exact
 * pattern search engines demote as doorway content. This page is the hub; when
 * real venue lists arrive for a city, that city graduates to its own page and
 * this one links to it.
 *
 * NOTHING HERE NAMES A SPECIFIC PROPERTY. Every claim is about venue *types*
 * and the questions to ask of them, which is true regardless of which hotel a
 * family ends up in. Naming properties the studio has no relationship with
 * would be the same mistake as the invented testimonials.
 */

export const venueIntro = {
  eyebrow: "Wedding venues",
  title: "The venue is a logistics decision wearing a nice dress.",
  lede: "Every venue photographs well. What separates them is how many people can sleep there, whether the kitchen can cook for all of them at once, and what happens to your lawn ceremony when it rains.",
  paragraphs: [
    "Families usually arrive with a venue in mind and a guest list not yet counted. We do it the other way round. The guest list sets the number of rooms; the rooms rule out most of the shortlist; what survives gets visited.",
    "We are not paid by venues and we do not take a commission on the booking, so the shortlist you get is the one we would choose ourselves. Where a property is wrong for you, we say so and say why — usually in room counts and kitchen covers rather than in taste.",
    "Below is how we read a venue, and what the venues are actually like in the places we are asked for most.",
  ],
};

/** The venue types a family will actually be choosing between, in India. */
export type VenueType = {
  id: string;
  title: string;
  guests: string;
  body: string;
  /** The thing that most often goes wrong with this type. */
  watch: string;
};

export const venueTypes: VenueType[] = [
  {
    id: "palace",
    title: "Palace & fort properties",
    guests: "Typically 80–250 in-house",
    body: "The reason most families look at Rajasthan. Courtyards that need almost no decor, and a ceremony that sits inside real architecture rather than a set built to imitate it.",
    watch: "Room count is nearly always lower than the banqueting capacity. A property that seats four hundred may sleep ninety, which turns one wedding into two hotels and a coach schedule.",
  },
  {
    id: "hotel",
    title: "Five-star hotels & resorts",
    guests: "150–600 in-house",
    body: "The most predictable option and, for a large guest list, usually the right one. Everything is on one site: rooms, banquets, lawns, kitchens, and a duty manager who has done this before.",
    watch: "In-house catering is often mandatory. Check covers per hour and whether a separate satvik or jain kitchen is possible before you fall in love with the lawn.",
  },
  {
    id: "heritage",
    title: "Heritage havelis & homes",
    guests: "40–150 in-house",
    body: "Old family houses, converted. Character no hotel can manufacture, and the best setting in India for a mehndi that runs into the afternoon.",
    watch: "Power, service access and bathroom counts. Beautiful old buildings were not designed for three hundred people and a full production rig.",
  },
  {
    id: "farmhouse",
    title: "Farmhouses & banquet estates",
    guests: "200–1000, guests stay off-site",
    body: "The standard around Delhi NCR, Chandigarh and Ludhiana. Enormous flexibility on decor and catering, and the option to build the whole thing to your own plan.",
    watch: "Guests sleep elsewhere, so hospitality becomes a transport problem. Sound curfews are strictly enforced in NCR — confirm the cut-off in writing.",
  },
  {
    id: "hill",
    title: "Hill properties",
    guests: "40–150 in-house",
    body: "Deodar, cold mornings, and a wedding that feels private because it genuinely is. Close enough to Chandigarh that elderly guests are driven rather than flown.",
    watch: "Weather and road access. Every outdoor function needs a covered alternative dressed to the same standard, and decor trucks need to physically reach the lawn.",
  },
  {
    id: "beach",
    title: "Beach & waterfront",
    guests: "60–250 in-house",
    body: "Goa, and the coastal properties around it. Sunset ceremonies, and an event that guests treat as a holiday — budget four days, not three.",
    watch: "Wind, tide timing and public-beach permissions. A sunset phera has exactly one correct start time and it is not the one on the invitation draft.",
  },
];

/**
 * Region sections. Anchors match `venueAnchor` in content/destinations.ts so
 * the destinations page can link a city straight to the right section.
 */
export type VenueRegion = {
  id: string;
  title: string;
  cities: string;
  body: string;
  /** Two or three concrete constraints, the sort a first call surfaces. */
  notes: { label: string; value: string }[];
  imageSlot: string;
  alt: string;
};

export const venueRegions: VenueRegion[] = [
  {
    id: "chandigarh",
    title: "Chandigarh, Mohali & Punjab",
    cities: "Chandigarh · Mohali · Panchkula · Ludhiana · Amritsar",
    body: "Home ground, and the easiest wedding we plan — the studio is in Mohali, so a recce is an afternoon rather than a flight. The region runs on farmhouse estates and large hotel banquets, with guest lists that are genuinely big and mostly local. Because guests drive in and out, hospitality shifts from rooming lists to parking, valet and a returning-home plan at two in the morning.",
    notes: [
      { label: "Best months", value: "October to March, plus a short February–April window" },
      { label: "Typical shape", value: "Farmhouse or hotel banquet, guests local and off-site" },
      { label: "Watch", value: "Sound curfews and parking capacity, both in writing before the deposit" },
    ],
    imageSlot: "venue-chandigarh",
    alt: "A lawn set for an evening wedding function near Chandigarh.",
  },
  {
    id: "delhi-ncr",
    title: "Delhi NCR & Gurgaon",
    cities: "Delhi · Gurgaon · Noida · Faridabad",
    body: "The deepest vendor market in the country — anything you can picture is available, and the price range for it is enormous. Farmhouses along the southern belt handle the largest guest lists; the hotels handle everything else. NCR is also the strictest place we work: sound cut-offs are enforced, open flame needs clearance, and the venue's own compliance record matters as much as its ballroom.",
    notes: [
      { label: "Best months", value: "October to March. Avoid the smog weeks in early November if you can" },
      { label: "Typical shape", value: "Farmhouse for scale, five-star for a contained three-day run" },
      { label: "Watch", value: "Sound curfew, air quality on outdoor dates, traffic between venues" },
    ],
    imageSlot: "venue-delhi-ncr",
    alt: "A banquet lawn in Delhi NCR laid out for a reception.",
  },
  {
    id: "rajasthan",
    title: "Rajasthan",
    cities: "Udaipur · Jaipur · Jodhpur · Jaisalmer · Agra",
    body: "Where most destination enquiries point. Udaipur is the most asked-for and the most oversubscribed — peak dates at the known palace properties go twelve to eighteen months ahead. Jaipur does the same job with more rooms and better roads, which matters more than families expect. Jodhpur and Jaisalmer are quieter and photograph differently, at the cost of a thinner local vendor bench.",
    notes: [
      { label: "Best months", value: "October to March; November to February in Jodhpur and Jaisalmer" },
      { label: "Typical shape", value: "Palace or fort property, guests in-house, three to four days" },
      { label: "Watch", value: "Rooms versus banqueting capacity — the gap is where the budget goes" },
    ],
    imageSlot: "venue-rajasthan",
    alt: "A palace courtyard in Rajasthan set for an evening function.",
  },
  {
    id: "hills",
    title: "The hills",
    cities: "Kasauli · Shimla · Mussoorie · Dehradun · Rishikesh · Haridwar · Jim Corbett",
    body: "Two hours from the studio and the reason many Chandigarh families never look further. Properties are small — most cap around a hundred and fifty — so this is a hill wedding for a guest list that was already intimate. Rishikesh and Haridwar add their own rules: several properties are dry and vegetarian by policy, and river-facing setups need permissions that take weeks rather than days.",
    notes: [
      { label: "Best months", value: "March to June, and September to November" },
      { label: "Typical shape", value: "Single boutique property, whole-venue buyout, sixty to a hundred and fifty guests" },
      { label: "Watch", value: "A wet-weather plan that looks like it was always the plan, not a compromise" },
    ],
    imageSlot: "venue-hills",
    alt: "A hillside lawn in the Himachal foothills laid for a morning function.",
  },
  {
    id: "coast",
    title: "The coast & the south",
    cities: "Goa · Mumbai · Kerala",
    body: "Goa is the one destination where guests plan a holiday around your wedding, so it runs as a four-day event. Beach ceremonies need a sunset time and a wind plan, both checked on the recce rather than assumed; the Portuguese-era houses inland are cooler, more private and better suited to a haldi than any beach has ever been. Kerala's backwater resorts work the same way, with a longer travel day for northern guests.",
    notes: [
      { label: "Best months", value: "November to February on both coasts" },
      { label: "Typical shape", value: "Resort buyout or villa cluster, four days, guests staying on" },
      { label: "Watch", value: "Public-beach permissions, wind after four o'clock, and flight loads over New Year" },
    ],
    imageSlot: "venue-coast",
    alt: "A garden courtyard at a Portuguese-era house in Goa laid for dinner.",
  },
];

/** How the shortlist gets built — the promise the page has to keep. */
export const venueProcess = [
  {
    id: "brief",
    index: "01",
    title: "Numbers before names",
    body: "Guest list, rooms needed, functions, budget ceiling and the two or three things the family will not compromise on. Fifteen minutes, and it eliminates most of the internet.",
  },
  {
    id: "shortlist",
    index: "02",
    title: "A shortlist of three",
    body: "We do the first pass without you — availability, room counts, floor plans, real costs including the ones that appear later. You get three, with the trade-offs of each written down.",
  },
  {
    id: "recce",
    index: "03",
    title: "One trip, two venues",
    body: "You travel once, to see the two actually in contention, in the season you are marrying in and at the time of day each function will run.",
  },
  {
    id: "contract",
    index: "04",
    title: "Terms, then deposit",
    body: "Sound curfew, kitchen terms, decor access, cancellation and every inclusion confirmed in writing before a rupee moves. You approve the contract; we negotiate it.",
  },
];

export const venueFaqs = [
  {
    id: "venue-faq-commission",
    question: "Do you take a commission from venues?",
    answer:
      "No. We are paid by you, which is what lets us tell you a property is wrong. Where a venue offers a planner rate, it is passed through to you and shown in the budget sheet.",
  },
  {
    id: "venue-faq-own-venue",
    question: "We have already picked a venue. Can you still work with us?",
    answer:
      "Yes, and it happens often. We take the property as given and plan around its constraints — we will still walk it, read the contract and tell you plainly what it can and cannot do, so nothing surprises you in the last week.",
  },
  {
    id: "venue-faq-rooms",
    question: "How many rooms do we actually need?",
    answer:
      "As a rough rule, one room per two adult guests staying, plus fifteen per cent for family arriving early and vendors staying on site. We build the real number from the rooming list, by name, rather than from a percentage.",
  },
  {
    id: "venue-faq-two-venues",
    question: "Is it a problem if guests stay at two hotels?",
    answer:
      "It is workable and it is a different wedding. Two properties means two hospitality desks, a coach schedule between them and a real risk of guests missing functions. If the guest list needs it, we plan for it from the start rather than discovering it at the room-block stage.",
  },
  {
    id: "venue-faq-outside-caterer",
    question: "Can we bring our own caterer?",
    answer:
      "At some venues yes, at many no, and the answer changes what the property costs. It is one of the first things we confirm — before a venue goes on your shortlist, not after you have paid to hold a date.",
  },
  {
    id: "venue-faq-when",
    question: "When should we lock the venue?",
    answer:
      "Twelve to eighteen months ahead for a peak-season date at a well-known property, and around nine months for most others. Inside six months we will tell you honestly which venues are still realistic rather than chase a deposit.",
  },
];
