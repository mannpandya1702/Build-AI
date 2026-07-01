"use client";

import { site, telHref } from "../lib/content";

// Sticky tap-to-call, visible without scrolling on mobile. The single highest-ROI element on the
// site (CLAUDE.md §5b). Fixed to the bottom on phones; hidden on desktop where the header CTA shows.
export default function StickyCallBar() {
  const href = telHref(site.phone);
  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-black/10 bg-white/95 backdrop-blur md:hidden">
      <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-gray-900">{site.businessName}</p>
          <p className="truncate text-xs text-gray-500">{site.city}, {site.state}</p>
        </div>
        {href ? (
          <a
            href={href}
            className="flex min-h-tap items-center justify-center rounded-full bg-brand px-5 text-base font-bold text-brandink shadow-lg active:scale-95"
            aria-label={`Call ${site.businessName} now`}
          >
            Call now
          </a>
        ) : (
          <a
            href="#quote"
            className="flex min-h-tap items-center justify-center rounded-full bg-brand px-5 text-base font-bold text-brandink shadow-lg"
          >
            Get a quote
          </a>
        )}
      </div>
    </div>
  );
}
