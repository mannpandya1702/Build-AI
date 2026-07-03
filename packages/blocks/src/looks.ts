// Looks registry (contract §5d + spec §6.7): curated palette + type pairing + hero layout variants,
// grouped by vertical preset. A look is assigned per lead, stored on the design, never reused while a
// free look remains in the same preset + metro, and LOCKED once the demo is sent. No two prospects
// ever get the same-looking demo (owners talk to each other; identical demos with swapped names kill
// both deals). Every palette obeys the anti-slop rules (CLAUDE.md §5b-bis): one dominant + one sharp
// CTA accent, warm/cool off-whites over pure white, deep inks over pure black, distinctive type
// (never Inter/Roboto/system), accent derived from the trade. Palette values are RGB channel triplets
// ("r g b") so Tailwind alpha modifiers work on CSS variables.

export type HeroVariant = "photo" | "split" | "bold";

export interface Palette {
  brand: string;
  brandInk: string;
  ink: string;
  paper: string;
  paper2: string;
}
export interface TypePairing {
  display: string;
  body: string;
}
export interface Look {
  name: string;
  preset: string;
  palette: Palette;
  typePairing: TypePairing;
  heroVariant: HeroVariant;
}

// Roofing: brick/terracotta/slate/ember — the four proven looks ported verbatim from the legacy
// engine (already deployed to real prospects), plus their type pairings made explicit.
const ROOFING: Look[] = [
  { name: "brick-classic", preset: "roofing", palette: { brand: "180 56 13", brandInk: "255 255 255", ink: "16 24 31", paper: "250 247 242", paper2: "241 235 226" }, typePairing: { display: "Bricolage Grotesque", body: "Source Sans 3" }, heroVariant: "photo" },
  { name: "steel-modern", preset: "roofing", palette: { brand: "29 78 216", brandInk: "255 255 255", ink: "15 23 42", paper: "247 250 252", paper2: "233 239 246" }, typePairing: { display: "Archivo", body: "Inter Tight" }, heroVariant: "split" },
  { name: "moss-craft", preset: "roofing", palette: { brand: "21 128 61", brandInk: "255 255 255", ink: "18 26 20", paper: "249 248 242", paper2: "237 236 225" }, typePairing: { display: "Space Grotesk", body: "Source Sans 3" }, heroVariant: "bold" },
  { name: "ember-storm", preset: "roofing", palette: { brand: "202 96 6", brandInk: "255 255 255", ink: "26 20 14", paper: "251 248 243", paper2: "243 236 226" }, typePairing: { display: "Archivo", body: "Inter Tight" }, heroVariant: "photo" },
];

// Plumbing: deep trust blues + one warm emergency accent (water on the floor at 11pm).
const PLUMBING: Look[] = [
  { name: "deepwater", preset: "plumbing", palette: { brand: "12 74 110", brandInk: "255 255 255", ink: "13 22 33", paper: "248 250 252", paper2: "232 240 246" }, typePairing: { display: "Archivo", body: "Inter Tight" }, heroVariant: "split" },
  { name: "copper-line", preset: "plumbing", palette: { brand: "180 83 9", brandInk: "255 255 255", ink: "20 24 30", paper: "250 248 244", paper2: "240 236 228" }, typePairing: { display: "Bricolage Grotesque", body: "Source Sans 3" }, heroVariant: "photo" },
];

// HVAC: cool blue for comfort + a warm accent for the emergency (no heat in January).
const HVAC: Look[] = [
  { name: "coolstream", preset: "hvac", palette: { brand: "2 132 199", brandInk: "255 255 255", ink: "14 22 33", paper: "247 251 253", paper2: "230 241 247" }, typePairing: { display: "Space Grotesk", body: "Inter Tight" }, heroVariant: "split" },
  { name: "furnace-warm", preset: "hvac", palette: { brand: "194 65 12", brandInk: "255 255 255", ink: "24 20 16", paper: "251 248 244", paper2: "242 235 227" }, typePairing: { display: "Archivo", body: "Source Sans 3" }, heroVariant: "bold" },
];

// Dental / med spa: editorial serif, calm and premium, booking-first (they book quietly online).
const DENTAL: Look[] = [
  { name: "editorial-calm", preset: "dental", palette: { brand: "13 100 128", brandInk: "255 255 255", ink: "20 28 33", paper: "250 250 248", paper2: "238 240 238" }, typePairing: { display: "Fraunces", body: "Newsreader" }, heroVariant: "split" },
  { name: "warm-clinic", preset: "dental", palette: { brand: "159 18 57", brandInk: "255 255 255", ink: "26 20 24", paper: "251 249 248", paper2: "242 236 236" }, typePairing: { display: "Playfair Display", body: "Source Sans 3" }, heroVariant: "photo" },
];

export const LOOKS: readonly Look[] = [...ROOFING, ...PLUMBING, ...HVAC, ...DENTAL];

export function looksForPreset(preset: string): Look[] {
  return LOOKS.filter((l) => l.preset === preset);
}
