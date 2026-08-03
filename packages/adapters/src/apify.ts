// Apify Google Maps adapter — free-tier discovery alternative, used when DISCOVERY_PROVIDER=apify.
// Mirrors the places.ts surface (searchPlaces / placeDetails / fetchPhotoBytes) returning the same
// PlaceHit shape, so research/scrape/builder stay provider-agnostic. Apify's Google Maps actor
// returns a place's reviews and photo URLs inline, so `apifyDetails` re-targets the actor by placeId
// and photos are plain URLs fetched directly (no separate media step). Trade-off vs the official API:
// this scrapes Maps (less stable, ToS gray-area) — kept behind the flag and off by default.
import type { PlaceHit } from "./places.js";

const ACTOR = "compass~crawler-google-places";

function token(): string {
  const t = process.env.APIFY_TOKEN;
  if (!t) throw new Error("APIFY_TOKEN is not set");
  return t;
}

interface ApifyPlace {
  placeId?: string;
  title?: string;
  address?: string;
  phone?: string;
  totalScore?: number;
  reviewsCount?: number;
  website?: string;
  url?: string;
  permanentlyClosed?: boolean;
  temporarilyClosed?: boolean;
  imageUrls?: string[];
  reviews?: { text?: string; stars?: number; rating?: number; name?: string }[];
}

/** Run the actor synchronously and return its dataset items. Apify caps sync runs (~5 min). */
async function runActor(input: Record<string, unknown>, timeoutSec = 180): Promise<ApifyPlace[]> {
  const res = await fetch(
    `https://api.apify.com/v2/acts/${ACTOR}/run-sync-get-dataset-items?token=${token()}&timeout=${timeoutSec}`,
    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) },
  );
  if (!res.ok) throw new Error(`apify ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return (await res.json()) as ApifyPlace[];
}

function toHit(p: ApifyPlace): PlaceHit {
  return {
    id: p.placeId ?? "",
    displayName: { text: p.title },
    formattedAddress: p.address,
    businessStatus: p.permanentlyClosed
      ? "CLOSED_PERMANENTLY"
      : p.temporarilyClosed
        ? "CLOSED_TEMPORARILY"
        : "OPERATIONAL",
    rating: p.totalScore,
    userRatingCount: p.reviewsCount,
    websiteUri: p.website,
    nationalPhoneNumber: p.phone,
    googleMapsUri: p.url,
    // photos carry direct image URLs (fetchPhotoBytes fetches http names directly).
    photos: (p.imageUrls ?? []).map((u) => ({ name: u })),
    reviews: (p.reviews ?? [])
      .filter((r) => r.text)
      .map((r) => ({
        rating: r.stars ?? r.rating,
        text: { text: r.text },
        authorAttribution: { displayName: r.name ?? undefined },
      })),
  };
}

export async function apifySearch(
  query: string,
  maxResultCount = 20,
): Promise<{ places: PlaceHit[]; nextPageToken?: string }> {
  const items = await runActor({
    searchStringsArray: [query],
    maxCrawledPlacesPerSearch: maxResultCount,
    language: "en",
    maxReviews: 5,
    maxImages: 6,
    scrapeReviewsPersonalData: false,
  });
  // Apify paginates internally via maxCrawledPlacesPerSearch; no page token to hand back.
  return { places: items.filter((p) => p.placeId).map(toHit) };
}

export async function apifyDetails(placeId: string): Promise<PlaceHit> {
  const items = await runActor({ placeIds: [placeId], maxReviews: 8, maxImages: 8 }, 180);
  if (items.length === 0) throw new Error(`apify details: no place for ${placeId}`);
  return toHit(items[0]);
}

/** Fetch a photo. Apify photo "names" are already direct URLs, so fetch them straight. */
export async function apifyPhotoBytes(nameOrUrl: string): Promise<Buffer> {
  const img = await fetch(nameOrUrl);
  if (!img.ok) throw new Error(`apify photo ${img.status}`);
  return Buffer.from(await img.arrayBuffer());
}
