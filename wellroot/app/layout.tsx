import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";
import LenisProvider from "@/components/LenisProvider";

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["600"],
  style: ["normal"],
  variable: "--font-fraunces",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Wellroot — Family & cosmetic dentistry in Bengaluru",
  description:
    "Gentle, unhurried dental care in Bengaluru. Same-day emergency slots, pricing you see before we start, and a team that explains every step.",
  openGraph: {
    title: "Wellroot — Care that runs deep.",
    description:
      "Gentle, unhurried dental care in Bengaluru. Pricing you see before we start.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${fraunces.variable} ${inter.variable}`}>
      <body>
        <LenisProvider>{children}</LenisProvider>
      </body>
    </html>
  );
}
