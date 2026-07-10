// Research Agent (spec §6.1): no LLM. Places queries from icp.yaml (keywords x cities), dedupe on
// google_place_id + normalized domain against leads AND suppression_list. Stops at requested
// count or the Places cap.
import { emitEvent, getPool } from "@autopilot/core";
import { searchPlaces, loadIcp, CapExceededError } from "@autopilot/adapters";

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);
}

function domainOf(url?: string): string | null {
  if (!url) return null;
  try {
    return new URL(url.startsWith("http") ? url : `https://${url}`).host.replace(/^www\./, "");
  } catch {
    return null;
  }
}

function cityRegion(addr?: string): { city: string | null; region: string | null } {
  const m = (addr ?? "").match(/([^,]+),\s*([A-Z]{2})\s*\d{5}/);
  return m ? { city: m[1].trim(), region: m[2] } : { city: null, region: null };
}

export interface ResearchTargeting {
  vertical?: string;
  cities?: string[];
  country?: string;
}

export async function research(requestId: string, count: number, targeting?: ResearchTargeting): Promise<void> {
  const pool = getPool();

  // Explicit targeting from the dashboard's discover panel wins over icp.yaml + saved overrides.
  const icp = await mergedIcp();
  if (targeting?.vertical?.trim()) icp.active_vertical = targeting.vertical.trim().toLowerCase();
  if (targeting?.cities?.length) icp.cities = targeting.cities;
  if (targeting?.country?.trim()) icp.country = targeting.country.trim();

  await emitEvent({
    agent: "research",
    type: "research.started",
    message: `target ${count} · ${icp.active_vertical} · ${icp.cities.length} cities · ${icp.country}`,
    payload: { request_id: requestId, count, vertical: icp.active_vertical, cities: icp.cities, country: icp.country },
  });

  // Custom niches (not in icp.yaml's verticals map) search by the niche name itself.
  const keywords: string[] = icp.verticals[icp.active_vertical]?.keywords ?? [icp.active_vertical];
  // Places text search resolves US "City, ST" strings alone; outside the US the country name in the
  // query keeps results in the right place ("plumbers in Richmond, Australia" vs Richmond, VA).
  const countrySuffix = icp.country && icp.country.toUpperCase() !== "US" ? `, ${icp.country}` : "";

  const existing = await pool.query<{ google_place_id: string | null; website_url: string | null }>(
    "select google_place_id, website_url from leads",
  );
  const seenPlace = new Set(existing.rows.map((r) => r.google_place_id).filter(Boolean) as string[]);
  const seenDomain = new Set(existing.rows.map((r) => domainOf(r.website_url ?? undefined)).filter(Boolean) as string[]);
  const suppressed = new Set(
    (await pool.query<{ domain: string | null }>("select domain from suppression_list where domain is not null")).rows.map((r) => r.domain as string),
  );

  let discovered = 0;
  outer: for (const city of icp.cities) {
    for (const kw of keywords) {
      if (discovered >= count) break outer;
      let pageToken: string | undefined;
      do {
        let hits;
        try {
          hits = await searchPlaces(`${kw} in ${city}${countrySuffix}`, 20, pageToken);
        } catch (err) {
          if (err instanceof CapExceededError) {
            await emitEvent({ agent: "research", level: "warn", type: "research.paused", message: err.message, payload: { request_id: requestId } });
            break outer;
          }
          throw err;
        }
        for (const p of hits.places) {
          if (discovered >= count) break outer;
          if (!p.id || seenPlace.has(p.id)) continue;
          const dom = domainOf(p.websiteUri);
          if (dom && (seenDomain.has(dom) || suppressed.has(dom))) continue;
          if (p.businessStatus && p.businessStatus !== "OPERATIONAL") continue;
          const { city: c, region } = cityRegion(p.formattedAddress);
          const name = p.displayName?.text ?? "Unknown";
          await pool.query(
            `insert into leads (company_name, slug, industry, city, region, country, website_url, google_place_id, gbp_url,
                                review_count, rating, contact_phone, source, status)
             values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'places','discovered')
             on conflict (google_place_id) do nothing`,
            [
              name,
              `${slugify(name)}-${p.id.slice(-6).toLowerCase()}`,
              icp.active_vertical,
              c,
              region,
              icp.country,
              p.websiteUri ?? null,
              p.id,
              p.googleMapsUri ?? null,
              p.userRatingCount ?? null,
              p.rating ?? null,
              p.nationalPhoneNumber ?? null,
            ],
          );
          seenPlace.add(p.id);
          if (dom) seenDomain.add(dom);
          discovered++;
        }
        pageToken = hits.nextPageToken;
      } while (pageToken && discovered < count);
    }
  }

  await emitEvent({ agent: "research", type: "research.completed", message: `discovered ${discovered}`, payload: { request_id: requestId, discovered } });
}

/** icp.yaml merged with operator overrides saved from /settings (spec §2.3 + Phase 2 acceptance). */
async function mergedIcp() {
  const icp = loadIcp();
  const r = await getPool().query<{ value: any }>("select value from settings where key = 'icp_overrides'");
  if (r.rowCount) {
    const o = r.rows[0].value ?? {};
    if (Array.isArray(o.cities) && o.cities.length) icp.cities = o.cities;
    // custom verticals are allowed: keywords fall back to the niche name itself
    if (typeof o.active_vertical === "string" && o.active_vertical.trim()) icp.active_vertical = o.active_vertical.trim().toLowerCase();
    if (typeof o.country === "string" && o.country.trim()) icp.country = o.country.trim();
    if (typeof o.qualify_threshold === "number") icp.qualify_threshold = o.qualify_threshold;
  }
  return icp;
}
