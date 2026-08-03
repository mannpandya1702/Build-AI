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
  // present only when requested via a scout field mask
  rating?: number;
  userRatingCount?: number;
  websiteUri?: string;
  nationalPhoneNumber?: string;
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

/**
 * Text Search (New). Default minimal field mask to control cost; paginates via nextPageToken.
 * Pass a custom fieldMask (e.g. including rating/userRatingCount/websiteUri) for one-page market
 * scouting, where a single richer request replaces twenty Details calls.
 */
export async function textSearch(
  textQuery: string,
  maxResultCount = 20,
  pageToken?: string,
  fieldMask?: string,
): Promise<{ candidates: PlaceCandidate[]; nextPageToken?: string }> {
  const res = await fetch(`${BASE}/places:searchText`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey(),
      "X-Goog-FieldMask":
        fieldMask ??
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
  status: number | null;
  loadMs: number | null;
  hasViewportMeta: boolean; // the most reliable "built for mobile" signal, present in the served HTML
  builder: string | null; // a hosted site-builder platform detected in the HTML (Wix, Squarespace...)
  notes: string;
}

// Hosted site builders. A business on one of these already has a polished, mobile-ready site, which
// per CLAUDE.md §4 means "nothing to sell". WordPress is intentionally NOT here: it is too variable
// (a WP site can be great or terrible), so it is judged on other signals, not auto-disqualified.
const BUILDER_SIGNATURES: [RegExp, string][] = [
  [/wix\.com|wixstatic|X-Wix-/i, "Wix"],
  [/squarespace/i, "Squarespace"],
  [/webflow/i, "Webflow"],
  [/cdn\.shopify|Shopify\./i, "Shopify"],
  [/dudaone|dudamobile|irp\.cdn-website/i, "Duda"],
  [/weebly/i, "Weebly"],
  [/godaddy|websitebuilder\.godaddy/i, "GoDaddy Builder"],
];

/**
 * Probe an existing site with a plain HTTP fetch (mobile UA). Reports reachability, rough response
 * time, whether the served HTML has a viewport meta (built for mobile), and whether it is on a hosted
 * site builder. A fetch is used rather than a headless browser because it is faster, more reliable,
 * and works in restricted/proxied networks where a browser cannot reach external sites. A
 * missing/broken/no-viewport site is a gap that qualifies (CLAUDE.md §4).
 */
export async function probeSite(url: string): Promise<SiteProbe> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  const t0 = Date.now();
  try {
    const res = await fetch(url, {
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Safari/604.1",
      },
    });
    let html = "";
    try {
      html = await res.text();
    } catch {
      // ignore body read errors; status alone still tells us reachability
    }
    const loadMs = Date.now() - t0;
    const reachable = res.status >= 200 && res.status < 400;
    const hasViewportMeta = /<meta[^>]+name=["']viewport["'][^>]*>/i.test(html);
    const builder = BUILDER_SIGNATURES.find(([re]) => re.test(html))?.[1] ?? null;
    return {
      reachable,
      status: res.status,
      loadMs,
      hasViewportMeta,
      builder,
      notes: `HTTP ${res.status} in ${loadMs}ms, viewport=${hasViewportMeta}${builder ? `, builder=${builder}` : ""}`,
    };
  } catch (err) {
    return {
      reachable: false,
      status: null,
      loadMs: null,
      hasViewportMeta: false,
      builder: null,
      notes: `fetch failed: ${(err as Error).name}`,
    };
  } finally {
    clearTimeout(timer);
  }
}
