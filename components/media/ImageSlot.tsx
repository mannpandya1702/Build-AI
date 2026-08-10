"use client";

import Image from "next/image";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

import { demoSrc } from "@/lib/demoMedia";
import { DURATION, EASE } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * Every photograph on the site goes through this component.
 *
 * There is no real photography yet, so with no `src` it renders a labelled
 * placeholder at the correct aspect ratio — the layout is already final and
 * nothing shifts when the images arrive (CLS stays at 0). Pass `src` and it
 * switches to next/image with the same crop, parallax and hover behaviour.
 *
 * `slot` is written to data-slot so the client can match a file to a position.
 */

export type ImageSlotProps = {
  /** Name the client matches their photo to, e.g. "signature-01-mandap". */
  slot: string;
  /** Required. Written now so it cannot be skipped when photos land. */
  alt: string;
  /** CSS aspect-ratio, e.g. "4 / 5". Reserves space before any image loads. */
  aspect?: string;
  /** Set once a real file exists under /public/photography. */
  src?: string;
  /** Pointed-arch crop. Capped at two uses per page — it is a shape, not a mark. */
  taak?: boolean;
  /** Subtle scroll parallax, ±6% translateY. */
  parallax?: boolean;
  /** scale 1.03 + pistachio overlay to 0.15 on hover. */
  hover?: boolean;
  /** Caption rendered under the frame. */
  caption?: string;
  /** next/image sizes attribute — keep accurate for bandwidth. */
  sizes?: string;
  priority?: boolean;
  className?: string;
};

export function ImageSlot({
  slot,
  alt,
  aspect = "3 / 2",
  src,
  taak = false,
  parallax = false,
  hover = true,
  caption,
  sizes = "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw",
  priority = false,
  className,
}: ImageSlotProps) {
  const shouldReduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);

  /**
   * A real `src` always wins. Failing that, temporary demo photography fills
   * the slot so the layout can be reviewed with something in it. Turning
   * DEMO_MEDIA off drops every slot back to its labelled placeholder with no
   * layout change — see lib/demoMedia.ts.
   */
  const resolvedSrc = src ?? demoSrc(slot);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  // ±6% travel across the element's time in the viewport.
  const y = useTransform(scrollYProgress, [0, 1], ["-6%", "6%"]);
  const parallaxOn = parallax && !shouldReduce;

  return (
    <figure className={cn("group/slot", className)}>
      <div
        ref={ref}
        data-slot={slot}
        className={cn(
          "relative w-full overflow-hidden bg-pista-mist",
          taak ? "taak" : "rounded-sm",
        )}
        style={{ aspectRatio: aspect }}
      >
        <motion.div
          className="absolute inset-0"
          style={parallaxOn ? { y, scale: 1.12 } : undefined}
        >
          {resolvedSrc ? (
            <Image
              src={resolvedSrc}
              alt={alt}
              fill
              sizes={sizes}
              priority={priority}
              className={cn(
                "object-cover transition-transform duration-[400ms] ease-riwaaya",
                hover && "group-hover/slot:scale-[1.03]",
              )}
            />
          ) : (
            <PlaceholderFace slot={slot} aspect={aspect} hover={hover} />
          )}
        </motion.div>

        {/* Pistachio wash fades 0 → 0.15 over 400ms on hover. */}
        {hover && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-pista opacity-0 transition-opacity duration-[400ms] ease-riwaaya group-hover/slot:opacity-15"
          />
        )}
      </div>

      {caption && (
        <figcaption className="mt-3 font-sans text-micro text-stone-deep">{caption}</figcaption>
      )}
    </figure>
  );
}

/**
 * The placeholder itself. Deliberately plain: brand tint, a hairline frame,
 * the slot name and the ratio. No stock imagery, no generated art.
 */
function PlaceholderFace({
  slot,
  aspect,
  hover,
}: {
  slot: string;
  aspect: string;
  hover: boolean;
}) {
  return (
    <div
      className={cn(
        "absolute inset-0 flex flex-col items-center justify-center gap-2 bg-pista-mist p-4 text-center transition-transform duration-[400ms] ease-riwaaya",
        hover && "group-hover/slot:scale-[1.03]",
      )}
    >
      <span
        aria-hidden
        className="absolute inset-3 border border-dashed border-pista-deep/35"
      />
      <span className="relative font-sans text-eyebrow uppercase text-pista-ink">
        Photo
      </span>
      <span className="relative max-w-[85%] break-words font-sans text-micro text-stone-deep">
        {slot}
      </span>
      <span className="relative font-sans text-[0.6875rem] tracking-[0.08em] text-stone-deep">
        {aspect.replace(/\s/g, "")}
      </span>
    </div>
  );
}

/** Motion constants re-exported so section files stay on the same numbers. */
export const IMAGE_MOTION = { duration: DURATION.hover, ease: EASE };
