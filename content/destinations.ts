/**
 * Destination weddings.
 *
 * The studio's Pinterest bio describes the work as "destination celebrations",
 * and the client asked for a page dedicated to venues. This is that page's
 * content.
 *
 * PLACEHOLDER WARNING: the six regions below are the ones a Chandigarh studio
 * would plausibly work in, and the seasons and travel times are correct, but
 * nobody has confirmed which of these Riwaaya has actually run a wedding in.
 * Confirm the list before launch and cut anything they have not done — every
 * other claim on this site is grounded in the signed scope of work, and this
 * page should be too. Guest counts and lead times are the studio's to set.
 */

export const destinationIntro = {
  eyebrow: "Destination weddings",
  title: "A wedding that travels is a different job.",
  lede: "Not a harder one, but a different one. The rituals stay exactly as they were. Everything around them — rooms, roads, kitchens, permissions — has to be built from nothing at the other end.",
  paragraphs: [
    "Most of what makes a destination wedding go wrong has nothing to do with the wedding. It is a coach that leaves without four people. A room block that quietly shrank. A pandit who cannot get to the mandap because the service lift is holding flowers.",
    "We plan those parts as carefully as the pheras. The venue is chosen after the guest list, not before it, because the number of rooms a family actually needs decides more than any photograph of a lawn ever will.",
    "Riwaaya takes one wedding at a time. For a destination that matters more than usual: the whole team travels, and nobody on your wedding is also running someone else's that week.",
  ],
};

export type Destination = {
  id: string;
  name: string;
  region: string;
  /** One line, under ~70 characters. Sits under the name on the card. */
  blurb: string;
  body: string;
  /** Best months to hold a function there. */
  season: string;
  /** How guests get there, honestly stated. */
  travel: string;
  imageSlot: string;
  alt: string;
};

export const destinations: Destination[] = [
  {
    id: "udaipur",
    name: "Udaipur",
    region: "Rajasthan",
    blurb: "Lake palaces, courtyard havelis, and long golden evenings.",
    body: "The most asked-for destination in the country, and the most oversubscribed. Dates at the well-known palace properties go twelve to eighteen months ahead, so Udaipur is a decision you make early or not at all. Worth knowing: the ghat venues are beautiful and small. If your guest list runs past two hundred, the wedding usually splits across two properties and a boat transfer, which is a logistics problem before it is a romantic one.",
    season: "October to March",
    travel: "Direct flights from Delhi and Mumbai, then 30–45 minutes by road.",
    imageSlot: "destination-udaipur",
    alt: "A lakeside palace courtyard in Udaipur set for an evening function.",
  },
  {
    id: "jaipur",
    name: "Jaipur",
    region: "Rajasthan",
    blurb: "Fort courtyards and city havelis, with the rooms to match.",
    body: "Jaipur does what Udaipur does, with more room and better roads. There are properties here that can hold three hundred guests on one site, which means no coach convoys between functions and no guests marooned at the wrong hotel. The forts on the edge of the city suit a sangeet; the havelis in the old town suit a mehndi that runs into the afternoon.",
    season: "October to March",
    travel: "Direct flights from most metros; six hours by road from Chandigarh.",
    imageSlot: "destination-jaipur",
    alt: "A haveli courtyard in Jaipur with seating laid out for a mehndi.",
  },
  {
    id: "jodhpur",
    name: "Jodhpur",
    region: "Rajasthan",
    blurb: "Sandstone, open desert light, and fewer weddings competing.",
    body: "Quieter than Udaipur and Jaipur, and photographs differently — the light is harder and the stone is warmer. Jodhpur suits families who want a fort wedding without the queue for one. The trade-off is depth of supply: there are fewer vendors on the ground, so more of the team and the equipment travels in with us, which shows up in the budget rather than in the day.",
    season: "November to February",
    travel: "Flights via Delhi or Mumbai; the airport is 15 minutes from the city.",
    imageSlot: "destination-jodhpur",
    alt: "A sandstone fort terrace in Jodhpur at first light.",
  },
  {
    id: "kasauli",
    name: "Kasauli and the foothills",
    region: "Himachal Pradesh",
    blurb: "Deodar, cold mornings, and close enough to drive.",
    body: "Our home ground. Two hours from Chandigarh, which means the family can do a recce on a Saturday and elderly guests are not put on a flight. The properties are small — most cap out around a hundred and fifty — so this is a hill wedding for a guest list that was already going to be intimate. Plan for weather: an outdoor phera in February needs a covered fallback that looks like it was always the plan.",
    season: "March to June, and September to November",
    travel: "Two hours by road from Chandigarh; the nearest airport is Chandigarh.",
    imageSlot: "destination-kasauli",
    alt: "A hillside lawn in the Himachal foothills laid for a morning function.",
  },
  {
    id: "rishikesh",
    name: "Rishikesh",
    region: "Uttarakhand",
    blurb: "The Ganga, and a baraat that comes down to the water.",
    body: "For families who want the ritual to sit where the ritual comes from. Riverside properties here are genuinely quiet, and a ganga aarti the evening before the wedding is something guests talk about for years. Two practical notes: many properties are dry and vegetarian by policy, and river-facing setups need permissions that take weeks. Both are workable, neither is a surprise we would let you find late.",
    season: "September to November, and February to April",
    travel: "Flights to Dehradun, then 45 minutes by road.",
    imageSlot: "destination-rishikesh",
    alt: "A riverside terrace near Rishikesh set for an evening aarti.",
  },
  {
    id: "goa",
    name: "Goa",
    region: "West coast",
    blurb: "Beach lawns, Portuguese-era houses, and an easier guest list.",
    body: "Goa is the one destination where guests plan to stay on afterwards, so treat it as a four-day event rather than a three-day one. Beach ceremonies need a sunset time and a wind plan, and both are checked on the recce rather than assumed. The old-town houses inland are the underrated option — cooler, more private, and better suited to a haldi than any beach has ever been.",
    season: "November to February",
    travel: "Direct flights from every metro; 45–90 minutes by road from either airport.",
    imageSlot: "destination-goa",
    alt: "A garden courtyard at a Portuguese-era house in Goa laid for dinner.",
  },
];

/**
 * The venue shortlist is built against these, in this order. Written as
 * questions because that is how the first venue conversation actually runs.
 */
export const venueCriteria = [
  {
    id: "rooms",
    title: "How many rooms, really",
    body: "Guest list first, venue second. A property that seats four hundred but sleeps ninety turns into two hotels, a coach schedule and a hospitality desk in each — a different wedding, and a different budget.",
  },
  {
    id: "functions",
    title: "Where each function sits",
    body: "Mehndi, haldi, sangeet, pheras and the reception all want different light, different noise tolerance and different floor. We map every function to a specific space on the recce, not to a name on a brochure.",
  },
  {
    id: "kitchen",
    title: "What the kitchen can hold",
    body: "In-house catering is a constraint, not a convenience. We check covers per hour, whether a separate satvik or jain kitchen is possible, and whether an outside caterer is allowed before the venue goes on the shortlist.",
  },
  {
    id: "access",
    title: "How things get in and out",
    body: "Service lifts, loading times, generator siting, and whether a decor truck can reach the lawn. This is the least romantic paragraph on this page and the one that decides most days.",
  },
  {
    id: "permissions",
    title: "What needs permission",
    body: "Sound curfews, drone clearance, open flame for the havan, river or beach access. All of it is confirmed in writing before a deposit is paid.",
  },
  {
    id: "weather",
    title: "What happens if it rains",
    body: "Every outdoor function gets a covered alternative that is dressed to the same standard. A wet-weather plan that looks like a compromise is not a plan.",
  },
];

/** What actually differs from a wedding at home, as the family will feel it. */
export const destinationDifferences = [
  {
    id: "recce",
    title: "A recce before a rupee",
    body: "We walk the property with you, in the season you are marrying in, at the time of day each function will run. Photographs are taken for the file, not for a moodboard.",
  },
  {
    id: "rooming",
    title: "A rooming list, by name",
    body: "Every guest assigned to a room, with arrival and departure times, dietary notes and who is next to whom. It is the single document that prevents the most trouble.",
  },
  {
    id: "movement",
    title: "Movement, planned to the minute",
    body: "Airport pickups, coach manifests, buggy routes inside the property, and a named person counting heads at each departure. Nobody is left behind at a Riwaaya wedding.",
  },
  {
    id: "travelling-team",
    title: "The team travels with you",
    body: "The same people you planned with are the people on site. We do not hand a destination wedding to a local coordinator on arrival and brief them by phone.",
  },
  {
    id: "vendors",
    title: "Local where local is better",
    body: "Bringing everyone from home is expensive and often worse. Flowers, labour and equipment are usually local; the decor lead, the kitchen supervisor and the showrunner are usually not.",
  },
  {
    id: "guests",
    title: "One desk, always open",
    body: "A hospitality desk in the lobby from the first arrival to the last departure, with a number that a guest can call at three in the morning and get a person.",
  },
];

/** Destination-specific questions, kept off the general FAQ. */
export const destinationFaqs = [
  {
    id: "dest-faq-lead",
    question: "How far ahead do we need to book?",
    answer:
      "Twelve to eighteen months for a peak-season date at a well-known property, and nine months for most others. If your date is inside six months we will tell you honestly which destinations are still realistic rather than chase a deposit.",
  },
  {
    id: "dest-faq-recce",
    question: "Do we have to travel for the venue visit?",
    answer:
      "We do a first pass without you and come back with a shortlist of three, with photographs, floor plans, room counts and costs. You travel once, to see the two that are actually in contention.",
  },
  {
    id: "dest-faq-cost",
    question: "Is a destination wedding more expensive?",
    answer:
      "Per guest, usually yes — you are paying for rooms and travel on top of the wedding. Total cost is often similar, because the guest list is smaller. We put both numbers side by side in the first budget so the decision is made with them visible.",
  },
  {
    id: "dest-faq-guests",
    question: "What about guests who cannot travel?",
    answer:
      "This is worth deciding early and out loud. Some families hold a reception at home afterwards for the people who could not come. If that is the plan, we budget and schedule it from the start rather than improvising it later.",
  },
  {
    id: "dest-faq-abroad",
    question: "Do you plan weddings outside India?",
    answer:
      "Ask us. We will say yes only where we can put our own team on the ground for the full run of functions, and no where we cannot. A destination we have to manage remotely is not a destination we will take on.",
  },
];
