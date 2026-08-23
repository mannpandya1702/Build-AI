/**
 * Visitor numbers.
 *
 * There is a hard constraint here worth stating plainly, because it shapes the
 * whole panel: this is a static marketing site with no database and no server
 * of its own. It cannot count its own visitors. Traffic figures have to come
 * from an analytics service, and until one is connected there are no numbers
 * to show.
 *
 * So this module does one thing: if a provider is configured, it fetches real
 * figures. If not, it says so. It never invents a number, and it never renders
 * a "sample" chart — a dashboard showing plausible-looking fake traffic is
 * worse than one showing none, because the studio would make decisions on it.
 *
 * Collection is already running via @vercel/analytics in the root layout, so
 * data accrues from today whether or not this panel can read it back.
 */

export type TrafficPoint = { date: string; visitors: number };

export type TrafficPage = { path: string; visitors: number };

export type TrafficSource = { source: string; visitors: number };

export type Traffic =
  | { connected: false; reason: string }
  | {
      connected: true;
      provider: string;
      period: string;
      visitors: number;
      pageviews: number;
      /** Percent of visits that were a single page with no interaction. */
      bounceRate: number | null;
      /** Seconds. */
      visitDuration: number | null;
      series: TrafficPoint[];
      topPages: TrafficPage[];
      topSources: TrafficSource[];
    };

const PERIOD = "30d";

/**
 * Plausible's Stats API. Chosen because it is a documented, stable REST API
 * that works with a plain bearer token — no OAuth dance, which matters for a
 * panel that has to run unattended on a serverless request.
 *
 * To connect: set PLAUSIBLE_SITE_ID (the domain as registered) and
 * PLAUSIBLE_API_KEY. PLAUSIBLE_HOST is only needed for a self-hosted instance.
 */
async function fromPlausible(): Promise<Traffic | null> {
  const site = process.env.PLAUSIBLE_SITE_ID;
  const key = process.env.PLAUSIBLE_API_KEY;
  if (!site || !key) return null;

  const host = process.env.PLAUSIBLE_HOST ?? "https://plausible.io";
  const auth = { Authorization: `Bearer ${key}` };
  const get = async (path: string) => {
    const res = await fetch(`${host}/api/v1/stats/${path}`, {
      headers: auth,
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) throw new Error(`Plausible returned ${res.status}`);
    return res.json();
  };

  const metrics = "visitors,pageviews,bounce_rate,visit_duration";
  const [aggregate, timeseries, pages, sources] = await Promise.all([
    get(`aggregate?site_id=${site}&period=${PERIOD}&metrics=${metrics}`),
    get(`timeseries?site_id=${site}&period=${PERIOD}&metrics=visitors`),
    get(`breakdown?site_id=${site}&period=${PERIOD}&property=event:page&metrics=visitors&limit=8`),
    get(`breakdown?site_id=${site}&period=${PERIOD}&property=visit:source&metrics=visitors&limit=8`),
  ]);

  const agg = aggregate.results ?? {};
  return {
    connected: true,
    provider: "Plausible",
    period: "Last 30 days",
    visitors: agg.visitors?.value ?? 0,
    pageviews: agg.pageviews?.value ?? 0,
    bounceRate: agg.bounce_rate?.value ?? null,
    visitDuration: agg.visit_duration?.value ?? null,
    series: (timeseries.results ?? []).map((r: { date: string; visitors: number }) => ({
      date: r.date,
      visitors: r.visitors ?? 0,
    })),
    topPages: (pages.results ?? []).map((r: { page: string; visitors: number }) => ({
      path: r.page,
      visitors: r.visitors ?? 0,
    })),
    topSources: (sources.results ?? []).map((r: { source: string; visitors: number }) => ({
      source: r.source || "Direct",
      visitors: r.visitors ?? 0,
    })),
  };
}


/* ------------------------------------------------------------------ */
/* Umami                                                               */
/* ------------------------------------------------------------------ */

/**
 * Umami, the open-source alternative. Same idea as Plausible and the same
 * two-variable setup, but it has a free hosted tier — which matters when the
 * only thing standing between the studio and real numbers is a subscription.
 *
 * UMAMI_SITE_ID and UMAMI_API_KEY, plus UMAMI_HOST if self-hosted. Cloud keys
 * authenticate with an x-umami-api-key header; a self-hosted instance issued a
 * bearer token works through the same header on recent versions.
 */
async function fromUmami(): Promise<Traffic | null> {
  const site = process.env.UMAMI_SITE_ID;
  const key = process.env.UMAMI_API_KEY;
  if (!site || !key) return null;

  const host = process.env.UMAMI_HOST ?? "https://api.umami.is";
  const base = host.includes("api.umami.is") ? `${host}/v1` : `${host}/api`;

  // Umami takes an explicit millisecond window rather than a period keyword.
  const endAt = Date.now();
  const startAt = endAt - 30 * 24 * 60 * 60 * 1000;
  const window = `startAt=${startAt}&endAt=${endAt}`;

  const get = async (path: string) => {
    const res = await fetch(`${base}/websites/${site}/${path}`, {
      headers: { "x-umami-api-key": key, accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) throw new Error(`Umami returned ${res.status}`);
    return res.json();
  };

  const [stats, series, pages, sources] = await Promise.all([
    get(`stats?${window}`),
    get(`pageviews?${window}&unit=day&timezone=Asia/Kolkata`),
    get(`metrics?${window}&type=url&limit=8`),
    get(`metrics?${window}&type=referrer&limit=8`),
  ]);

  const value = (metric: unknown): number =>
    typeof metric === "number" ? metric : ((metric as { value?: number })?.value ?? 0);

  const visitors = value(stats.visitors);
  const bounces = value(stats.bounces);
  const totalTime = value(stats.totaltime);

  return {
    connected: true,
    provider: "Umami",
    period: "Last 30 days",
    visitors,
    pageviews: value(stats.pageviews),
    // Umami reports a bounce count, not a rate — the panel wants a percent.
    bounceRate: visitors > 0 ? Math.round((bounces / visitors) * 100) : null,
    visitDuration: visitors > 0 ? Math.round(totalTime / visitors) : null,
    series: ((series.sessions ?? series.pageviews ?? []) as { x: string; y: number }[]).map((p) => ({
      date: p.x,
      visitors: p.y ?? 0,
    })),
    topPages: ((pages ?? []) as { x: string; y: number }[]).map((r) => ({
      path: r.x,
      visitors: r.y ?? 0,
    })),
    topSources: ((sources ?? []) as { x: string; y: number }[]).map((r) => ({
      source: r.x || "Direct",
      visitors: r.y ?? 0,
    })),
  };
}

export async function getTraffic(): Promise<Traffic> {
  try {
    // Whichever is configured wins; if both are, Plausible goes first.
    const plausible = await fromPlausible();
    if (plausible) return plausible;

    const umamiResult = await fromUmami();
    if (umamiResult) return umamiResult;
  } catch (error) {
    return {
      connected: false,
      reason:
        error instanceof Error
          ? `Analytics is configured but the request failed: ${error.message}`
          : "Analytics is configured but the request failed.",
    };
  }

  return {
    connected: false,
    reason: "No analytics service is connected yet, so there are no visitor numbers to show.",
  };
}
