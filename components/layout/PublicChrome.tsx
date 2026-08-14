"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/**
 * Hides the marketing chrome — nav, footer, floating WhatsApp button, custom
 * cursor — on the studio panel at /admin.
 *
 * Done in a client component reading the pathname rather than with a route
 * group, because escaping the root layout in the App Router means two root
 * layouts, each with its own <html>, <body>, font wiring and globals import.
 * That is a lot of duplicated shell to keep in sync for one private page, and
 * the shell is exactly the part that must not drift.
 *
 * The panel has its own header and needs the page to itself: the site nav is
 * fixed, so it sits on top of the panel's own bar, and a marketing footer
 * under a set of internal metrics reads as a mistake.
 */
const CHROMELESS = ["/admin"];

export function PublicChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const bare = CHROMELESS.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  if (bare) return null;
  return <>{children}</>;
}
