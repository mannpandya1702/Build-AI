import type { Metadata } from "next";
import { Fira_Code, Fira_Sans } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

// Typography per the skill's design system for data-dense dashboards: Fira Code (display/data:
// technical, tabular by nature) + Fira Sans (body). Loaded via next/font: self-hosted, no FOIT.
const display = Fira_Code({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});
const body = Fira_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = { title: "Agency Autopilot" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body className="min-h-dvh font-body text-[15px] text-ink antialiased">
        <div className="flex min-h-dvh flex-col md:flex-row">
          <Sidebar />
          <main className="min-w-0 flex-1 px-4 py-5 md:px-8 md:py-7">{children}</main>
        </div>
      </body>
    </html>
  );
}
