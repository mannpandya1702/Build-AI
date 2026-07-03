import type { Metadata } from "next";
import { Bricolage_Grotesque, Source_Sans_3, Archivo, IBM_Plex_Sans, Space_Grotesk, Work_Sans } from "next/font/google";
import "./globals.css";
import { site, isDemo, watermarkText, isNoindex } from "../lib/content";
import StickyCallBar from "../components/StickyCallBar";
import Watermark from "../components/Watermark";

// Three distinctive pairings (CLAUDE.md §5b-bis: never system fonts). All are declared statically
// (next/font requires it) with preload off; only the pair the theme references is ever downloaded,
// because unused font-families are never used by any CSS rule.
const bricolageDisplay = Bricolage_Grotesque({ subsets: ["latin"], weight: ["300", "500", "800"], variable: "--f-bricolage", display: "swap", preload: false });
const bricolageBody = Source_Sans_3({ subsets: ["latin"], weight: ["400", "600", "700"], variable: "--f-sourcesans", display: "swap", preload: false });
const archivoDisplay = Archivo({ subsets: ["latin"], weight: ["300", "500", "800", "900"], variable: "--f-archivo", display: "swap", preload: false });
const archivoBody = IBM_Plex_Sans({ subsets: ["latin"], weight: ["400", "600", "700"], variable: "--f-plex", display: "swap", preload: false });
const groteskDisplay = Space_Grotesk({ subsets: ["latin"], weight: ["300", "500", "700"], variable: "--f-grotesk", display: "swap", preload: false });
const groteskBody = Work_Sans({ subsets: ["latin"], weight: ["400", "600", "700"], variable: "--f-work", display: "swap", preload: false });

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
  const pair = FONT_PAIRS[t.fontPair] ?? FONT_PAIRS.bricolage;
  // The whole look flows from these variables: palette channels + font pair (CLAUDE.md §5d).
  const themeStyle = {
    ["--brand" as string]: t.palette.brand,
    ["--brand-ink" as string]: t.palette.brandInk,
    ["--ink" as string]: t.palette.ink,
    ["--paper" as string]: t.palette.paper,
    ["--paper-2" as string]: t.palette.paper2,
    ["--font-display" as string]: pair.display,
    ["--font-body" as string]: pair.body,
  } as React.CSSProperties;
  const fontVars = `${bricolageDisplay.variable} ${bricolageBody.variable} ${archivoDisplay.variable} ${archivoBody.variable} ${groteskDisplay.variable} ${groteskBody.variable}`;

  return (
    <html lang="en" className={fontVars}>
      <body style={themeStyle} className="font-body">
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
