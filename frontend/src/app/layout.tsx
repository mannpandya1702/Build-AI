import type { Metadata } from "next";
import { Space_Grotesk, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { site } from "@/lib/site";

/* Display — distinctive, techy, not templated */
const display = Space_Grotesk({
  variable: "--font-display-face",
  subsets: ["latin"],
  weight: ["500", "600"],
});

/* Body / UI workhorse */
const sans = Inter({
  variable: "--font-sans-face",
  subsets: ["latin"],
});

/* Eyebrows, labels, numbered markers — the techy signal */
const mono = JetBrains_Mono({
  variable: "--font-mono-face",
  subsets: ["latin"],
  weight: ["400"],
});

const SITE_URL = "https://vocabric.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Vocabric AI — the AI that works quietly, ships loudly",
  description:
    "Vocabric AI is an agency building websites, chatbots, voice agents, and automations. Quiet confidence, engineered.",
  alternates: { canonical: "/" },
  keywords: [
    "AI agency",
    "AI chatbots",
    "AI voice agents",
    "workflow automation",
    "AI websites",
  ],
  openGraph: {
    title: "Vocabric AI — AI, engineered",
    description:
      "Websites, chatbots, voice agents, and automations built with restraint.",
    url: SITE_URL,
    siteName: "Vocabric AI",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Vocabric AI — AI, engineered",
    description:
      "Websites, chatbots, voice agents, and automations built with restraint.",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: site.name,
      url: SITE_URL,
      description: "AI agency building websites, chatbots, voice agents, and automations.",
      email: site.email,
      contactPoint: {
        "@type": "ContactPoint",
        email: site.email,
        contactType: "sales",
      },
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: site.name,
      publisher: { "@id": `${SITE_URL}/#organization` },
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${sans.variable} ${mono.variable} antialiased`}
    >
      <body className="grain min-h-dvh">
        <a
          href="#top"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[999] focus:rounded-full focus:bg-accent-strong focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
        >
          Skip to content
        </a>
        <Providers>{children}</Providers>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </body>
    </html>
  );
}
