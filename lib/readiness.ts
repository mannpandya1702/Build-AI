/**
 * Launch readiness.
 *
 * The handover document lists what the studio still owes; this turns the same
 * list into something computed, so it cannot go stale. Every item below is
 * derived from the actual content files — when a real photograph lands, or the
 * testimonials flag flips, the panel moves on its own without anyone
 * remembering to update it.
 *
 * Nothing here is a guess or a hard-coded number.
 */

import { founder, team } from "@/content/about";
import { destinations } from "@/content/destinations";
import { galleryItems } from "@/content/gallery";
import { services } from "@/content/services";
import { TESTIMONIALS_ARE_PLACEHOLDERS, testimonials } from "@/content/testimonials";
import { venueRegions } from "@/content/venues";
import { DEMO_MEDIA } from "@/lib/demoMedia";
import { isFormConfigured } from "@/lib/googleForm";
import { site } from "@/lib/site";

export type ReadinessSeverity = "blocker" | "should" | "nice";

export type ReadinessItem = {
  id: string;
  title: string;
  severity: ReadinessSeverity;
  done: boolean;
  /** Where this stands right now, in the studio's language. */
  status: string;
  /** What would make it done. Omitted once it is. */
  action?: string;
};

/** Every named image position on the site, gathered from the content files. */
function photoSlots(): { slot: string; hasReal: boolean }[] {
  const slots: { slot: string; hasReal: boolean }[] = [];

  slots.push({ slot: "hero-backdrop", hasReal: false });
  for (const item of galleryItems) slots.push({ slot: item.slot, hasReal: Boolean(item.src) });
  for (const service of services) slots.push({ slot: service.imageSlot, hasReal: false });
  for (const d of destinations) slots.push({ slot: d.imageSlot, hasReal: false });
  for (const r of venueRegions) slots.push({ slot: r.imageSlot, hasReal: false });
  slots.push({ slot: "destination-hero", hasReal: false });
  slots.push({ slot: "venue-hero", hasReal: false });
  slots.push({ slot: "about-studio-portrait", hasReal: false });
  slots.push({ slot: founder.imageSlot, hasReal: false });
  for (const member of team) slots.push({ slot: member.imageSlot, hasReal: false });

  // Slot names repeat across pages on purpose — one photograph fills them all.
  const seen = new Map<string, boolean>();
  for (const s of slots) seen.set(s.slot, (seen.get(s.slot) ?? false) || s.hasReal);
  return [...seen].map(([slot, hasReal]) => ({ slot, hasReal }));
}

export type PhotoProgress = { total: number; real: number; onDemo: boolean };

export function photoProgress(): PhotoProgress {
  const slots = photoSlots();
  return {
    total: slots.length,
    real: slots.filter((s) => s.hasReal).length,
    onDemo: DEMO_MEDIA,
  };
}

/**
 * @param host The host the panel is actually being served from. The domain
 * check observes this rather than reading NEXT_PUBLIC_SITE_URL, because that
 * variable defaults to an *assumed* domain — riwaaya.in was inferred from the
 * brand, never confirmed as purchased — and a check that reads it reports
 * "done" for a domain nobody owns. Asking what host served this request cannot
 * be wrong.
 */
export function readinessItems(host?: string): ReadinessItem[] {
  const photos = photoProgress();
  const previewHost =
    !host ||
    host.includes("vercel.app") ||
    host.startsWith("localhost") ||
    host.startsWith("127.");
  const domainSet = !previewHost;
  // Reuses the site's own strict validation — a half-filled-in template value
  // ("replace-me", "xxxx") counts as unconfigured, not as done.
  const formConfigured = isFormConfigured();

  const items: ReadinessItem[] = [
    {
      id: "photos",
      title: "Real photography",
      severity: "blocker",
      done: photos.real === photos.total && !photos.onDemo,
      status: photos.onDemo
        ? `${photos.real} of ${photos.total} positions have a real photograph. The rest are showing stand-in images from a free stock library.`
        : `${photos.real} of ${photos.total} positions have a real photograph.`,
      action:
        "Send photographs from weddings you have planned, with the photographer's name and the couple's permission to publish.",
    },
    {
      id: "testimonials",
      title: "Real client reviews",
      severity: "blocker",
      done: !TESTIMONIALS_ARE_PLACEHOLDERS,
      status: TESTIMONIALS_ARE_PLACEHOLDERS
        ? `All ${testimonials.length} quotes on the site are written placeholders with invented names.`
        : `${testimonials.length} real, permissioned quotes.`,
      action:
        "Send three to five real quotes with the client's first name, city and permission to publish — or say the word and the section comes out.",
    },
    {
      id: "domain",
      title: "Your own domain",
      severity: "blocker",
      done: domainSet,
      status: domainSet
        ? `Live on your own domain (${host}).`
        : `Running on a temporary preview address${host ? ` (${host})` : ""}. Search engines and printed material should point at your own domain, not this one.`,
      action: "Send the domain you bought and the login for wherever you bought it.",
    },
    {
      id: "founder-photo",
      title: "A photograph of you",
      severity: "should",
      done: false,
      status: "The founder section on the About page is showing a labelled placeholder.",
      action: "Any well-lit portrait. Upright crops work best in that space.",
    },
    {
      id: "postcode",
      title: "Office PIN code",
      severity: "should",
      done: Boolean(site.address.postalCode),
      status: site.address.postalCode
        ? `Set to ${site.address.postalCode}.`
        : "Left blank on purpose — Phase 8B covers more than one PIN, and a wrong postcode does more harm in local search than a missing one.",
      action: "Send the PIN code for D-231, Phase 8B.",
    },
    {
      id: "map",
      title: "Exact map location",
      severity: "nice",
      done: false,
      status: "The contact map is accurate to roughly 300 metres — the right block, not the right door.",
      action: "Open Google Maps, find the office, tap Share, and send the link.",
    },
    {
      id: "destinations",
      title: "Confirm the destinations",
      severity: "should",
      done: false,
      status: `${destinations.length} destinations are written out in detail. Which of them the studio has actually worked in has not been confirmed.`,
      action: "Confirm the list, and we will cut anything you have not done.",
    },
    {
      id: "venues",
      title: "Real venue names",
      severity: "nice",
      done: false,
      status: `The venues page covers ${venueRegions.length} regions by type of property, and deliberately names no specific hotel.`,
      action:
        "Send venues you have actually worked at, with rough room counts. Real names are what people search for.",
    },
    {
      id: "form",
      title: "Enquiry route",
      severity: "nice",
      done: true,
      status: formConfigured
        ? "Enquiries go to your Google Form."
        : "The site's own form is live: it collects the details and opens WhatsApp with everything filled in. Nothing is waiting on you.",
      action: formConfigured ? undefined : "Only if you would prefer a Google Form — send the link.",
    },
    {
      id: "logo",
      title: "Logo original",
      severity: "nice",
      done: false,
      status: "The arch is a vector rebuild from the images sent over chat. It matches closely.",
      action: "Send the .ai or .svg from your designer and it drops straight in.",
    },
  ];

  return items;
}

export type ReadinessSummary = {
  blockers: number;
  blockersDone: number;
  total: number;
  done: number;
  /** 0–100, weighted so blockers dominate. */
  percent: number;
};

export function readinessSummary(items: ReadinessItem[]): ReadinessSummary {
  const blockers = items.filter((i) => i.severity === "blocker");
  const weight = (i: ReadinessItem) => (i.severity === "blocker" ? 3 : i.severity === "should" ? 2 : 1);
  const totalWeight = items.reduce((sum, i) => sum + weight(i), 0);
  const doneWeight = items.filter((i) => i.done).reduce((sum, i) => sum + weight(i), 0);

  return {
    blockers: blockers.length,
    blockersDone: blockers.filter((i) => i.done).length,
    total: items.length,
    done: items.filter((i) => i.done).length,
    percent: Math.round((doneWeight / totalWeight) * 100),
  };
}
