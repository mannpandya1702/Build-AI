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
  { label: "Voice", href: "#voice" },
  { label: "Process", href: "#process" },
  { label: "Work", href: "#work" },
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
