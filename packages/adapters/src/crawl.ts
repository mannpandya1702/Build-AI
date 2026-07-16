// Site crawl adapter (spec §6.2): public pages only, honest UA, robots.txt respected, 1 req/2s
// per domain (spec §4.6). ENV ADAPTATION (logged in PROGRESS.md): headless browsers cannot reach
// external sites directly in this container, so crawling uses Node fetch (which routes through
// the proxy); the Phase 3 screenshot adapter reuses the legacy request-interception technique.
import { MOCK, loadCaps } from "./config.js";

const UA = "AgencyAutopilotBot/0.1 (+website audit for outreach; contact: operator)";
const lastHit = new Map<string, number>();

async function politeFetch(url: string): Promise<Response> {
  const host = new URL(url).host;
  const caps = loadCaps();
  const wait = (lastHit.get(host) ?? 0) + caps.crawl.per_domain_min_interval_ms - Date.now();
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastHit.set(host, Date.now());
  return fetch(url, {
    headers: { "User-Agent": UA },
    redirect: "follow",
    signal: AbortSignal.timeout(15000),
  });
}

async function allowedByRobots(base: URL, path: string): Promise<boolean> {
  try {
    const res = await politeFetch(`${base.origin}/robots.txt`);
    if (!res.ok) return true;
    const txt = await res.text();
    // minimal parser: honor Disallow lines under User-agent: * (good-faith compliance, §4.6)
    let inStar = false;
    for (const line of txt.split("\n")) {
      const l = line.trim().toLowerCase();
      if (l.startsWith("user-agent:")) inStar = l.includes("*");
      else if (inStar && l.startsWith("disallow:")) {
        const rule = l.slice(9).trim();
        if (rule && rule !== "/" && path.startsWith(rule)) return false;
        if (rule === "/") return false;
      }
    }
    return true;
  } catch {
    return true;
  }
}

export interface CrawledPage {
  url: string;
  status: number;
  html: string;
}

/** Crawl homepage + likely contact/about pages, max N pages (spec §6.2). */
export async function crawlSite(siteUrl: string): Promise<CrawledPage[]> {
  if (MOCK()) {
    return [
      {
        url: siteUrl,
        status: 200,
        html: "<html><body>Mock page. Email us: owner@mock.test or call (214) 555-0100.</body></html>",
      },
    ];
  }
  const caps = loadCaps();
  const base = new URL(siteUrl.startsWith("http") ? siteUrl : `https://${siteUrl}`);
  const pages: CrawledPage[] = [];
  const targets = ["/", "/contact", "/contact-us", "/about", "/about-us"];
  for (const path of targets.slice(0, caps.crawl.max_pages_per_site)) {
    if (!(await allowedByRobots(base, path))) continue;
    try {
      const res = await politeFetch(`${base.origin}${path}`);
      const html = res.ok ? await res.text() : "";
      pages.push({ url: `${base.origin}${path}`, status: res.status, html: html.slice(0, 200_000) });
      if (path === "/" && !res.ok) break; // dead site: don't hammer inner pages
    } catch {
      pages.push({ url: `${base.origin}${path}`, status: 0, html: "" });
      if (path === "/") break;
    }
  }
  return pages;
}
