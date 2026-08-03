import type { LucideIcon } from "lucide-react";
import { Globe, MessagesSquare, AudioLines, Workflow } from "lucide-react";

/** Swap this for your real scheduling link (Cal.com / Calendly). */
export const BOOKING_URL = "https://cal.com/maana/intro";

export const site = {
  name: "Maana",
  /** "Una = one" — one accent, one idea, one clear next step. */
  tagline: "AI, engineered with restraint.",
  email: "hello@maana.agency",
};

export const nav = [
  { label: "Services", href: "#services" },
  { label: "Reviews", href: "#reviews" },
  { label: "Voice", href: "#voice" },
  { label: "Process", href: "#process" },
  { label: "FAQ", href: "#faq" },
] as const;

export type Service = {
  id: string;
  index: string;
  name: string;
  icon: LucideIcon;
  oneLiner: string;
  anchor: string;
  features: string[];
  cta: string;
};

export const services: Service[] = [
  {
    id: "websites",
    index: "01",
    name: "Websites",
    icon: Globe,
    oneLiner: "Fast, striking sites that convert without shouting.",
    anchor: "Custom quote",
    features: [
      "Design systems built to scale, not just a landing page",
      "Sub-second loads, perfect Lighthouse, zero jank",
      "Headless CMS so your team ships without us",
      "Motion that rewards attention instead of demanding it",
    ],
    cta: "Scope a site",
  },
  {
    id: "chatbots",
    index: "02",
    name: "Chatbots",
    icon: MessagesSquare,
    oneLiner: "Assistants that actually know your business.",
    anchor: "Custom quote",
    features: [
      "Grounded in your docs, tickets, and product — not hallucinations",
      "Handoff to humans the moment it matters",
      "Analytics on every unanswered question",
      "Deploys to your site, Slack, or WhatsApp",
    ],
    cta: "Design a bot",
  },
  {
    id: "voice",
    index: "03",
    name: "Voice",
    icon: AudioLines,
    oneLiner: "An agent that answers the phone like your best rep.",
    anchor: "Custom quote",
    features: [
      "Books, reschedules, and qualifies — 24/7, no hold music",
      "Natural turn-taking with sub-500ms latency",
      "Calendar, CRM, and payment integrations",
      "Every call transcribed, summarized, and routed",
    ],
    cta: "Hear a demo",
  },
  {
    id: "automations",
    index: "04",
    name: "Automations",
    icon: Workflow,
    oneLiner: "Quiet workflows that delete the busywork.",
    anchor: "Custom quote",
    features: [
      "Connect the tools you already pay for",
      "Human-in-the-loop where the stakes are high",
      "Observable runs — you see every step",
      "Built to fail safe, not silent",
    ],
    cta: "Map a workflow",
  },
];

export const processSteps = [
  {
    index: "01",
    title: "Discovery",
    body: "A short, sharp call. We find the one workflow where AI pays for itself first — and start there.",
  },
  {
    index: "02",
    title: "Prototype",
    body: "You get a working thing in days, not a deck in weeks. We tune it against your real data and edge cases.",
  },
  {
    index: "03",
    title: "Ship & tend",
    body: "We deploy, instrument, and stay on. Every automation is observable, and every failure fails safe.",
  },
] as const;

export const metrics = [
  { value: "< 500ms", label: "voice response latency" },
  { value: "24/7", label: "always answering" },
  { value: "1", label: "accent color, on purpose" },
  { value: "10d", label: "median to first prototype" },
] as const;

/* ------------------------------------------------------------------ */
/*  Trust & conversion content                                         */
/*  NOTE: the testimonials, ratings, and numbers below are PLACEHOLDERS */
/*  written to show the layout. Swap them for real client quotes and    */
/*  real metrics before relying on them publicly.                       */
/* ------------------------------------------------------------------ */

export const trust = {
  rating: "4.9",
  ratingCount: "38",
  clientCount: "40+",
  blurb: "teams shipping with Maana",
};

/** Animated "Maana in numbers" counters. `to` is the numeric target. */
export const numbers = [
  { to: 40, suffix: "+", label: "teams shipped with", sub: "startups to clinics to agencies" },
  { to: 120, suffix: "k+", label: "calls & chats handled", sub: "answered, qualified, routed / month" },
  { to: 32, suffix: "%", label: "avg lift in booked calls", sub: "across voice + web engagements" },
  { to: 10, suffix: "d", label: "median to first prototype", sub: "a working thing, not a deck" },
] as const;

export type Testimonial = {
  quote: string;
  name: string;
  role: string;
  company: string;
  metric: string;
  rating: number;
};

export const testimonials: Testimonial[] = [
  {
    quote:
      "Our phones used to ring out after hours. Maana's voice agent booked appointments on calls we'd have lost — in the first month.",
    name: "Sarah Chen",
    role: "Operations Lead",
    company: "Northlight Dental",
    metric: "40 after-hours bookings, month one",
    rating: 5,
  },
  {
    quote:
      "The chatbot deflects most of our repetitive tickets and actually sounds like us. Setup took a week, not a quarter.",
    name: "Marcus Okoye",
    role: "Head of Customer Experience",
    company: "Trellis",
    metric: "60% of tickets deflected",
    rating: 5,
  },
  {
    quote:
      "They automated lead routing across our CRM and Slack. Two hours of manual copy-paste a day — just gone.",
    name: "Priya Nair",
    role: "RevOps Manager",
    company: "Cadence",
    metric: "~10 hrs/week saved",
    rating: 5,
  },
  {
    quote:
      "Rebuilt our site in ten days. It loads instantly and demo bookings climbed a third. No drama, no hype.",
    name: "Daniel Weiss",
    role: "Founder",
    company: "Kelp Studio",
    metric: "+32% demo bookings",
    rating: 5,
  },
  {
    quote:
      "What sold me was the restraint. Everyone else pitched a platform; Maana shipped one thing that worked on day one.",
    name: "Elena García",
    role: "Chief Operating Officer",
    company: "Vanta Health",
    metric: "Live in 9 days",
    rating: 5,
  },
];

/** "Without / With" comparison — the objection-handling device. */
export const comparison = {
  without: [
    "Calls ring out after hours — leads gone",
    "Your team drowns in the same repetitive questions",
    "Leads slip between tools no one connected",
    "Weeks of dev to change one page",
    "AI experiments that never reach production",
  ],
  with: [
    "Every call answered and booked, 24/7",
    "Bots handle the repetitive 60%, humans get the rest",
    "Automations route every lead the moment it lands",
    "A working prototype in days, then ship",
    "Observable, fail-safe systems in production",
  ],
};

export type Faq = { q: string; a: string };

export const faqs: Faq[] = [
  {
    q: "Are you replacing my team?",
    a: "No. Maana takes the repetitive first line — the after-hours calls, the same ten questions, the copy-paste between tools — so your people spend time on the work that actually needs a human.",
  },
  {
    q: "How fast can we launch?",
    a: "You'll have a working prototype in around ten days, tuned against your real data. Simple automations and chatbots can go live in a week; voice and deeper builds take a little longer.",
  },
  {
    q: "What happens when the AI gets something wrong?",
    a: "We design for it. Every workflow has a human-in-the-loop where the stakes are high, clear handoff to a person, and fail-safe defaults — it never fails silently.",
  },
  {
    q: "Do you work with the tools we already use?",
    a: "Yes. We build on your stack — your CRM, calendar, help desk, and phone system. We connect what you already pay for rather than asking you to rip it out.",
  },
  {
    q: "Is our data safe?",
    a: "We don't train models on your data, we scope access to only what a workflow needs, and we follow SOC 2-minded practices. Compliance specifics (HIPAA, etc.) are handled per engagement.",
  },
  {
    q: "What does it cost?",
    a: "Custom-scoped — no seat math, no templates. We size it to your stack and volume on the call, and start with the one workflow that pays for itself first.",
  },
];
