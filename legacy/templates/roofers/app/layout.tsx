import type { Metadata } from "next";
import {
  Bricolage_Grotesque, Source_Sans_3, Archivo, IBM_Plex_Sans, Space_Grotesk, Work_Sans,
  Anton, Bebas_Neue, Outfit, Sora, Hanken_Grotesk, Chivo, Rubik, Manrope,
  Barlow_Condensed, Alfa_Slab_One,
} from "next/font/google";
import "./globals.css";
import { site, isDemo, watermarkText, isNoindex } from "../lib/content";
import StickyCallBar from "../components/StickyCallBar";
import SmoothScroll from "../components/SmoothScroll";
import Watermark from "../components/Watermark";

// Distinctive font families (CLAUDE.md §5b-bis: never system fonts). All are declared statically
// (next/font requires it) with preload off; only the families the assigned look references are ever
// downloaded, because unused font variables are never applied by any CSS rule. The name-based
// registry below lets the skill-grounded looks registry (@autopilot/blocks) pick ANY declared
// display+body pairing per lead, not just one of a fixed three.
const bricolage = Bricolage_Grotesque({ subsets: ["latin"], weight: ["300", "500", "800"], variable: "--f-bricolage", display: "swap", preload: false });
const sourcesans = Source_Sans_3({ subsets: ["latin"], weight: ["400", "600", "700"], variable: "--f-sourcesans", display: "swap", preload: false });
const archivo = Archivo({ subsets: ["latin"], weight: ["300", "500", "800", "900"], variable: "--f-archivo", display: "swap", preload: false });
const plex = IBM_Plex_Sans({ subsets: ["latin"], weight: ["400", "600", "700"], variable: "--f-plex", display: "swap", preload: false });
const grotesk = Space_Grotesk({ subsets: ["latin"], weight: ["300", "500", "700"], variable: "--f-grotesk", display: "swap", preload: false });
const work = Work_Sans({ subsets: ["latin"], weight: ["400", "600", "700"], variable: "--f-work", display: "swap", preload: false });
const anton = Anton({ subsets: ["latin"], weight: "400", variable: "--f-anton", display: "swap", preload: false });
const bebas = Bebas_Neue({ subsets: ["latin"], weight: "400", variable: "--f-bebas", display: "swap", preload: false });
const outfit = Outfit({ subsets: ["latin"], weight: ["300", "500", "800"], variable: "--f-outfit", display: "swap", preload: false });
const sora = Sora({ subsets: ["latin"], weight: ["300", "600", "800"], variable: "--f-sora", display: "swap", preload: false });
const hanken = Hanken_Grotesk({ subsets: ["latin"], weight: ["400", "600", "700"], variable: "--f-hanken", display: "swap", preload: false });
const chivo = Chivo({ subsets: ["latin"], weight: ["400", "600", "700"], variable: "--f-chivo", display: "swap", preload: false });
const rubik = Rubik({ subsets: ["latin"], weight: ["400", "600", "700"], variable: "--f-rubik", display: "swap", preload: false });
const manrope = Manrope({ subsets: ["latin"], weight: ["400", "600", "700"], variable: "--f-manrope", display: "swap", preload: false });
// 2026-07-13: trade-signage faces replacing retired Archivo-display pairings (looks registry).
const barlowcond = Barlow_Condensed({ subsets: ["latin"], weight: ["500", "700", "800"], variable: "--f-barlowcond", display: "swap", preload: false });
const alfaslab = Alfa_Slab_One({ subsets: ["latin"], weight: "400", variable: "--f-alfaslab", display: "swap", preload: false });

const ALL_FONTS = [bricolage, sourcesans, archivo, plex, grotesk, work, anton, bebas, outfit, sora, hanken, chivo, rubik, manrope, barlowcond, alfaslab];

// Font NAME (as stored in the looks registry) -> its CSS variable. A look carries its own display
// and body font names; whatever it names resolves here.
const FONT_VARS: Record<string, string> = {
  "Bricolage Grotesque": "var(--f-bricolage)", "Source Sans 3": "var(--f-sourcesans)",
  "Archivo": "var(--f-archivo)", "IBM Plex Sans": "var(--f-plex)",
  "Space Grotesk": "var(--f-grotesk)", "Work Sans": "var(--f-work)",
  "Anton": "var(--f-anton)", "Bebas Neue": "var(--f-bebas)", "Outfit": "var(--f-outfit)",
  "Sora": "var(--f-sora)", "Hanken Grotesk": "var(--f-hanken)", "Chivo": "var(--f-chivo)",
  "Rubik": "var(--f-rubik)", "Manrope": "var(--f-manrope)",
  "Barlow Condensed": "var(--f-barlowcond)", "Alfa Slab One": "var(--f-alfaslab)",
};

// Legacy fallback: the original three fontPair keys, for content.json written before displayFont/
// bodyFont existed.
const FONT_PAIRS: Record<string, { display: string; body: string }> = {
  bricolage: { display: "var(--f-bricolage)", body: "var(--f-sourcesans)" },
  archivo: { display: "var(--f-archivo)", body: "var(--f-plex)" },
  grotesk: { display: "var(--f-grotesk)", body: "var(--f-work)" },
};

export const metadata: Metadata = {
  title: `${site.businessName} — ${site.primaryService} in ${site.city}, ${site.state}`,
  description: `${site.businessName}: ${site.primaryService.toLowerCase()} and more in ${site.city}, ${site.state}. Fast, local, phone a tap away.`,
  // A watermarked demo preview must stay out of search until it is the client's real site (spec §6.7).
  robots: isNoindex() ? { index: false, follow: false } : { index: true, follow: true },
  openGraph: {
    title: `${site.businessName} — ${site.city}, ${site.state}`,
    description: `${site.primaryService} in ${site.city}. Call today.`,
    type: "website",
  },
};

// RoofingContractor schema so Google and AI search read the business correctly (CLAUDE.md §5b).
// Built only from real Places fields; ratings are included only when present (no fabrication).
function localBusinessSchema() {
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "RoofingContractor",
    name: site.businessName,
    areaServed: `${site.city}, ${site.state}`,
  };
  if (site.phone) schema.telephone = site.phone;
  if (site.address) schema.address = site.address;
  if (site.rating != null && site.reviewCount != null) {
    schema.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: site.rating,
      reviewCount: site.reviewCount,
    };
  }
  return schema;
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const t = site.theme;
  // Resolve fonts by the look's own display/body NAMES (skill-grounded looks); fall back to the
  // legacy three-pair mapping for older content.json (CLAUDE.md §5d).
  const legacy = FONT_PAIRS[t.fontPair] ?? FONT_PAIRS.bricolage;
  const displayVar = (t.displayFont && FONT_VARS[t.displayFont]) || legacy.display;
  const bodyVar = (t.bodyFont && FONT_VARS[t.bodyFont]) || legacy.body;
  // The whole look flows from these variables: palette channels + font pair (CLAUDE.md §5d).
  // Derived depth shade: the same hue, darkened, for CTA gradients (one accent family, §5b-bis).
  const brandDeep = t.palette.brand
    .split(" ")
    .map((c: string) => String(Math.max(0, Math.round(Number(c) * 0.68))))
    .join(" ");
  const themeStyle = {
    ["--brand" as string]: t.palette.brand,
    ["--brand-deep" as string]: brandDeep,
    ["--brand-ink" as string]: t.palette.brandInk,
    ["--ink" as string]: t.palette.ink,
    ["--paper" as string]: t.palette.paper,
    ["--paper-2" as string]: t.palette.paper2,
    ["--font-display" as string]: displayVar,
    ["--font-body" as string]: bodyVar,
  } as React.CSSProperties;
  const fontVars = ALL_FONTS.map((f) => f.variable).join(" ");

  return (
    <html lang="en" className={fontVars}>
      <body style={themeStyle} className="font-body">
        <SmoothScroll />
        {/* JSON-LD structured data. Serialized from our own schema object; no user input. */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema()) }}
        />
        {children}
        <StickyCallBar />
        {isDemo() && <Watermark text={watermarkText()} />}
      </body>
    </html>
  );
}
