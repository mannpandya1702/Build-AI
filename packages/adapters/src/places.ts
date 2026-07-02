// Google Places (New) adapter (spec §3): no scraping of Maps HTML. Cost-metered via caps.ts.
// Ported from the proven legacy client. MOCK_MODE serves fixtures.
import { MOCK } from "./config.js";
import { checkPlacesCap, meterPlacesCall } from "./caps.js";

const BASE = "https://places.googleapis.com/v1";

function apiKey(): string {
  const k = process.env.GOOGLE_PLACES_API_KEY;
  if (!k) throw new Error("GOOGLE_PLACES_API_KEY is not set");
  return k;
}

export interface PlaceHit {
  id: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  businessStatus?: string;
  rating?: number;
  userRatingCount?: number;
  websiteUri?: string;
  nationalPhoneNumber?: string;
  googleMapsUri?: string;
  photos?: { name: string }[];
  reviews?: { rating?: number; text?: { text?: string }; authorAttribution?: { displayName?: string } }[];
}

const SEARCH_MASK =
  "places.id,places.displayName,places.formattedAddress,places.businessStatus,places.rating,places.userRatingCount,places.websiteUri,places.nationalPhoneNumber,places.googleMapsUri,nextPageToken";

export async function searchPlaces(query: string, maxResultCount = 20, pageToken?: string): Promise<{ places: PlaceHit[]; nextPageToken?: string }> {
  if (MOCK()) {
    return {
      places: Array.from({ length: 5 }, (_, i) => ({
        id: `mock-place-${query.replace(/\W+/g, "-")}-${i}`,
        displayName: { text: `Mock Biz ${i} (${query})` },
        formattedAddress: `${100 + i} Main St, Dallas, TX 75201`,
        businessStatus: "OPERATIONAL",
        rating: 4.8,
        userRatingCount: 40 + i * 13,
        nationalPhoneNumber: "(214) 555-0100",
      })),
    };
  }
  await checkPlacesCap();
  const res = await fetch(`${BASE}/places:searchText`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Goog-Api-Key": apiKey(), "X-Goog-FieldMask": SEARCH_MASK },
    body: JSON.stringify({ textQuery: query, maxResultCount, ...(pageToken ? { pageToken } : {}) }),
  });
  await meterPlacesCall(`searchText: ${query}`);
  if (!res.ok) throw new Error(`places search ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = (await res.json()) as { places?: PlaceHit[]; nextPageToken?: string };
  return { places: data.places ?? [], nextPageToken: data.nextPageToken };
}

const DETAILS_MASK =
  "id,displayName,formattedAddress,rating,userRatingCount,websiteUri,nationalPhoneNumber,googleMapsUri,photos,businessStatus,reviews";

export async function placeDetails(placeId: string): Promise<PlaceHit> {
  if (MOCK()) {
    return {
      id: placeId,
      displayName: { text: "Mock Details Co" },
      rating: 4.9,
      userRatingCount: 77,
      reviews: [{ rating: 5, text: { text: "Fixture review, verbatim." }, authorAttribution: { displayName: "Fixture" } }],
    };
  }
  await checkPlacesCap();
  const res = await fetch(`${BASE}/places/${placeId}`, {
    headers: { "X-Goog-Api-Key": apiKey(), "X-Goog-FieldMask": DETAILS_MASK },
  });
  await meterPlacesCall(`details: ${placeId}`);
  if (!res.ok) throw new Error(`places details ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return (await res.json()) as PlaceHit;
}
