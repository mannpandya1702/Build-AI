import { notFound } from "next/navigation";

import { getService, services } from "@/content/services";
import { OG_SIZE, brandOgImage } from "@/lib/ogImage";

/**
 * Without this the route ships as a Lambda: every crawler or WhatsApp fetch of
 * any of the eleven service cards would boot a function, re-read the fonts and
 * re-rasterise bytes that never change. Listing the slugs prerenders all
 * eleven at build time, alongside the six static pages' cards.
 */
export function generateStaticParams() {
  return services.map((service) => ({ slug: service.slug }));
}

export const alt = "One of Riwaaya's eleven lines of work";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const service = getService(slug);
  if (!service) notFound();

  return brandOgImage(service.title, "One of eleven contracted lines of work");
}
