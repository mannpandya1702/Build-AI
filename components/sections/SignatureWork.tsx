"use client";

import Link from "next/link";
import { useState } from "react";

import { ImageSlot } from "@/components/media/ImageSlot";
import { Reveal, Stagger } from "@/components/motion/Reveal";
import { Lightbox } from "@/components/ui/Lightbox";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { signatureWork } from "@/content/gallery";
import { cn } from "@/lib/utils";

/**
 * Asymmetric editorial grid over 12 columns. Each item carries its own span
 * and an optional vertical offset, so the grid never settles into rows —
 * which is what stops it reading as a stock card wall.
 *
 * Items are buttons, not divs, so the lightbox is reachable by keyboard.
 */

const spanClass: Record<number, string> = {
  4: "lg:col-span-4",
  5: "lg:col-span-5",
  6: "lg:col-span-6",
  7: "lg:col-span-7",
  8: "lg:col-span-8",
};

export function SignatureWork() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="work" className="scroll-mt-24 bg-chandni pb-section">
      <div className="shell">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <SectionHeading eyebrow="Signature work" title="A few rooms we have built." />
          <Reveal>
            <Link
              href="/gallery"
              className="sweep-underline font-sans text-micro font-semibold uppercase tracking-[0.14em] text-pista-ink"
            >
              See the full gallery
            </Link>
          </Reveal>
        </div>

        <Stagger className="mt-16 grid grid-cols-1 gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-12 lg:gap-y-16">
          {signatureWork.map((item, index) => (
            <Reveal
              asChild
              key={item.id}
              className={cn(
                "sm:col-span-1",
                spanClass[item.span ?? 6],
                item.offset && "lg:mt-16",
              )}
            >
              <div>
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
                    parallax
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 45vw"
                  />
                  <div className="mt-4 flex items-baseline justify-between gap-4">
                    <p className="font-display text-2xl font-light text-ink">
                      {item.caption}
                    </p>
                    <p className="font-sans text-micro uppercase tracking-[0.14em] text-stone-deep">
                      {item.category}
                    </p>
                  </div>
                </button>
              </div>
            </Reveal>
          ))}
        </Stagger>
      </div>

      <Lightbox
        items={signatureWork}
        index={openIndex}
        onClose={() => setOpenIndex(null)}
        onNavigate={setOpenIndex}
      />
    </section>
  );
}
