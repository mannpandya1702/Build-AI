"use client";

import Bell from "@/components/Bell";
import LogoutButton from "@/components/LogoutButton";
import WorkerSwitch from "@/components/WorkerSwitch";
import { Icon, type IconName } from "@/components/icons";
// App shell navigation (skill §9: icon + label, active state highlighted, placement identical on
// every page; ≥1024px sidebar, small screens horizontal top nav). Amber is reserved for the brand
// mark + active indicator (accent used sparingly, per the design system).
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV: { href: string; label: string; icon: IconName }[] = [
  { href: "/shortlist", label: "Shortlist", icon: "shortlist" },
  { href: "/pipeline", label: "Pipeline", icon: "pipeline" },
  { href: "/outbox", label: "Outbox", icon: "outbox" },
  { href: "/meetings", label: "Meetings", icon: "meetings" },
  { href: "/builds", label: "Builds", icon: "builds" },
  { href: "/chatbot", label: "Chatbot", icon: "chatbot" },
  { href: "/voice", label: "Voice", icon: "voice" },
  { href: "/automation", label: "Automation", icon: "automation" },
  { href: "/billing", label: "Pricing", icon: "billing" },
  { href: "/delivery", label: "Delivery", icon: "delivery" },
  { href: "/activity", label: "Activity", icon: "activity" },
  { href: "/reports", label: "Reports", icon: "reports" },
  { href: "/settings", label: "Settings", icon: "settings" },
];

export default function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="shrink-0 border-b border-line bg-surface/70 backdrop-blur md:sticky md:top-0 md:flex md:h-dvh md:w-56 md:flex-col md:border-b-0 md:border-r">
      <div className="flex items-center justify-between px-4 py-4 md:block">
        <Link href="/pipeline" className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-accent font-display text-sm font-bold text-accentink">
            A
          </span>
          <span className="font-display text-[13px] font-semibold leading-tight tracking-tight text-ink">
            AGENCY
            <br className="hidden md:block" />
            <span className="md:hidden"> </span>AUTOPILOT
          </span>
        </Link>
        <div className="md:mt-4">
          <Bell />
        </div>
      </div>

      <div className="px-2 pb-2 md:pb-0">
        <WorkerSwitch />
      </div>

      <nav
        className="flex gap-1 overflow-x-auto px-2 pb-2 md:mt-2 md:min-h-0 md:flex-1 md:flex-col md:overflow-y-auto md:pb-4"
        aria-label="Primary"
      >
        {NAV.map(({ href, label, icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`relative flex shrink-0 cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors duration-150 ${
                active ? "bg-surface2 font-medium text-ink" : "text-muted hover:bg-surface2/60 hover:text-ink"
              }`}
            >
              {active && (
                <span
                  className="absolute left-0 top-1/2 hidden h-4 w-0.5 -translate-y-1/2 rounded-full bg-accent md:block"
                  aria-hidden
                />
              )}
              <Icon name={icon} className={`h-4 w-4 ${active ? "text-accent" : "text-faint"}`} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="border-line px-2 pt-1 md:shrink-0 md:border-t md:pb-3 md:pt-2">
        <LogoutButton />
        <p className="hidden px-3 pt-1 font-display text-[11px] text-faint md:block">
          TradeCraft Sites · operator console
        </p>
      </div>
    </aside>
  );
}
