"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useMemo, useState } from "react";

import { ImageSlot } from "@/components/media/ImageSlot";
import { Lightbox } from "@/components/ui/Lightbox";
import { galleryCategories, galleryItems, type GalleryCategory } from "@/content/gallery";
import { EASE, STAGGER } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * Filterable masonry.
 *
 * The masonry is CSS columns rather than a JS layout pass — no measuring, no
 * reflow on filter, and it degrades to a single column on mobile for free.
 * Items re-enter with a short stagger when the filter changes.
 *
 * Filters are real buttons in a labelled group with aria-pressed, and the
 * result count is announced politely so the change is not silent.
 */
export function GalleryGrid() {
  const [filter, setFilter] = useState<GalleryCategory | "All">("All");
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const shouldReduce = useReducedMotion();

  const filtered = useMemo(
    () =>
      filter === "All"
        ? galleryItems
        : galleryItems.filter((item) => item.category === filter),
    [filter],
  );

  const filters: (GalleryCategory | "All")[] = ["All", ...galleryCategories];

  return (
    <>
      <div className="shell">
        <div
          role="group"
          aria-label="Filter work by event type"
          className="flex flex-wrap gap-2 border-b border-ink/10 pb-8"
        >
          {filters.map((option) => {
            const active = option === filter;
            return (
              <button
                key={option}
                type="button"
                aria-pressed={active}
                onClick={() => {
                  setFilter(option);
                  setOpenIndex(null);
                }}
                className={cn(
                  "sweep-fill min-h-[44px] cursor-pointer rounded-full border px-5 py-2 font-sans text-micro font-semibold tracking-[0.01em] transition-colors duration-[250ms] ease-riwaaya",
                  active
                    ? "border-pista-ink bg-pista-ink text-chandni"
                    : "border-ink/20 text-ink before:bg-pista hover:border-ink/40",
                )}
              >
                {option}
              </button>
            );
          })}
        </div>

        <p aria-live="polite" className="sr-only">
          {filtered.length} {filtered.length === 1 ? "image" : "images"} shown
          {filter === "All" ? "" : ` for ${filter}`}.
        </p>

        <div className="mt-12 columns-1 gap-8 sm:columns-2 lg:columns-3">
          <AnimatePresence mode="popLayout">
            {filtered.map((item, index) => (
              <motion.div
                key={item.id}
                layout={!shouldReduce}
                initial={shouldReduce ? { opacity: 0 } : { opacity: 0, y: 24 }}
                animate={shouldReduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
                exit={shouldReduce ? { opacity: 0 } : { opacity: 0, y: -12 }}
                transition={{
                  duration: shouldReduce ? 0.2 : 0.5,
                  ease: EASE,
                  delay: shouldReduce ? 0 : Math.min(index, 6) * STAGGER * 0.5,
                }}
                className="mb-8 break-inside-avoid"
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(index)}
                  aria-label={`Open ${item.caption} in the image viewer`}
                  className="group/slot block w-full cursor-pointer text-left"
                >
                  <ImageSlot
                    slot={item.slot}
                    alt={item.alt}
                    aspect={item.aspect}
                    src={item.src}
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                  <div className="mt-4 flex items-baseline justify-between gap-4">
                    <p className="font-display text-xl font-light text-ink">
                      {item.caption}
                    </p>
                    <p className="font-sans text-[0.75rem] uppercase tracking-[0.14em] text-stone-deep">
                      {item.category}
                    </p>
                  </div>
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      <Lightbox
        items={filtered}
        index={openIndex}
        onClose={() => setOpenIndex(null)}
        onNavigate={setOpenIndex}
      />
    </>
  );
}
