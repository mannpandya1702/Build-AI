import Link from "next/link";
import type { ReactNode } from "react";

import { Reveal } from "@/components/motion/Reveal";

/**
 * Header for every route that is not the home page. Starts below the solid
 * nav, so there is no dark hero to sit over.
 */
export function PageHeader({
  eyebrow,
  title,
  lede,
  breadcrumb,
  children,
}: {
  eyebrow: string;
  title: string;
  lede?: string;
  breadcrumb?: { label: string; href: string }[];
  children?: ReactNode;
}) {
  return (
    <header className="bg-chandni pb-section-sm pt-32 md:pt-40">
      <div className="shell">
        {breadcrumb && (
          <Reveal>
            <nav aria-label="Breadcrumb" className="mb-8">
              <ol className="flex flex-wrap items-center gap-2 font-sans text-micro text-stone-deep">
                {breadcrumb.map((crumb, index) => (
                  <li key={crumb.href} className="flex items-center gap-2">
                    {index > 0 && <span aria-hidden>/</span>}
                    <Link
                      href={crumb.href}
                      className="sweep-underline transition-colors duration-[250ms] ease-riwaaya hover:text-ink"
                    >
                      {crumb.label}
                    </Link>
                  </li>
                ))}
              </ol>
            </nav>
          </Reveal>
        )}

        {/* This block is above the fold on every route that uses it, and the
            h1 is the LCP element. It animates in CSS rather than through
            Framer so it paints before hydration — same easing and duration as
            the JS reveals, staggered by the same 80ms. */}
        <div className="flex flex-col gap-6">
          <p
            className="eyebrow-rule rise-in font-sans text-eyebrow font-semibold uppercase text-pista-ink"
            style={{ animationDelay: "60ms" }}
          >
            {eyebrow}
          </p>

          {/* rise-in-solid, not rise-in: this is the LCP element on every
              route that uses PageHeader. See the note in globals.css. */}
          <h1
            className="rise-in-solid max-w-4xl font-display text-display-lg font-light text-ink"
            style={{ animationDelay: "140ms" }}
          >
            {title}
          </h1>

          {lede && (
            <p
              className="rise-in max-w-prose font-sans text-lede text-stone-deep"
              style={{ animationDelay: "220ms" }}
            >
              {lede}
            </p>
          )}

          {children && (
            <div className="rise-in" style={{ animationDelay: "300ms" }}>
              {children}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
