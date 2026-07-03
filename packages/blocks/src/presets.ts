// Vertical presets (spec §6.7: "presets built as verticals activate: roofing first"). A preset ties
// a niche to its block sequence, its niche-need moment (CLAUDE.md §5a), and its look set. Roofing is
// LIVE: its blocks are rendered by the proven `legacy/templates/roofers` template. The other three
// are declared and look-ready so a lead in them gets a real design + look assignment; their dedicated
// rendered templates land as those verticals go live (until then the builder only builds `live`
// presets and flags the rest, never shipping a half-built demo).

import { looksForPreset, type Look } from "./looks.js";

export interface Preset {
  id: string;
  label: string;
  /** the customer's #1 moment of need this niche leads with (CLAUDE.md §5a) */
  nicheNeed: string;
  /** default block sequence (ids from the registry), the validated narrative order */
  blockSequence: readonly string[];
  /** template folder under legacy/templates that renders this preset, or null if not yet built */
  templateDir: string | null;
  /** true once a rendered template exists and the builder may ship it */
  live: boolean;
  looks: Look[];
}

const NARRATIVE: readonly string[] = [
  "sticky-call-header",
  "hero-photo",
  "stats-strip",
  "niche-need-band",
  "services-grid",
  "process-steps",
  "gallery",
  "reviews",
  "quote-form",
  "faq",
  "service-map",
  "footer",
];

export const PRESETS: readonly Preset[] = [
  {
    id: "roofing",
    label: "Roofing / storm restoration",
    nicheNeed: "storm/hail damage just hit and the homeowner is worried about the insurance claim",
    blockSequence: NARRATIVE,
    templateDir: "roofers",
    live: true,
    looks: looksForPreset("roofing"),
  },
  {
    id: "plumbing",
    label: "Plumbing",
    nicheNeed: "water on the floor at 11pm, needs someone now",
    blockSequence: NARRATIVE.filter((b) => b !== "gallery"),
    templateDir: null,
    live: false,
    looks: looksForPreset("plumbing"),
  },
  {
    id: "hvac",
    label: "HVAC",
    nicheNeed: "no heat in January / no AC in a heat wave, 24/7 emergency",
    blockSequence: NARRATIVE.filter((b) => b !== "gallery"),
    templateDir: null,
    live: false,
    looks: looksForPreset("hvac"),
  },
  {
    id: "dental",
    label: "Dental / med spa",
    nicheNeed: "comparing before/afters and wants to book quietly online",
    blockSequence: ["sticky-call-header", "hero-split", "stats-strip", "services-grid", "gallery", "reviews", "process-steps", "quote-form", "faq", "service-map", "footer"],
    templateDir: null,
    live: false,
    looks: looksForPreset("dental"),
  },
] as const;

export const PRESET_BY_ID: ReadonlyMap<string, Preset> = new Map(PRESETS.map((p) => [p.id, p]));

/** Map a lead's industry string to a preset id. Defaults to roofing (the launch vertical). */
export function presetForIndustry(industry: string | null | undefined): Preset {
  const s = (industry ?? "").toLowerCase();
  if (/plumb/.test(s)) return PRESET_BY_ID.get("plumbing")!;
  if (/hvac|heating|air|cooling/.test(s)) return PRESET_BY_ID.get("hvac")!;
  if (/dent|med spa|medspa|orthodont|derm/.test(s)) return PRESET_BY_ID.get("dental")!;
  return PRESET_BY_ID.get("roofing")!;
}
