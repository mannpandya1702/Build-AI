import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";
import Bell from "@/components/Bell";

export const metadata: Metadata = { title: "Agency Autopilot" };

const NAV = [
  ["/pipeline", "Pipeline"],
  ["/outbox", "Outbox"],
  ["/meetings", "Meetings"],
  ["/builds", "Builds"],
  ["/activity", "Activity"],
  ["/reports", "Reports"],
  ["/settings", "Settings"],
] as const;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-zinc-950 text-zinc-100 antialiased">
        <div className="flex min-h-screen">
          <aside className="w-52 shrink-0 border-r border-zinc-800 p-4">
            <p className="mb-3 text-sm font-bold tracking-wide text-zinc-100">AGENCY AUTOPILOT</p>
            <div className="mb-4"><Bell /></div>
            <nav className="space-y-1 text-sm">
              {NAV.map(([href, label]) => (
                <Link key={href} href={href} className="block rounded px-2 py-1.5 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100">
                  {label}
                </Link>
              ))}
            </nav>
          </aside>
          <main className="flex-1 p-6">{children}</main>
        </div>
      </body>
    </html>
  );
}
