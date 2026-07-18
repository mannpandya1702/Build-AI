import type { Metadata } from "next";
import { Space_Grotesk, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

/* Display — distinctive, techy, not templated */
const display = Space_Grotesk({
  variable: "--font-display-face",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
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
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Maana — AI that works quietly, ships loudly",
  description:
    "Maana is an AI agency building websites, chatbots, voice agents, and automations. Quiet confidence, engineered.",
  metadataBase: new URL("https://maana.agency"),
  openGraph: {
    title: "Maana — AI, engineered",
    description:
      "Websites, chatbots, voice agents, and automations built with restraint.",
    type: "website",
  },
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
      <body className="grain min-h-dvh">{children}</body>
    </html>
  );
}
