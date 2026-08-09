"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowRight, X } from "lucide-react";
import { useCallback, useEffect, useRef } from "react";

import { ImageSlot } from "@/components/media/ImageSlot";
import type { GalleryItem } from "@/content/gallery";
import { EASE } from "@/lib/motion";

/**
 * Modal image viewer used by the signature grid and the gallery page.
 *
 * Keyboard: Escape closes, ← → move between images, Tab is trapped inside the
 * dialog, and focus returns to the thumbnail that opened it.
 */
export function Lightbox({
  items,
  index,
  onClose,
  onNavigate,
}: {
  items: GalleryItem[];
  index: number | null;
  onClose: () => void;
  onNavigate: (next: number) => void;
}) {
  const shouldReduce = useReducedMotion();
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);

  const open = index !== null;
  const item = open ? items[index] : null;

  const goNext = useCallback(() => {
    if (index === null) return;
    onNavigate((index + 1) % items.length);
  }, [index, items.length, onNavigate]);

  const goPrev = useCallback(() => {
    if (index === null) return;
    onNavigate((index - 1 + items.length) % items.length);
  }, [index, items.length, onNavigate]);

  // Remember what had focus, move focus into the dialog, restore on close.
  useEffect(() => {
    if (!open) return;
    restoreFocusRef.current = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    return () => restoreFocusRef.current?.focus?.();
  }, [open]);

  // Lock the page behind the modal.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        goNext();
        return;
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        goPrev();
        return;
      }
      if (event.key !== "Tab") return;

      // Trap Tab within the dialog.
      const focusables = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      if (!focusables?.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose, goNext, goPrev]);

  return (
    <AnimatePresence>
      {open && item && (
        <motion.div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-ink/95 p-4 md:p-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: shouldReduce ? 0.15 : 0.35, ease: EASE }}
          onClick={(event) => {
            if (event.target === event.currentTarget) onClose();
          }}
        >
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label={`${item.caption} — image ${index! + 1} of ${items.length}`}
            className="relative flex w-full max-w-5xl flex-col items-center gap-5"
          >
            <div className="flex w-full items-center justify-between">
              <p className="font-sans text-micro uppercase tracking-[0.14em] text-chandni/60">
                {index! + 1} / {items.length}
              </p>
              <button
                ref={closeRef}
                type="button"
                onClick={onClose}
                aria-label="Close image viewer"
                className="flex h-11 w-11 items-center justify-center rounded-full border border-chandni/30 text-chandni transition-colors duration-[250ms] ease-riwaaya hover:bg-chandni hover:text-ink"
              >
                <X aria-hidden className="h-5 w-5" strokeWidth={1.5} />
              </button>
            </div>

            <motion.div
              key={item.id}
              className="w-full"
              initial={shouldReduce ? { opacity: 0 } : { opacity: 0, scale: 0.98 }}
              animate={shouldReduce ? { opacity: 1 } : { opacity: 1, scale: 1 }}
              transition={{ duration: shouldReduce ? 0.15 : 0.45, ease: EASE }}
            >
              <ImageSlot
                slot={item.slot}
                alt={item.alt}
                aspect={item.aspect}
                src={item.src}
                hover={false}
                sizes="(max-width: 1024px) 100vw, 1024px"
                className="mx-auto max-h-[70vh] w-full [&>div]:max-h-[70vh]"
              />
            </motion.div>

            <div className="flex w-full items-center justify-between gap-4">
              <button
                type="button"
                onClick={goPrev}
                aria-label="Previous image"
                className="flex h-11 w-11 items-center justify-center rounded-full border border-chandni/30 text-chandni transition-colors duration-[250ms] ease-riwaaya hover:bg-chandni hover:text-ink"
              >
                <ArrowLeft aria-hidden className="h-5 w-5" strokeWidth={1.5} />
              </button>

              <p className="text-center font-display text-2xl font-light text-chandni">
                {item.caption}
                <span className="mt-1 block font-sans text-micro uppercase tracking-[0.14em] text-chandni/50">
                  {item.category}
                </span>
              </p>

              <button
                type="button"
                onClick={goNext}
                aria-label="Next image"
                className="flex h-11 w-11 items-center justify-center rounded-full border border-chandni/30 text-chandni transition-colors duration-[250ms] ease-riwaaya hover:bg-chandni hover:text-ink"
              >
                <ArrowRight aria-hidden className="h-5 w-5" strokeWidth={1.5} />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
