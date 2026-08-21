"use client";

import { useId, useRef, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export type TabDef = {
  id: string;
  label: string;
  /** Small count or score shown beside the label. */
  badge?: string;
  tone?: "good" | "warn" | "bad";
  panel: ReactNode;
};

/**
 * The panel's top-level sections.
 *
 * This replaced three stacked panels on one very long page. The content was
 * the same, but everything after the first screen was found by scrolling past
 * things you were not looking for — the studio's word for it was that there
 * were no clear sections, which was fair.
 *
 * Server-rendered content is passed in as `panel` nodes, so the pages are
 * still measured on the server; this component only decides which one is on
 * screen. All three stay mounted so switching is instant and the browser's
 * find-in-page still reaches the hidden ones.
 */
export function Tabs({ tabs }: { tabs: TabDef[] }) {
  const [active, setActive] = useState(tabs[0]?.id);
  const base = useId();
  const listRef = useRef<HTMLDivElement>(null);

  /** Left/right arrows move between tabs, which is what a tablist should do. */
  function onKeyDown(event: React.KeyboardEvent) {
    const delta = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
    if (!delta) return;
    event.preventDefault();

    const index = tabs.findIndex((tab) => tab.id === active);
    const next = tabs[(index + delta + tabs.length) % tabs.length];
    setActive(next.id);
    listRef.current
      ?.querySelector<HTMLButtonElement>(`#${CSS.escape(`${base}-${next.id}-tab`)}`)
      ?.focus();
  }

  return (
    <>
      <div className="sticky top-0 z-20 -mx-6 border-b border-ink/12 bg-chandni/95 px-6 backdrop-blur">
        <div
          ref={listRef}
          role="tablist"
          aria-label="Panel sections"
          onKeyDown={onKeyDown}
          className="mx-auto flex max-w-6xl gap-1 overflow-x-auto"
        >
          {tabs.map((tab) => {
            const selected = tab.id === active;

            return (
              <button
                key={tab.id}
                id={`${base}-${tab.id}-tab`}
                role="tab"
                type="button"
                aria-selected={selected}
                aria-controls={`${base}-${tab.id}-panel`}
                tabIndex={selected ? 0 : -1}
                onClick={() => setActive(tab.id)}
                className={cn(
                  "-mb-px flex shrink-0 items-center gap-2.5 border-b-2 px-4 py-4 font-sans text-body-sm transition-colors",
                  selected
                    ? "border-pista-ink text-ink"
                    : "border-transparent text-stone-deep hover:text-ink",
                )}
              >
                <span className={selected ? "font-semibold" : undefined}>{tab.label}</span>

                {tab.badge && (
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 font-sans text-[0.625rem] font-semibold tabular-nums lining-nums",
                      tab.tone === "bad"
                        ? "bg-[#a8443a]/14 text-[#8f3a32]"
                        : tab.tone === "warn"
                          ? "bg-[#9a7433]/16 text-[#7d5d24]"
                          : tab.tone === "good"
                            ? "bg-[#3f6b3f]/14 text-[#33562f]"
                            : "bg-ink/8 text-stone-deep",
                    )}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {tabs.map((tab) => (
        <div
          key={tab.id}
          id={`${base}-${tab.id}-panel`}
          role="tabpanel"
          aria-labelledby={`${base}-${tab.id}-tab`}
          hidden={tab.id !== active}
          className="pt-10"
        >
          {tab.panel}
        </div>
      ))}
    </>
  );
}
