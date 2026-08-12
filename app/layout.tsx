import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Mulish, Parisienne } from "next/font/google";

import { Footer } from "@/components/layout/Footer";
import { Nav } from "@/components/layout/Nav";
import { PageTransition } from "@/components/layout/PageTransition";
import { Cursor } from "@/components/ui/Cursor";
import { WhatsAppCTA } from "@/components/ui/WhatsAppCTA";
import { localBusinessSchema } from "@/lib/schema";
import { site } from "@/lib/site";

import "./globals.css";

/**
 * Two families for the site, plus one that exists only inside the logo.
 * next/font self-hosts all three, so there is no render-blocking request to
 * Google and no layout shift on swap.
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

/**
 * Logo only. The client's artwork sets "Riwaaya" in a calligraphic script;
 * Parisienne is the closest freely-licensed match. It is referenced by exactly
 * one component (Wordmark) and must not be used for copy.
 */
const parisienne = Parisienne({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-parisienne",
  display: "swap",
  /**
   * Not preloaded, deliberately. next/font preloads every font declared here,
   * and a third 22KB file competing with the hero image on a throttled mobile
   * connection pushed LCP from 2.4s to 3.6s — the nav wordmark became the LCP
   * element and could not settle until this file landed. It carries one word,
   * so it loads off the critical path and swaps in behind a cursive fallback.
   */
  preload: false,
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} — ${site.tagline}`,
    template: `%s — ${site.name}`,
  },
  description: site.description,
  keywords: [
    "wedding planner India",
    "wedding planning",
    "mehndi",
    "haldi",
    "sangeet",
    "destination wedding",
    "event planner",
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
    <html
      lang="en-IN"
      className={`${cormorant.variable} ${mulish.variable} ${parisienne.variable}`}
    >
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
