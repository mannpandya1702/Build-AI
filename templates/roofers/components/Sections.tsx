"use client";

import { motion, useReducedMotion } from "framer-motion";
import { site, mapEmbedUrl } from "../lib/content";

// A single scroll-reveal wrapper reused across sections. Respects reduced motion.
function Reveal({ children, className }: { children: React.ReactNode; className?: string }) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function Services() {
  return (
    <section id="services" className="mx-auto max-w-3xl px-5 py-14 md:max-w-5xl">
      <Reveal>
        <h2 className="text-3xl font-black text-gray-900 md:text-4xl">What we do</h2>
        <p className="mt-2 text-gray-600">Serving {site.city} and nearby.</p>
      </Reveal>
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {site.services.map((s, i) => (
          <Reveal key={s} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <span className="text-sm font-bold text-brand">0{i + 1}</span>
            <h3 className="mt-1 text-lg font-bold text-gray-900">{s}</h3>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

export function Gallery() {
  const hasPhotos = site.photos.length > 0;
  return (
    <section id="work" className="bg-gray-50 py-14">
      <div className="mx-auto max-w-3xl px-5 md:max-w-5xl">
        <Reveal>
          <h2 className="text-3xl font-black text-gray-900 md:text-4xl">Recent work</h2>
        </Reveal>
        <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-3">
          {hasPhotos
            ? site.photos.map((p, i) => (
                <Reveal key={p.src} className="overflow-hidden rounded-xl bg-white">
                  {/* Real GBP photo. loading=lazy keeps the mobile speed budget (CLAUDE.md §5b). */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.src} alt={p.alt} loading="lazy" className="aspect-square w-full object-cover" />
                </Reveal>
              ))
            : // No GBP photos: tasteful placeholders, never fabricated imagery (CLAUDE.md §0, §5d).
              Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  aria-hidden
                  className="aspect-square rounded-xl bg-gradient-to-br from-gray-200 to-gray-300"
                />
              ))}
        </div>
        {!hasPhotos && (
          <p className="mt-3 text-sm text-gray-500">Photos of our recent jobs going up here.</p>
        )}
      </div>
    </section>
  );
}

export function Reviews() {
  if (site.reviews.length === 0) return null; // omit rather than invent (CLAUDE.md §0)
  return (
    <section id="reviews" className="mx-auto max-w-3xl px-5 py-14 md:max-w-5xl">
      <Reveal>
        <h2 className="text-3xl font-black text-gray-900 md:text-4xl">What {site.city} says</h2>
      </Reveal>
      <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
        {site.reviews.map((r, i) => (
          <Reveal key={i} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-yellow-500" aria-label={`${r.rating} out of 5 stars`}>
              {"★".repeat(Math.round(r.rating))}
            </p>
            <p className="mt-2 text-gray-700">{r.text}</p>
            <p className="mt-3 text-sm font-semibold text-gray-900">{r.author}</p>
          </Reveal>
        ))}
      </div>
      <p className="mt-4 text-sm text-gray-500">Pulled from real Google reviews.</p>
    </section>
  );
}

export function Contact() {
  return (
    <section id="contact" className="bg-gray-50 py-14">
      <div className="mx-auto max-w-3xl px-5 md:max-w-5xl">
        <Reveal>
          <h2 className="text-3xl font-black text-gray-900 md:text-4xl">Find us</h2>
        </Reveal>
        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="space-y-2 text-gray-700">
            <p className="text-lg font-bold text-gray-900">{site.businessName}</p>
            {site.address && <p>{site.address}</p>}
            {site.phone && <p>Phone: {site.phone}</p>}
            <p>Serving {site.city}, {site.state} and nearby.</p>
          </div>
          <div className="overflow-hidden rounded-2xl border border-gray-200">
            <iframe
              title={`Map of ${site.businessName}`}
              src={mapEmbedUrl(site.mapQuery)}
              loading="lazy"
              className="h-64 w-full"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
