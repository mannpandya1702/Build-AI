"use client";

import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { Logo } from "@/components/brand/Logo";
import { WhatsAppCTA } from "@/components/ui/WhatsAppCTA";
import { EASE } from "@/lib/motion";
import { nav } from "@/lib/site";
import { useScrolledPast } from "@/lib/useScrolledPast";
import { cn } from "@/lib/utils";

/**
 * Routes that open with a full-bleed dark hero. On these the bar starts
 * transparent; everywhere else it starts solid so it never sits invisible
 * over body copy.
 */
const HERO_ROUTES = new Set(["/"]);

/**
 * Transparent over the hero, then solidifies to chandni with a hairline border
 * and a soft shadow past 40px of scroll.
 */
export function Nav() {
  const scrolled = useScrolledPast(40);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const shouldReduce = useReducedMotion();
  const overHero = HERO_ROUTES.has(pathname);

  // Close the drawer on navigation. Adjusting during render rather than in an
  // effect means the drawer is already gone on the first frame of the new
  // route, instead of flashing open for a paint.
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }

  // Lock the page behind the open drawer.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const solid = scrolled || !overHero || open;

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-[350ms] ease-riwaaya",
        solid ? "border-b border-ink/10 bg-chandni shadow-nav" : "border-b border-transparent bg-transparent",
      )}
    >
      <div className="shell flex items-center justify-between py-4 md:py-5">
        <Link
          href="/"
          aria-label="Riwaaya — home"
          className="transition-opacity duration-[250ms] ease-riwaaya hover:opacity-70"
        >
          <Logo size="sm" layout="row" tone={solid ? "ink" : "chandni"} />
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-9 lg:flex">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "sweep-underline font-sans text-micro font-semibold tracking-[0.01em] transition-colors duration-[250ms] ease-riwaaya",
                solid ? "text-ink" : "text-chandni",
              )}
            >
              {item.label}
            </Link>
          ))}
          <WhatsAppCTA variant="nav" tone={solid ? "ink" : "chandni"} />
        </nav>

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? "Close menu" : "Open menu"}
          className={cn(
            "flex h-11 w-11 items-center justify-center rounded-full border transition-colors duration-[250ms] ease-riwaaya lg:hidden",
            solid ? "border-ink/20 text-ink" : "border-chandni/40 text-chandni",
          )}
        >
          {open ? (
            <X aria-hidden className="h-5 w-5" strokeWidth={1.5} />
          ) : (
            <Menu aria-hidden className="h-5 w-5" strokeWidth={1.5} />
          )}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            className="overflow-hidden border-t border-ink/10 bg-chandni lg:hidden"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: shouldReduce ? 0.15 : 0.45, ease: EASE }}
          >
            <nav aria-label="Mobile" className="shell flex flex-col gap-1 py-6">
              {nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="border-b border-ink/10 py-4 font-display text-3xl font-light text-ink"
                >
                  {item.label}
                </Link>
              ))}
              <WhatsAppCTA variant="inline" className="mt-6 w-full" />
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
