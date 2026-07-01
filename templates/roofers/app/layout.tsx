import type { Metadata } from "next";
import "./globals.css";
import { site } from "../lib/content";
import StickyCallBar from "../components/StickyCallBar";

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
    <html lang="en">
      <body style={brandStyle}>
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
