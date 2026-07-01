"use client";

import { site, telHref } from "../lib/content";

// Sticky tap-to-call, visible without scrolling on mobile. The single highest-ROI element on the
// site (CLAUDE.md §5b). Selective glass (CLAUDE.md §5b-bis): one of the few floating elements that
// earns translucency + blur. Fixed to the bottom on phones; hidden on desktop.
export default function StickyCallBar() {
  const href = telHref(site.phone);
  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-ink/80 backdrop-blur-xl md:hidden">
      <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-2.5">
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-sm font-extrabold text-white">{site.businessName}</p>
          <p className="truncate text-xs text-white/60">
            {site.city}, {site.state}
          </p>
        </div>
        {href ? (
          <a
            href={href}
            className="flex min-h-tap items-center justify-center rounded-full bg-brand px-6 font-display text-base font-extrabold text-brandink shadow-cta active:scale-95"
            aria-label={`Call ${site.businessName} now`}
          >
            Call now
          </a>
        ) : (
          <a
            href="#quote"
            className="flex min-h-tap items-center justify-center rounded-full bg-brand px-6 font-display text-base font-extrabold text-brandink shadow-cta"
          >
            Get a quote
          </a>
        )}
      </div>
    </div>
  );
}
