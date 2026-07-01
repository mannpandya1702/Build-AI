import type { Metadata } from "next";
import { Bricolage_Grotesque, Source_Sans_3 } from "next/font/google";
import "./globals.css";
import { site } from "../lib/content";
import StickyCallBar from "../components/StickyCallBar";

// Distinctive type pairing per CLAUDE.md §5b-bis: sturdy grotesque display + readable body.
// next/font self-hosts, so there is no render-blocking request and no layout shift.
const display = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["300", "500", "800"],
  variable: "--font-display",
  display: "swap",
});
const body = Source_Sans_3({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: `${site.businessName} — ${site.primaryService} in ${site.city}, ${site.state}`,
  description: `${site.businessName}: ${site.primaryService.toLowerCase()} and more in ${site.city}, ${site.state}. Fast, local, phone a tap away.`,
  robots: { index: true, follow: true },
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
  const brandStyle = { ["--brand" as string]: site.brandColor } as React.CSSProperties;
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body style={brandStyle} className="font-body">
        {/* JSON-LD structured data. Serialized from our own schema object; no user input. */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema()) }}
        />
        {children}
        <StickyCallBar />
      </body>
    </html>
  );
}
