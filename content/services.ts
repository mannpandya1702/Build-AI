/**
 * The eleven lines of work.
 *
 * These are taken from the signed scope of work ("List of Services — Riwaaya
 * by Bhumi Sandhu") and grouped under the four brand pillars from the identity
 * deck. They replace an earlier set of six invented event-type services; the
 * business is full-service wedding planning and hospitality, not a menu of
 * function types.
 *
 * `slug` drives /services/[slug]. `pillar` drives the grouping on the index.
 */

export type Pillar = "Roots" | "Order" | "Welcome" | "Presence";

export type Service = {
  slug: string;
  /** 01…11, shown in Cormorant beside the title. */
  index: string;
  title: string;
  pillar: Pillar;
  /** One line for the index card. Under ~95 characters. */
  summary: string;
  /** Two or three sentences. Plainspoken, no superlatives. */
  intro: string;
  /** What is actually delivered, drawn from the scope of work. */
  includes: string[];
  notes: { heading: string; body: string }[];
  heroAspect: string;
  imageSlot: string;
  whatsappPrefill: string;
};

/** The pillar definitions, from the identity deck. */
export const pillars: { name: Pillar; label: string; body: string }[] = [
  {
    name: "Roots",
    label: "Consultation",
    body: "We start with the family's own customs, not a moodboard. The ritual sets the palette.",
  },
  {
    name: "Order",
    label: "Planning & budget",
    body: "Roadmaps, vendor sheets, payment schedules. Calm is a document, not a mood.",
  },
  {
    name: "Welcome",
    label: "Hospitality",
    body: "A desk that never closes, a call to every room. Guests should never have to ask twice.",
  },
  {
    name: "Presence",
    label: "On-site & after",
    body: "Shadows for the couple, showrunners for the day, a debrief after. We stay to the end.",
  },
];

export const services: Service[] = [
  {
    slug: "planning-consultations",
    index: "01",
    title: "Planning & consultations",
    pillar: "Roots",
    summary: "Regular meetings, and a month-by-month roadmap from the first one.",
    intro:
      "We meet regularly and on schedule to plan, coordinate and manage everything in the agreed scope. From the start you hold a month-by-month roadmap — vendor list, event timeline, payment schedules — so you can see the whole thing at once rather than in fragments.",
    includes: [
      "Regular, scheduled planning consultations",
      "A month-by-month roadmap from day one",
      "Vendor list maintained throughout",
      "Event timeline kept current",
      "Payment schedules attached to the roadmap",
    ],
    notes: [
      {
        heading: "What happens in the first meeting?",
        body: "We ask what your families already do — what is kept, what has quietly stopped, what you want back. No moodboards. The ritual sets the palette, so we need to know the ritual first.",
      },
      {
        heading: "How often do we meet?",
        body: "Regularly and on a schedule, not only when something goes wrong. The roadmap tells you what is due each month before the meeting.",
      },
    ],
    heroAspect: "16 / 10",
    imageSlot: "service-planning-hero",
    whatsappPrefill: "Hi Riwaaya, I'd like to talk about planning and consultations.",
  },
  {
    slug: "budget-management",
    index: "02",
    title: "Budget management",
    pillar: "Order",
    summary: "One detailed budget for the whole wedding, built with you and tracked.",
    intro:
      "We build and present a detailed budget for the entire wedding, then help you allocate against it — venue, catering, decor, entertainment and everything else. The point is a financial plan that matches your priorities rather than an industry average.",
    includes: [
      "A detailed budget for the entire event",
      "Allocation across venue, catering, decor and entertainment",
      "A plan aligned to your stated priorities",
      "Tracked against actual spend as bookings confirm",
    ],
    notes: [
      {
        heading: "Do you take commission from vendors?",
        body: "Every vendor quote reaches you as quoted. The budget is a working document you can audit line by line.",
      },
      {
        heading: "What if the budget moves?",
        body: "It usually does. We update the allocation and show you what the change costs elsewhere before anything is committed.",
      },
    ],
    heroAspect: "16 / 10",
    imageSlot: "service-budget-hero",
    whatsappPrefill: "Hi Riwaaya, I'd like to talk about budget management.",
  },
  {
    slug: "event-timeline",
    index: "03",
    title: "Event timeline & schedule",
    pillar: "Order",
    summary: "A detailed run of the event days, kept current and shared with every vendor.",
    intro:
      "We build the timeline for the event days with you — pre-event preparation, the functions themselves, and everything after. It is updated as things change, and every relevant vendor is briefed on the timings that concern them.",
    includes: [
      "Detailed timeline for all event days, built with you",
      "Pre-event, main event and post-event phases",
      "Updated for changes and unforeseen circumstances",
      "Key timings communicated to every relevant vendor",
      "Logistical considerations mapped against the schedule",
    ],
    notes: [
      {
        heading: "Who else sees the timeline?",
        body: "Every vendor whose work depends on it. Most delays come from someone not knowing when they are needed, so we remove that excuse.",
      },
      {
        heading: "What happens when a function runs late?",
        body: "The timeline is managed and adjusted on the day. That is what the on-site team is for — the schedule absorbs the change instead of the family doing it.",
      },
    ],
    heroAspect: "16 / 10",
    imageSlot: "service-timeline-hero",
    whatsappPrefill: "Hi Riwaaya, I'd like to talk about the event timeline.",
  },
  {
    slug: "venue-selection",
    index: "04",
    title: "Venue selection & coordination",
    pillar: "Order",
    summary: "Research, site visits, and contracts negotiated on your behalf.",
    intro:
      "We research and present venues that fit your preferences, dates and budget, arrange site visits with a team member alongside you, and negotiate the contract. Nothing is signed until you have approved every term.",
    includes: [
      "Research and a shortlist matched to dates and budget",
      "Site visits accompanied by a team member",
      "Contract negotiation on your behalf",
      "Terms, conditions and pricing discussed and settled",
      "Your approval obtained before anything is executed",
    ],
    notes: [
      {
        heading: "Who negotiates with the property?",
        body: "We do. One point of contact, so the family is not settling room blocks over WhatsApp at midnight.",
      },
      {
        heading: "Can we change a term after negotiation?",
        body: "Any adjustment comes back to you for consent before it is executed. You see the contract as it lands, not afterwards.",
      },
    ],
    heroAspect: "16 / 10",
    imageSlot: "service-venue-hero",
    whatsappPrefill: "Hi Riwaaya, I'd like to talk about venue selection.",
  },
  {
    slug: "vendor-selection",
    index: "05",
    title: "Vendor selection & coordination",
    pillar: "Order",
    summary: "Vendors we have worked with, contracted properly and coordinated on the day.",
    intro:
      "We identify and recommend vendors — catering, photography, videography, florals, entertainment and the rest — from a pool we have an existing working relationship with, so the standard is known rather than hoped for. We run the meetings and the negotiations, then coordinate them through the event.",
    includes: [
      "Recommendations from pre-verified vendors",
      "Meetings arranged between you and each vendor",
      "Contract negotiation: terms, conditions, pricing",
      "Logistics coordinated with all vendors on event days",
      "Vendor audits against the agreed terms",
    ],
    notes: [
      {
        heading: "Can we keep our own vendors?",
        body: "Yes. If your family has used a caterer for thirty years, that caterer stays. We brief them and hold them to the timeline like anyone else.",
      },
      {
        heading: "Why only vendors you know?",
        body: "For recommendations, because a working relationship is the only real quality check. You are free to bring your own regardless.",
      },
    ],
    heroAspect: "16 / 10",
    imageSlot: "service-vendors-hero",
    whatsappPrefill: "Hi Riwaaya, I'd like to talk about vendor selection.",
  },
  {
    slug: "payment-schedule",
    index: "06",
    title: "Venue & vendor payment schedule",
    pillar: "Order",
    summary: "Payment sheets you approve before anything is paid, and reminders before it is due.",
    intro:
      "We create and maintain payment sheets for the venue and every vendor: particulars, transactions, advances paid, due dates. You review and approve them before any payment is processed, and we send reminders ahead of each one.",
    includes: [
      "Payment sheets for venue and all vendors",
      "Advances, due dates and transactions recorded",
      "Your review and approval before payments are processed",
      "A payment schedule issued as each vendor is confirmed",
      "Timely reminders with amount, due date and instructions",
      "Payment queries with vendors resolved on your behalf",
    ],
    notes: [
      {
        heading: "Who actually pays the vendors?",
        body: "You do, against sheets you have approved. We schedule, remind and reconcile — the money does not route through us.",
      },
      {
        heading: "What if we miss a reminder?",
        body: "We send them with the amount, due date and instructions. Acting on them stays with you, and a missed payment can cost a booking.",
      },
    ],
    heroAspect: "16 / 10",
    imageSlot: "service-payments-hero",
    whatsappPrefill: "Hi Riwaaya, I'd like to talk about payment schedules.",
  },
  {
    slug: "guest-management",
    index: "07",
    title: "Guest management & logistics",
    pillar: "Welcome",
    summary: "RSVPs, travel, rooming, and a hospitality desk that does not close.",
    intro:
      "We handle RSVPs by message and call, collect identification and travel details, and build the rooming lists, guest lists and logistics sheets. During the event a hospitality desk runs 24 hours at the main venue, and every room gets a call before it needs to be anywhere.",
    includes: [
      "RSVP messages and calls to every guest",
      "Identification and travel details collected",
      "Rooming lists, guest lists and logistics sheets",
      "Check-ins and check-outs managed",
      "A 24-hour hospitality desk at the main venue",
      "Reminder calls to each room during events",
      "Dietary, accessibility and special requests coordinated",
    ],
    notes: [
      {
        heading: "What does the hospitality desk do?",
        body: "It sits in the lobby of the venue where guests are staying and runs around the clock — enquiries, event information, coordination. It is the answer to 'who do I ask?'.",
      },
      {
        heading: "Why call every room?",
        body: "So guests arrive on time and know what is available to them — makeup, laundry, the rest. It is the difference between a schedule that holds and one that drifts.",
      },
    ],
    heroAspect: "16 / 10",
    imageSlot: "service-guests-hero",
    whatsappPrefill: "Hi Riwaaya, I'd like to talk about guest management.",
  },
  {
    slug: "food-beverage",
    index: "08",
    title: "Food & beverage management",
    pillar: "Welcome",
    summary: "Tastings, menu design, bar management, and an accurate final bill.",
    intro:
      "We schedule the tastings, help design and finalise the menu, and take full responsibility for liquor and bar service including procurement and licensing. Plates and bottles are counted during the event so the bill you receive is the one you owe.",
    includes: [
      "Food tasting sessions scheduled with venues and caterers",
      "Menu design and finalisation",
      "Liquor and bar service: procurement, service, compliance",
      "Plate and bottle counts during events for billing accuracy",
      "Oversight of hygiene and safe food handling",
    ],
    notes: [
      {
        heading: "Why count plates?",
        body: "Because catering is billed on consumption and nobody else is counting. It is unglamorous and it routinely changes the final invoice.",
      },
      {
        heading: "Do you handle the bar licence?",
        body: "Yes — procurement, service and compliance with the applicable regulations, including responsible service on the night.",
      },
    ],
    heroAspect: "16 / 10",
    imageSlot: "service-food-hero",
    whatsappPrefill: "Hi Riwaaya, I'd like to talk about food and beverage.",
  },
  {
    slug: "personnel",
    index: "09",
    title: "Experienced personnel assistance",
    pillar: "Presence",
    summary: "A shadow each for the couple, and showrunners for everything unplanned.",
    intro:
      "A dedicated team member shadows the bride and groom so their needs are handled without them having to ask. Showrunners take the last-minute tasks and the problems nobody scheduled, which is most of what a wedding day actually consists of.",
    includes: [
      "A dedicated shadow for the bride and groom",
      "Experienced showrunners for last-minute tasks",
      "Unforeseen issues addressed as they arise",
      "Vendor audits for accurate and timely delivery",
      "Overall coordination held by a named person",
    ],
    notes: [
      {
        heading: "What is a shadow?",
        body: "One person assigned to the couple for the day whose only job is them. They carry the schedule so the couple does not have to.",
      },
      {
        heading: "Will we meet the team beforehand?",
        body: "Yes. The people on the ground are the people you plan with — that is the reason the calendar is capped.",
      },
    ],
    heroAspect: "16 / 10",
    imageSlot: "service-personnel-hero",
    whatsappPrefill: "Hi Riwaaya, I'd like to talk about on-ground personnel.",
  },
  {
    slug: "on-site-coordination",
    index: "10",
    title: "On-site coordination & management",
    pillar: "Presence",
    summary: "A named representative on the ground, and eight departments behind them.",
    intro:
      "A designated representative and team are physically present on the wedding day: overseeing setup, coordinating vendors, monitoring milestones and managing transitions. When something goes wrong, crisis protocols exist so the response is not improvised.",
    includes: [
      "A designated representative present with the team",
      "Setup overseen and vendors coordinated on the day",
      "Key milestones monitored, transitions managed",
      "Crisis management protocols for the unforeseen",
      "Timeline adjustments communicated to every vendor",
    ],
    notes: [
      {
        heading: "The eight departments",
        body: "Hospitality and check-ins · bride and groom concierges · food and dining · bar management · floral and decor setup · sound checks and production · vendor audit and coordination · payment disbursement and finances.",
      },
      {
        heading: "What counts as a crisis?",
        body: "Weather, a vendor who does not arrive, a guest who needs a doctor. The protocol matters more than the list — someone acts without waiting to be asked.",
      },
    ],
    heroAspect: "16 / 10",
    imageSlot: "service-onsite-hero",
    whatsappPrefill: "Hi Riwaaya, I'd like to talk about on-site coordination.",
  },
  {
    slug: "post-event",
    index: "11",
    title: "Post-event follow-ups",
    pillar: "Presence",
    summary: "A debrief, and a full written breakdown of what everything cost.",
    intro:
      "After the event we sit down with you to go through what worked and what did not. You then receive a written report with a detailed breakdown of every expense incurred across planning and execution, and any vendor payment still outstanding.",
    includes: [
      "A post-event debriefing meeting",
      "Feedback gathered on the whole experience",
      "A written report breaking down all expenses",
      "Outstanding vendor payments clearly identified",
      "Additional post-event requests accommodated in writing",
    ],
    notes: [
      {
        heading: "Why a written report?",
        body: "Because 'roughly what did it cost' is a question families ask for years afterwards. The answer should be on paper, not in someone's memory.",
      },
      {
        heading: "How long after?",
        body: "The debrief happens while it is fresh. The report follows once final vendor invoices have settled.",
      },
    ],
    heroAspect: "16 / 10",
    imageSlot: "service-post-event-hero",
    whatsappPrefill: "Hi Riwaaya, I'd like to talk about post-event follow-ups.",
  },
];

export function getService(slug: string): Service | undefined {
  return services.find((service) => service.slug === slug);
}

export function servicesByPillar(pillar: Pillar): Service[] {
  return services.filter((service) => service.pillar === pillar);
}

/**
 * The functions we plan. Not separate services — the scope above covers a
 * wedding whole — but the words families search for and use.
 */
export const functions = [
  "Mehndi",
  "Haldi",
  "Sangeet",
  "Engagement",
  "Pheras",
  "Reception",
] as const;
