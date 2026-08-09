/**
 * About page content — story, philosophy and team slots.
 * Team headshots are placeholders until the client supplies photography.
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
  lede: "Riwaaya comes from riwaayat — custom, tradition. We read it as singular: not tradition in the abstract, but one family's version of it.",
  paragraphs: [
    "We started because the weddings we were being asked to work on kept getting bigger and saying less. Every brief arrived with the same references, and the parts families actually talked about afterwards — the haldi in a courtyard, the taak their grandmother lit — were the parts nobody had planned.",
    "So we plan those first. We ask what your families already do before we ask what you want to build. Then we design outward from there, and we say no to the things that only exist for the photographs.",
    "The work is quieter than most of what the industry puts out. That is deliberate. A wedding should look like the people in it.",
  ],
};

export const principles: Principle[] = [
  {
    id: "p-ritual",
    title: "Ritual first",
    body: "We begin with what your family keeps, not with a venue. The design follows the rituals; it does not replace them.",
  },
  {
    id: "p-one",
    title: "One wedding a week",
    body: "The team you meet is the team on the ground. Nobody is at another function on your haldi morning.",
  },
  {
    id: "p-money",
    title: "No vendor commission",
    body: "We charge a flat planning fee and pass every vendor quote to you unmarked. What you pay them is what they quoted.",
  },
  {
    id: "p-less",
    title: "Fewer, better decisions",
    body: "We would rather do six things properly than twenty adequately. We will tell you which six.",
  },
];

export const team: TeamMember[] = [
  // PLACEHOLDER — replace names, roles and headshots with the real team.
  {
    id: "team-1",
    name: "Team member",
    role: "Founder, planning",
    imageSlot: "team-01-headshot",
    alt: "Portrait of Riwaaya's founder and head of planning.",
  },
  {
    id: "team-2",
    name: "Team member",
    role: "Design direction",
    imageSlot: "team-02-headshot",
    alt: "Portrait of Riwaaya's design director.",
  },
  {
    id: "team-3",
    name: "Team member",
    role: "Production",
    imageSlot: "team-03-headshot",
    alt: "Portrait of Riwaaya's head of production.",
  },
  {
    id: "team-4",
    name: "Team member",
    role: "Guest logistics",
    imageSlot: "team-04-headshot",
    alt: "Portrait of Riwaaya's guest logistics lead.",
  },
];
