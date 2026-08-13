import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Mulish } from "next/font/google";

import { Footer } from "@/components/layout/Footer";
import { Nav } from "@/components/layout/Nav";
import { PageTransition } from "@/components/layout/PageTransition";
import { Cursor } from "@/components/ui/Cursor";
import { WhatsAppCTA } from "@/components/ui/WhatsAppCTA";
import { localBusinessSchema } from "@/lib/schema";
import { site } from "@/lib/site";

import "./globals.css";

/**
 * Two families, nothing else. next/font self-hosts both, so there is no
 * render-blocking request to Google and no layout shift on swap.
 */
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400"],
  variable: "--font-cormorant",
  display: "swap",
});

const mulish = Mulish({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-mulish",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  /**
   * Titles carry the two search phrases; the tagline moved into the
   * description, where there is room for it. Every composed title is kept
   * under ~60 characters so Google shows it whole rather than truncating.
   */
  title: {
    default: `${site.name} — Luxury & Destination Wedding Planner, Chandigarh`,
    template: `%s — ${site.name}`,
  },
  description: site.description,
  /**
   * The first two are the phrases the studio asked to rank for (13 Aug 2026),
   * with the Chandigarh variants that a local search actually resolves to.
   * Note this tag carries little weight with Google on its own — the work is in
   * the page titles, headings and JSON-LD, which is where these also appear.
   */
  keywords: [
    "destination wedding planner",
    "luxury wedding planner",
    "luxury wedding planner Chandigarh",
    "destination wedding planner Chandigarh",
    "wedding planner Mohali",
    "wedding planner India",
    "mehndi",
    "haldi",
    "sangeet",
    "Bhumi Sandhu",
    "Riwaaya",
  ],
  authors: [{ name: site.name }],
  creator: site.name,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: site.url,
    siteName: site.name,
    title: `${site.name} — ${site.tagline}`,
    description: site.description,
    images: [
      {
        // PLACEHOLDER — replace /public/og.png with real artwork at 1200×630.
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "Riwaaya — a wedding and events studio in India.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${site.name} — ${site.tagline}`,
    description: site.description,
    images: ["/og.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
};

export const viewport: Viewport = {
  themeColor: "#FBFAF6",
  width: "device-width",
  initialScale: 1,
  // Never cap zoom — pinch-to-zoom stays available.
  maximumScale: 5,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN" className={`${cormorant.variable} ${mulish.variable}`}>
      <body className="bg-chandni font-sans text-ink antialiased">
        <script
          type="application/ld+json"
          // Structured data for the business itself; per-page Event schema is
          // injected by the service routes.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema()) }}
        />

        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[90] focus:rounded-full focus:bg-ink focus:px-5 focus:py-3 focus:font-sans focus:text-micro focus:text-chandni"
        >
          Skip to content
        </a>

        <Cursor />
        <Nav />

        <PageTransition>
          <main id="main">{children}</main>
          <Footer />
        </PageTransition>

        <WhatsAppCTA variant="float" />
      </body>
    </html>
  );
}
