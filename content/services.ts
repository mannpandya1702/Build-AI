/**
 * Services. Edit copy here — components read this file and nothing else.
 * `slug` drives /services/[slug], so changing one changes the URL.
 */

export type Service = {
  slug: string;
  title: string;
  /** One line, used on the home card. Keep it under ~90 characters. */
  summary: string;
  /** Two or three sentences on the detail page. Plainspoken, no superlatives. */
  intro: string;
  /** What is actually included. Shown as a plain list, not ticked bullets. */
  includes: string[];
  /** Short answers to the questions families actually ask. */
  notes: { heading: string; body: string }[];
  /** Aspect ratio for the image slot on the detail page hero. */
  heroAspect: string;
  /** Named slot the client fills with real photography. */
  imageSlot: string;
  /** Prefills the WhatsApp message on this page. */
  whatsappPrefill: string;
};

export const services: Service[] = [
  {
    slug: "weddings",
    title: "Weddings",
    summary: "Full planning from the first phone call to the last vidaai car.",
    intro:
      "We take the whole wedding — dates, vendors, budget, run sheet, and the hundred small decisions in between. One team stays with you the entire way, so nobody has to be told the same thing twice.",
    includes: [
      "Date and venue shortlisting",
      "Budget built with you, tracked against actuals",
      "Vendor contracting and payment schedule",
      "Design direction for every function",
      "Guest logistics, rooming and travel",
      "On-ground team for the full wedding week",
    ],
    notes: [
      {
        heading: "How far ahead should we book?",
        body: "Six to nine months is comfortable. We have done three, and we will tell you honestly what changes when the runway is short.",
      },
      {
        heading: "Do you take more than one wedding a week?",
        body: "No. One wedding gets one team, and that team is not somewhere else on your haldi morning.",
      },
    ],
    heroAspect: "16 / 10",
    imageSlot: "service-weddings-hero",
    whatsappPrefill: "Hi Riwaaya, I'd like to plan a wedding.",
  },
  {
    slug: "mehndi-haldi",
    title: "Mehndi & Haldi",
    summary: "The daytime functions, where most of the actual memories get made.",
    intro:
      "Mehndi and haldi are usually planned last and remembered first. We treat them as their own events — their own light, their own seating, their own sound — instead of a warm-up to the wedding.",
    includes: [
      "Daylight-first design and seating",
      "Mehndi artists booked by hand speed, not headcount",
      "Haldi setup that survives turmeric",
      "Music and dhol coordination",
      "Family choreography slots in the run sheet",
      "Photo plan for the hours people forget to shoot",
    ],
    notes: [
      {
        heading: "Can we do both in one day?",
        body: "Often yes. It depends on the haldi finishing early enough for everyone to change. We will map the hours before you commit.",
      },
      {
        heading: "We want it at home.",
        body: "Good. Home functions are our favourite. We will survey the space and tell you what fits before anything is booked.",
      },
    ],
    heroAspect: "16 / 10",
    imageSlot: "service-mehndi-haldi-hero",
    whatsappPrefill: "Hi Riwaaya, I'd like to plan a mehndi and haldi.",
  },
  {
    slug: "sangeet",
    title: "Sangeet",
    summary: "Rehearsals, running order, sound and lights — held together properly.",
    intro:
      "A sangeet lives or dies on its running order. We build the sequence, run the rehearsals, and keep the night moving so nobody is standing in the dark waiting for a track to start.",
    includes: [
      "Running order and rehearsal schedule",
      "Sound, lighting and stage design",
      "Track collection and cue sheet",
      "Green room and changeover plan",
      "MC briefing and family cues",
      "Late-night dinner timing",
    ],
    notes: [
      {
        heading: "Do you arrange choreographers?",
        body: "Yes, and we schedule rehearsals around the people who are travelling in, not the other way round.",
      },
      {
        heading: "How long should it run?",
        body: "Three hours of programme is plenty. Anything longer and the room starts to drift.",
      },
    ],
    heroAspect: "16 / 10",
    imageSlot: "service-sangeet-hero",
    whatsappPrefill: "Hi Riwaaya, I'd like to plan a sangeet.",
  },
  {
    slug: "engagements",
    title: "Engagements",
    summary: "Smaller rooms, closer families, and a great deal less noise.",
    intro:
      "Engagements are usually the first time both families sit in one room. We keep the guest list, the seating and the schedule tight enough that people actually talk to each other.",
    includes: [
      "Intimate venue sourcing",
      "Seating designed for two families meeting",
      "Ring ceremony sequencing",
      "Catering for a shorter, quieter evening",
      "Photography brief for a small room",
      "Invitation and RSVP handling",
    ],
    notes: [
      {
        heading: "What size do you take?",
        body: "From twenty guests upward. Below that we will happily point you to a good restaurant instead of charging you for a planner.",
      },
      {
        heading: "Can it roll into the wedding planning?",
        body: "Yes. If you carry on with us, the engagement fee comes off the wedding.",
      },
    ],
    heroAspect: "16 / 10",
    imageSlot: "service-engagements-hero",
    whatsappPrefill: "Hi Riwaaya, I'd like to plan an engagement.",
  },
  {
    slug: "corporate-private",
    title: "Corporate & Private Events",
    summary: "Launches, offsites, milestone dinners. Run to the minute.",
    intro:
      "The same planning discipline, pointed at work. Launches, annual days, offsites and private milestone dinners — briefed properly, run to a schedule, and reported on afterwards.",
    includes: [
      "Brief, budget and approval trail",
      "Venue and AV sourcing",
      "Run sheet to the minute",
      "Speaker and guest handling",
      "Branding production and installation",
      "Post-event cost and attendance report",
    ],
    notes: [
      {
        heading: "Do you invoice on company terms?",
        body: "Yes. GST invoice, purchase order references and net-30 where your finance team needs it.",
      },
      {
        heading: "How much notice do you need?",
        body: "Four weeks for a dinner, eight for anything with a stage and a stream.",
      },
    ],
    heroAspect: "16 / 10",
    imageSlot: "service-corporate-hero",
    whatsappPrefill: "Hi Riwaaya, I'd like to plan a corporate or private event.",
  },
  {
    slug: "destination",
    title: "Destination",
    summary: "Udaipur, Goa, Jaipur and further. We travel with the wedding.",
    intro:
      "A destination wedding is a logistics problem wearing a nice outfit. We handle the movement of people and things, so the family arrives to a room that is ready and a schedule that holds.",
    includes: [
      "Property recce and hold negotiation",
      "Guest travel, transfers and rooming",
      "Local vendor sourcing and vetting",
      "Permits, licences and sound cut-offs",
      "Freight for decor and production",
      "Full on-site team for the stay",
    ],
    notes: [
      {
        heading: "Which cities do you work in?",
        body: "Bengaluru, Jaipur, Udaipur, Goa and Delhi NCR regularly. Elsewhere in India on request, and we will be upfront about travel cost.",
      },
      {
        heading: "Who deals with the property?",
        body: "We do. One point of contact for the hotel, so the family is not negotiating room blocks over WhatsApp at midnight.",
      },
    ],
    heroAspect: "16 / 10",
    imageSlot: "service-destination-hero",
    whatsappPrefill: "Hi Riwaaya, I'd like to plan a destination wedding.",
  },
];

export function getService(slug: string): Service | undefined {
  return services.find((service) => service.slug === slug);
}
