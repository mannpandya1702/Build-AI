// Block library registry (spec §6.7): the ≥12 responsive Tailwind blocks a demo is composed from.
// This is the TYPED CONTRACT, not the React render. The roofing preset's blocks are realized by the
// proven `legacy/templates/roofers` components (spec §2.7: existing demos are the block library's
// source material); as new verticals activate they get their own rendered templates. The uiux agent
// selects a block sequence from this registry; the builder validates the design against it and drives
// the template. Each block declares which CLAUDE.md §5 job/persona it serves and what real data it
// needs, so a block is only placed when the facts exist (no fabrication, CLAUDE.md §0.1).

export type Persona = "emergency" | "planner" | "both";

export interface BlockDef {
  /** stable id used in designs.page_specs */
  id: string;
  label: string;
  /** the customer question this block answers (CLAUDE.md §5a: skill / cost / trust, or the action) */
  answers: string;
  persona: Persona;
  /** real lead facts this block needs; if any are missing the block is omitted, never faked */
  needs: readonly string[];
  /** true = always safe to render (structural); false = conditional on `needs` being present */
  structural: boolean;
  /** the CLAUDE.md section this block implements, for traceability */
  claudeRef: string;
}

// The canonical block set. Order here is the validated narrative sequence (CLAUDE.md §5b
// "section order is a narrative, not a stack"): hook -> trust -> problem -> solution -> how ->
// proof -> offer -> objections -> find us.
export const BLOCKS: readonly BlockDef[] = [
  { id: "sticky-call-header", label: "Sticky tap-to-call header", answers: "how do I call right now", persona: "emergency", needs: ["phone"], structural: false, claudeRef: "§5b sticky tap-to-call" },
  { id: "hero-photo", label: "Hero (photo)", answers: "is this the right local company for my problem", persona: "both", needs: ["city", "primaryService"], structural: true, claudeRef: "§5b location hero + §5c whoa" },
  { id: "hero-split", label: "Hero (split)", answers: "is this the right local company for my problem", persona: "both", needs: ["city", "primaryService"], structural: true, claudeRef: "§5b location hero + §5c whoa" },
  { id: "hero-bold", label: "Hero (bold type)", answers: "is this the right local company for my problem", persona: "both", needs: ["city", "primaryService"], structural: true, claudeRef: "§5b location hero + §5c whoa" },
  { id: "stats-strip", label: "Stats strip", answers: "can I trust them (proof in 3 seconds)", persona: "both", needs: ["reviewCount|rating|city"], structural: false, claudeRef: "§5b stats strip" },
  { id: "niche-need-band", label: "Niche-need band", answers: "do they handle MY exact moment of need", persona: "emergency", needs: ["primaryService"], structural: false, claudeRef: "§5a niche-need moment" },
  { id: "services-grid", label: "Services grid", answers: "can I find someone skilled (54% objection)", persona: "both", needs: ["services"], structural: true, claudeRef: "§5b services" },
  { id: "process-steps", label: "Process steps (3)", answers: "what happens if I call", persona: "planner", needs: [], structural: true, claudeRef: "§5b process steps" },
  { id: "gallery", label: "Before/after gallery", answers: "is their work actually good", persona: "planner", needs: ["photos"], structural: false, claudeRef: "§5b gallery / proof" },
  { id: "reviews", label: "Google reviews (verbatim 4+)", answers: "can I trust them (14% objection)", persona: "both", needs: ["reviews"], structural: false, claudeRef: "§5b review curation" },
  { id: "service-map", label: "Service-area map", answers: "do they cover where I am", persona: "both", needs: ["mapQuery"], structural: true, claudeRef: "§5b embedded map + NAP" },
  { id: "quote-form", label: "Quote form (3-5 fields)", answers: "let me get a quote without calling", persona: "planner", needs: ["primaryService"], structural: true, claudeRef: "§5b short quote form" },
  { id: "faq", label: "FAQ (fact-safe)", answers: "the last small questions before I act", persona: "planner", needs: [], structural: true, claudeRef: "§5b FAQ fact-safe" },
  { id: "footer", label: "Footer (NAP)", answers: "name, address, phone, hours", persona: "both", needs: ["city"], structural: true, claudeRef: "§5b NAP" },
] as const;

export const BLOCK_IDS = BLOCKS.map((b) => b.id);
export const BLOCK_BY_ID: ReadonlyMap<string, BlockDef> = new Map(BLOCKS.map((b) => [b.id, b]));

/** A block's `needs` are satisfied if every required fact key is present (| = any-of). */
export function blockDataSatisfied(block: BlockDef, facts: Record<string, unknown>): boolean {
  return block.needs.every((need) => {
    const anyOf = need.split("|");
    return anyOf.some((k) => {
      const v = facts[k];
      if (Array.isArray(v)) return v.length > 0;
      return v !== null && v !== undefined && v !== "";
    });
  });
}
