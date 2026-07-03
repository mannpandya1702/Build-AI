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
  { name: "steel-modern", preset: "roofing", palette: { brand: "29 78 216", brandInk: "255 255 255", ink: "15 23 42", paper: "247 250 252", paper2: "233 239 246" }, typePairing: { display: "Archivo", body: "IBM Plex Sans" }, heroVariant: "split" },
  { name: "moss-craft", preset: "roofing", palette: { brand: "21 128 61", brandInk: "255 255 255", ink: "18 26 20", paper: "249 248 242", paper2: "237 236 225" }, typePairing: { display: "Space Grotesk", body: "Source Sans 3" }, heroVariant: "bold" },
  { name: "ember-storm", preset: "roofing", palette: { brand: "202 96 6", brandInk: "255 255 255", ink: "26 20 14", paper: "251 248 243", paper2: "243 236 226" }, typePairing: { display: "Archivo", body: "IBM Plex Sans" }, heroVariant: "photo" },
  // Skill-grounded (ui-ux-pro-max) + anti-slop-verified additions (CLAUDE.md §9). More distinct
  // looks so the §5d "no two prospects in a metro share a look" rule always has free options.
  { name: "oxblood-barn", preset: "roofing", palette: { brand: "163 45 30", brandInk: "253 246 242", ink: "28 18 16", paper: "249 243 239", paper2: "242 233 228" }, typePairing: { display: "Bricolage Grotesque", body: "Hanken Grotesk" }, heroVariant: "split" },
  { name: "ember-forge", preset: "roofing", palette: { brand: "194 65 12", brandInk: "255 250 243", ink: "25 21 18", paper: "250 246 240", paper2: "243 236 227" }, typePairing: { display: "Space Grotesk", body: "Chivo" }, heroVariant: "bold" },
  { name: "safety-slate", preset: "roofing", palette: { brand: "216 80 10", brandInk: "255 251 246", ink: "18 24 31", paper: "246 248 250", paper2: "233 238 243" }, typePairing: { display: "Anton", body: "IBM Plex Sans" }, heroVariant: "split" },
  { name: "copper-standing-seam", preset: "roofing", palette: { brand: "180 83 9", brandInk: "253 247 238", ink: "26 22 17", paper: "251 246 238", paper2: "245 237 224" }, typePairing: { display: "Bebas Neue", body: "Source Sans 3" }, heroVariant: "photo" },
  { name: "clay-adobe", preset: "roofing", palette: { brand: "168 88 50", brandInk: "255 249 242", ink: "30 22 18", paper: "250 244 235", paper2: "244 234 221" }, typePairing: { display: "Outfit", body: "Rubik" }, heroVariant: "photo" },
  { name: "slate-architect", preset: "roofing", palette: { brand: "38 80 110", brandInk: "244 248 251", ink: "20 26 32", paper: "245 247 249", paper2: "232 237 241" }, typePairing: { display: "Sora", body: "Manrope" }, heroVariant: "bold" },
];

// Plumbing: deep trust blues + one warm emergency accent (water on the floor at 11pm).
const PLUMBING: Look[] = [
  { name: "deepwater", preset: "plumbing", palette: { brand: "12 74 110", brandInk: "255 255 255", ink: "13 22 33", paper: "248 250 252", paper2: "232 240 246" }, typePairing: { display: "Archivo", body: "IBM Plex Sans" }, heroVariant: "split" },
  { name: "copper-line", preset: "plumbing", palette: { brand: "180 83 9", brandInk: "255 255 255", ink: "20 24 30", paper: "250 248 244", paper2: "240 236 228" }, typePairing: { display: "Bricolage Grotesque", body: "Source Sans 3" }, heroVariant: "photo" },
  // Skill-grounded + anti-slop-verified (CLAUDE.md §9). Render faithfully once the plumbing template ships.
  { name: "harbor-copper", preset: "plumbing", palette: { brand: "183 88 38", brandInk: "255 250 243", ink: "14 22 40", paper: "246 243 238", paper2: "235 230 223" }, typePairing: { display: "Archivo", body: "Work Sans" }, heroVariant: "photo" },
  { name: "brass-gauge", preset: "plumbing", palette: { brand: "168 114 24", brandInk: "26 20 6", ink: "16 28 34", paper: "245 244 239", paper2: "234 232 224" }, typePairing: { display: "Space Grotesk", body: "DM Sans" }, heroVariant: "split" },
  { name: "midnight-ember", preset: "plumbing", palette: { brand: "196 68 34", brandInk: "255 248 242", ink: "3 8 24", paper: "244 240 236", paper2: "233 227 221" }, typePairing: { display: "Bricolage Grotesque", body: "IBM Plex Sans" }, heroVariant: "bold" },
  { name: "signal-azure", preset: "plumbing", palette: { brand: "4 92 150", brandInk: "240 247 252", ink: "12 22 38", paper: "244 247 250", paper2: "231 237 243" }, typePairing: { display: "Outfit", body: "Work Sans" }, heroVariant: "photo" },
  { name: "tidewater-teal", preset: "plumbing", palette: { brand: "13 110 108", brandInk: "240 250 248", ink: "10 30 32", paper: "243 247 245", paper2: "230 239 236" }, typePairing: { display: "Sora", body: "Manrope" }, heroVariant: "bold" },
  { name: "amber-forge", preset: "plumbing", palette: { brand: "188 90 16", brandInk: "255 249 240", ink: "18 26 42", paper: "246 242 236", paper2: "236 230 222" }, typePairing: { display: "Archivo", body: "Manrope" }, heroVariant: "split" },
];

// HVAC: cool blue for comfort + a warm accent for the emergency (no heat in January).
const HVAC: Look[] = [
  { name: "coolstream", preset: "hvac", palette: { brand: "2 132 199", brandInk: "255 255 255", ink: "14 22 33", paper: "247 251 253", paper2: "230 241 247" }, typePairing: { display: "Space Grotesk", body: "IBM Plex Sans" }, heroVariant: "split" },
  { name: "furnace-warm", preset: "hvac", palette: { brand: "194 65 12", brandInk: "255 255 255", ink: "24 20 16", paper: "251 248 244", paper2: "242 235 227" }, typePairing: { display: "Archivo", body: "Source Sans 3" }, heroVariant: "bold" },
  // Skill-grounded + anti-slop-verified (CLAUDE.md §9).
  { name: "arctic-current", preset: "hvac", palette: { brand: "6 118 175", brandInk: "255 255 255", ink: "13 23 33", paper: "244 249 252", paper2: "229 240 247" }, typePairing: { display: "Sora", body: "Work Sans" }, heroVariant: "split" },
  { name: "furnace-copper", preset: "hvac", palette: { brand: "185 72 20", brandInk: "255 250 244", ink: "24 20 16", paper: "250 245 240", paper2: "242 234 226" }, typePairing: { display: "Space Grotesk", body: "DM Sans" }, heroVariant: "bold" },
];

// Dental / med spa: editorial serif, calm and premium, booking-first (they book quietly online).
const DENTAL: Look[] = [
  { name: "editorial-calm", preset: "dental", palette: { brand: "13 100 128", brandInk: "255 255 255", ink: "20 28 33", paper: "250 250 248", paper2: "238 240 238" }, typePairing: { display: "Fraunces", body: "Newsreader" }, heroVariant: "split" },
  { name: "warm-clinic", preset: "dental", palette: { brand: "159 18 57", brandInk: "255 255 255", ink: "26 20 24", paper: "251 249 248", paper2: "242 236 236" }, typePairing: { display: "Playfair Display", body: "Source Sans 3" }, heroVariant: "photo" },
  // Skill-grounded + anti-slop-verified (CLAUDE.md §9).
  { name: "sage-editorial", preset: "dental", palette: { brand: "17 94 89", brandInk: "255 255 255", ink: "22 28 30", paper: "250 250 247", paper2: "237 240 237" }, typePairing: { display: "Fraunces", body: "Public Sans" }, heroVariant: "split" },
  { name: "rose-editorial", preset: "dental", palette: { brand: "159 55 74", brandInk: "255 251 250", ink: "26 22 24", paper: "251 249 248", paper2: "242 236 236" }, typePairing: { display: "Playfair Display", body: "Work Sans" }, heroVariant: "photo" },
];

export const LOOKS: readonly Look[] = [...ROOFING, ...PLUMBING, ...HVAC, ...DENTAL];

export function looksForPreset(preset: string): Look[] {
  return LOOKS.filter((l) => l.preset === preset);
}
