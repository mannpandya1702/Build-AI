// src/discovery/places.ts — Places API (New) client: Text Search, Place Details (cache-first),
// Photo bytes, and a mobile-viewport site-quality probe. Uses the built-in global fetch (Node 18+).
// Legacy endpoints are NOT used; field names are the New-API names (SETUP.md §7).

import "../env";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CACHE_DIR = resolve(__dirname, "../../data/cache");
const BASE = "https://places.googleapis.com/v1";

function apiKey(): string {
  const key = process.env.GOOGLE_PLACES_API_KEY ?? "";
  if (!key) {
    throw new Error(
      "GOOGLE_PLACES_API_KEY is missing. Add it to .env.local (never commit it) and re-run.",
    );
  }
  return key;
}

export interface PlaceCandidate {
  id: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  types?: string[];
  businessStatus?: string;
}

export interface PlaceReview {
  rating?: number;
  text?: { text?: string };
  authorAttribution?: { displayName?: string };
  relativePublishTimeDescription?: string;
}

export interface PlacePhoto {
  name: string; // "places/<id>/photos/<ref>"
  widthPx?: number;
  heightPx?: number;
}

export interface PlaceDetails {
  id: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  rating?: number;
  userRatingCount?: number; // New API name (not user_ratings_total)
  websiteUri?: string; // New API name (not website); absence = no website
  nationalPhoneNumber?: string;
  location?: { latitude: number; longitude: number };
  googleMapsUri?: string;
  photos?: PlacePhoto[];
  reviews?: PlaceReview[];
  businessStatus?: string;
}

/** Text Search (New). Minimal field mask to control cost; paginates via nextPageToken. */
export async function textSearch(
  textQuery: string,
  maxResultCount = 20,
  pageToken?: string,
): Promise<{ candidates: PlaceCandidate[]; nextPageToken?: string }> {
  const res = await fetch(`${BASE}/places:searchText`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey(),
      "X-Goog-FieldMask":
        "places.id,places.displayName,places.formattedAddress,places.types,places.businessStatus,nextPageToken",
    },
    body: JSON.stringify({
      textQuery,
      maxResultCount,
      ...(pageToken ? { pageToken } : {}),
    }),
  });
  if (!res.ok) {
    throw new Error(`Places textSearch failed: ${res.status} ${await res.text()}`);
  }
  const data = (await res.json()) as { places?: PlaceCandidate[]; nextPageToken?: string };
  return { candidates: data.places ?? [], nextPageToken: data.nextPageToken };
}

/**
 * Place Details (New), cache-first. Every response is cached to data/cache/<id>.json so re-runs
 * cost nothing (SETUP.md §7). `reviews` is billed higher, so it is only requested when needed.
 */
export async function placeDetails(placeId: string, includeReviews = false): Promise<PlaceDetails> {
  if (!existsSync(CACHE_DIR)) mkdirSync(CACHE_DIR, { recursive: true });
  const cachePath = resolve(CACHE_DIR, `${placeId}.json`);

  if (existsSync(cachePath)) {
    const cached = JSON.parse(readFileSync(cachePath, "utf8")) as PlaceDetails;
    // Serve cache unless the caller now needs reviews the cached copy does not have.
    if (!includeReviews || (cached.reviews && cached.reviews.length > 0)) return cached;
  }

  const baseFields =
    "id,displayName,formattedAddress,rating,userRatingCount,websiteUri,nationalPhoneNumber,location,googleMapsUri,photos,businessStatus";
  const fieldMask = includeReviews ? `${baseFields},reviews` : baseFields;

  const res = await fetch(`${BASE}/places/${placeId}`, {
    headers: { "X-Goog-Api-Key": apiKey(), "X-Goog-FieldMask": fieldMask },
  });
  if (!res.ok) {
    throw new Error(`Places details failed for ${placeId}: ${res.status} ${await res.text()}`);
  }
  const data = (await res.json()) as PlaceDetails;
  writeFileSync(cachePath, JSON.stringify(data, null, 2), "utf8");
  return data;
}

/**
 * Places Photo (New). Returns the raw image bytes for a photo resource name. Confirm the current
 * Photo endpoint in Google's docs at build time; this uses the documented /media?...skipHttpRedirect
 * form and then fetches the returned photoUri.
 */
export async function fetchPhotoBytes(photoName: string, maxWidthPx = 1280): Promise<ArrayBuffer> {
  const res = await fetch(
    `${BASE}/${photoName}/media?maxWidthPx=${maxWidthPx}&skipHttpRedirect=true`,
    { headers: { "X-Goog-Api-Key": apiKey() } },
  );
  if (!res.ok) throw new Error(`Places photo failed: ${res.status} ${await res.text()}`);
  const data = (await res.json()) as { photoUri?: string };
  if (!data.photoUri) throw new Error(`No photoUri returned for ${photoName}`);
  const img = await fetch(data.photoUri);
  if (!img.ok) throw new Error(`Photo download failed: ${img.status}`);
  return img.arrayBuffer();
}

export interface SiteProbe {
  reachable: boolean;
  loadMs: number | null;
  mobileResponsive: boolean;
  notes: string;
}

/**
 * Load an existing site at a mobile viewport and report whether it renders, roughly how long it
 * took, and whether it looks mobile-responsive. A broken/slow/non-responsive site is a gap that
 * still qualifies (CLAUDE.md §4). Puppeteer is imported lazily so cache-only re-runs do not need it.
 */
export async function probeSite(url: string): Promise<SiteProbe> {
  const puppeteer = (await import("puppeteer")).default;
  const browser = await puppeteer.launch({ args: ["--no-sandbox", "--disable-setuid-sandbox"] });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 390, height: 844, isMobile: true, deviceScaleFactor: 2 });

    let reachable = true;
    let loadMs: number | null = null;
    try {
      const t0 = Date.now();
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 15000 });
      loadMs = Date.now() - t0;
    } catch {
      reachable = false;
    }

    let mobileResponsive = false;
    if (reachable) {
      mobileResponsive = await page.evaluate(() => {
        const hasViewport = Boolean(document.querySelector('meta[name="viewport"]'));
        const bodyWidth = document.body ? document.body.scrollWidth : 0;
        const noHorizontalOverflow = bodyWidth <= window.innerWidth + 24;
        return hasViewport && noHorizontalOverflow;
      });
    }

    return {
      reachable,
      loadMs,
      mobileResponsive,
      notes: reachable
        ? `loaded in ${loadMs}ms, mobile-responsive=${mobileResponsive}`
        : "did not load / unreachable",
    };
  } finally {
    await browser.close();
  }
}
