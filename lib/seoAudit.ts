/**
 * SEO audit.
 *
 * This reads the site's own rendered HTML rather than its source. That matters:
 * an audit built from the content files tells you what the code intends, and
 * quietly goes stale the moment a page sets its own title or a component stops
 * emitting a heading. Fetching the served markup measures what a crawler
 * actually receives, so the panel cannot drift away from reality.
 *
 * Deliberately dependency-free. The extraction below is regex over HTML, which
 * is the wrong tool for parsing arbitrary documents and exactly the right one
 * here: the input is our own Next.js output, the shapes are known, and adding a
 * parser to the bundle to read six pages would be a poor trade.
 */

import { destinations } from "@/content/destinations";
import { services } from "@/content/services";
import { site } from "@/lib/site";

export type CheckStatus = "pass" | "warn" | "fail";

export type Check = {
  id: string;
  label: string;
  status: CheckStatus;
  /** What was actually found — a length, a count, a string. */
  value: string;
  /** Why it matters and what to do. Written for the studio, not a developer. */
  detail: string;
};

export type PageAudit = {
  path: string;
  name: string;
  /** What this page is meant to be found by. See AuditRoute. */
  targets: string[];
  ok: boolean;
  /** Set when the page could not be fetched at all. */
  error?: string;
  title: string;
  titleLength: number;
  description: string;
  descriptionLength: number;
  canonical: string | null;
  h1: string[];
  h2Count: number;
  words: number;
  images: number;
  imagesWithAlt: number;
  internalLinks: number;
  externalLinks: number;
  schemaTypes: string[];
  ogTags: number;
  noindex: boolean;
  checks: Check[];
};

/* ------------------------------------------------------------------ */
/* Thresholds                                                          */
/* ------------------------------------------------------------------ */

/**
 * Google truncates the blue link around 580px, which lands near 60 characters
 * for mixed-case Latin text, and the snippet near 160. Both are soft — nothing
 * is penalised for exceeding them, the tail is simply not shown — so they are
 * warnings, never failures.
 */
const TITLE_MIN = 25;
const TITLE_MAX = 60;
const DESC_MIN = 70;
const DESC_MAX = 160;
/** Below this a page reads as thin to a crawler and rarely ranks for anything. */
const WORDS_MIN = 300;

/* ------------------------------------------------------------------ */
/* Extraction                                                          */
/* ------------------------------------------------------------------ */

function decode(input: string): string {
  return input
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code: string) => String.fromCharCode(parseInt(code, 16)))
    .replace(/&nbsp;/g, " ")
    .replace(/&mdash;/g, "—")
    .replace(/&ndash;/g, "–");
}

function meta(html: string, name: string, attr: "name" | "property" = "name"): string {
  // Attribute order is not guaranteed, so match either way round.
  const patterns = [
    new RegExp(`<meta[^>]*${attr}="${name}"[^>]*content="([^"]*)"`, "i"),
    new RegExp(`<meta[^>]*content="([^"]*)"[^>]*${attr}="${name}"`, "i"),
  ];
  for (const re of patterns) {
    const m = html.match(re);
    if (m) return decode(m[1]);
  }
  return "";
}

/** Body text with script, style and tags stripped — what a reader actually reads. */
function visibleText(html: string): string {
  const body = html.match(/<body[^>]*>([\s\S]*)<\/body>/i)?.[1] ?? html;
  return decode(
    body
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " "),
  )
    .replace(/\s+/g, " ")
    .trim();
}

function schemaTypesIn(html: string): string[] {
  const found = new Set<string>();
  const blocks = html.matchAll(
    /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi,
  );
  for (const block of blocks) {
    try {
      const parsed: unknown = JSON.parse(decode(block[1]));
      const walk = (node: unknown) => {
        if (Array.isArray(node)) return node.forEach(walk);
        if (node && typeof node === "object") {
          const type = (node as Record<string, unknown>)["@type"];
          if (typeof type === "string") found.add(type);
        }
      };
      walk(parsed);
    } catch {
      found.add("(unparseable)");
    }
  }
  return [...found].sort();
}

/* ------------------------------------------------------------------ */
/* Rules                                                               */
/* ------------------------------------------------------------------ */

function buildChecks(a: Omit<PageAudit, "checks" | "ok">, keyphraseHit: boolean): Check[] {
  const checks: Check[] = [];

  checks.push({
    id: "title",
    label: "Page title",
    status: !a.title ? "fail" : a.titleLength > TITLE_MAX || a.titleLength < TITLE_MIN ? "warn" : "pass",
    value: `${a.titleLength} characters`,
    detail: !a.title
      ? "This page has no title. It is the blue line in every Google result and the text on a browser tab — a page without one is close to invisible in search."
      : a.titleLength > TITLE_MAX
        ? `Google shows roughly the first ${TITLE_MAX} characters and cuts the rest. Nothing is penalised, but the end of this title will not be read.`
        : a.titleLength < TITLE_MIN
          ? "Short enough that it is probably not describing the page fully. There is room for more."
          : "Fits in a Google result without being cut.",
  });

  checks.push({
    id: "description",
    label: "Search description",
    status: !a.description ? "fail" : a.descriptionLength > DESC_MAX || a.descriptionLength < DESC_MIN ? "warn" : "pass",
    value: a.description ? `${a.descriptionLength} characters` : "missing",
    detail: !a.description
      ? "No description, so Google will pick a sentence from the page itself — usually not the one you would choose."
      : a.descriptionLength > DESC_MAX
        ? `Past about ${DESC_MAX} characters the tail is cut off in results.`
        : a.descriptionLength < DESC_MIN
          ? "Short. This is the sales pitch under the blue link; there is room to say more."
          : "A good length for the snippet under the search result.",
  });

  checks.push({
    id: "h1",
    label: "Main heading",
    status: a.h1.length === 1 ? "pass" : a.h1.length === 0 ? "fail" : "warn",
    value: a.h1.length === 1 ? a.h1[0].slice(0, 60) : `${a.h1.length} found`,
    detail:
      a.h1.length === 1
        ? "Exactly one main heading, which is what search engines expect."
        : a.h1.length === 0
          ? "No main heading. Search engines use it to work out what the page is about."
          : "More than one main heading competes for the same job. One per page is the rule.",
  });

  checks.push({
    id: "words",
    label: "Amount of text",
    status: a.words >= WORDS_MIN ? "pass" : a.words >= 150 ? "warn" : "fail",
    value: `${a.words.toLocaleString("en-IN")} words`,
    detail:
      a.words >= WORDS_MIN
        ? "Enough for search engines to understand the page properly."
        : "Thin. Pages with little text rarely rank, because there is not much for a search engine to match a question against.",
  });

  const altPct = a.images ? Math.round((a.imagesWithAlt / a.images) * 100) : 100;
  checks.push({
    id: "alt",
    label: "Image descriptions",
    status: altPct === 100 ? "pass" : altPct >= 80 ? "warn" : "fail",
    value: a.images ? `${a.imagesWithAlt} of ${a.images}` : "no images",
    detail:
      altPct === 100
        ? "Every image has a written description. This is what screen readers announce, and it is how images get found in Google Images."
        : "Some images have no description. Those are invisible to screen readers and to image search.",
  });

  checks.push({
    id: "schema",
    label: "Structured data",
    status: a.schemaTypes.length ? (a.schemaTypes.includes("(unparseable)") ? "fail" : "pass") : "warn",
    value: a.schemaTypes.length ? a.schemaTypes.join(", ") : "none",
    detail: a.schemaTypes.includes("(unparseable)")
      ? "One of the structured-data blocks is not valid, so search engines will ignore it."
      : a.schemaTypes.length
        ? "Machine-readable facts about the business, so results can show extra detail — address, questions, service areas."
        : "No structured data on this page. It still ranks, it just cannot earn the richer result formats.",
  });

  checks.push({
    id: "canonical",
    label: "Canonical address",
    status: a.canonical ? "pass" : "warn",
    value: a.canonical ?? "missing",
    detail: a.canonical
      ? "Tells search engines the single correct address for this page, so duplicates do not compete with each other."
      : "Without this, the same page reachable at two addresses can split its own ranking.",
  });

  checks.push({
    id: "indexable",
    label: "Visible to Google",
    status: a.noindex ? "fail" : "pass",
    value: a.noindex ? "blocked" : "allowed",
    detail: a.noindex
      ? "This page is explicitly telling search engines not to list it."
      : "Nothing is stopping this page being listed.",
  });

  const targeted = a.targets.length > 0;
  checks.push({
    id: "keyphrase",
    label: "Target phrase",
    // A page that declares no target is not a ranking page and passes as such.
    // A page that declares one and has lost it is a real regression, so this
    // fails rather than warns — the phrase was put there on purpose.
    status: !targeted || keyphraseHit ? "pass" : "fail",
    value: !targeted ? "not a ranking page" : keyphraseHit ? "present" : "missing",
    detail: !targeted
      ? "This page is not built to rank for a search phrase, so nothing is expected here."
      : keyphraseHit
        ? `Found "${a.targets.find((t) => `${a.title} ${a.description}`.toLowerCase().includes(t)) ?? a.targets[0]}" in the title or description.`
        : `This page is meant to be found by ${a.targets.map((t) => `"${t}"`).join(" or ")}, and ${a.targets.length === 1 ? "it is not" : "none of them are"} in its title or description.`,
  });

  checks.push({
    id: "links",
    label: "Links to other pages",
    status: a.internalLinks >= 5 ? "pass" : a.internalLinks >= 2 ? "warn" : "fail",
    value: `${a.internalLinks} internal`,
    detail:
      a.internalLinks >= 5
        ? "Well connected to the rest of the site, which helps every page get found."
        : "Few links out to other pages. Search engines follow links to discover and rank the rest of the site.",
  });

  return checks;
}

/* ------------------------------------------------------------------ */
/* Runner                                                              */
/* ------------------------------------------------------------------ */

export type AuditRoute = {
  path: string;
  name: string;
  /**
   * The phrases this particular page is meant to be found by. Matched against
   * the title and description together; any one of them counts.
   *
   * This replaced a single site-wide pair of head terms checked against every
   * page. That version flagged the gallery and the contact page for not
   * carrying "luxury wedding planner" — and then said in its own explanation
   * that this was fine for pages not meant to rank for them. A check that
   * raises a flag and simultaneously calls it fine teaches the reader to skim
   * past warnings, which is worse than not checking at all.
   *
   * Stating the intent per page makes the check mean something: a contact page
   * is measured on local intent, a venue page on venue intent, and a page that
   * loses the phrase it was built to rank for now fails rather than shrugs.
   */
  targets: string[];
};

/** Every route worth auditing, plus a friendly name for the panel. */
export function auditRoutes(): AuditRoute[] {
  return [
    { path: "/", name: "Home", targets: ["luxury wedding planner", "destination wedding planner"] },
    { path: "/about", name: "About", targets: ["wedding planner"] },
    {
      path: "/destination-weddings",
      name: "Destination weddings",
      targets: ["destination wedding planner"],
    },
    { path: "/wedding-venues", name: "Wedding venues", targets: ["wedding venue"] },
    { path: "/gallery", name: "Gallery", targets: ["destination wedding", "wedding planner"] },
    // A contact page ranks for brand and local intent, never for a head term.
    { path: "/contact", name: "Contact", targets: ["wedding planner"] },
    // One service page stands in for the other ten; they share a template, so
    // auditing all eleven would repeat the same result eleven times.
    {
      path: `/services/${services[0].slug}`,
      name: `Service — ${services[0].title}`,
      targets: ["wedding planner"],
    },
  ];
}

async function auditOne(origin: string, route: AuditRoute): Promise<PageAudit> {
  const empty: PageAudit = {
    ...route,
    ok: false,
    title: "",
    titleLength: 0,
    description: "",
    descriptionLength: 0,
    canonical: null,
    h1: [],
    h2Count: 0,
    words: 0,
    images: 0,
    imagesWithAlt: 0,
    internalLinks: 0,
    externalLinks: 0,
    schemaTypes: [],
    ogTags: 0,
    noindex: false,
    checks: [],
  };

  let html: string;
  try {
    const res = await fetch(`${origin}${route.path}`, {
      headers: { "user-agent": "Riwaaya-SEO-Panel" },
      cache: "no-store",
      signal: AbortSignal.timeout(12_000),
    });
    if (!res.ok) return { ...empty, error: `The page returned ${res.status}.` };
    html = await res.text();
  } catch (error) {
    return {
      ...empty,
      error: error instanceof Error ? error.message : "Could not reach the page.",
    };
  }

  const title = decode(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "").trim();
  const description = meta(html, "description");
  const canonical = html.match(/<link[^>]*rel="canonical"[^>]*href="([^"]*)"/i)?.[1] ?? null;

  const h1 = [...html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi)].map((m) =>
    decode(m[1].replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim(),
  );
  const h2Count = [...html.matchAll(/<h2[^>]*>/gi)].length;

  const imgTags = [...html.matchAll(/<img\b[^>]*>/gi)].map((m) => m[0]);
  // An empty alt="" is correct for decorative images, so it counts as described.
  const imagesWithAlt = imgTags.filter((tag) => /\salt="/i.test(tag)).length;

  const hrefs = [...html.matchAll(/<a\b[^>]*href="([^"]+)"/gi)].map((m) => m[1]);
  const internalLinks = new Set(
    hrefs.filter((h) => h.startsWith("/") && !h.startsWith("//")).map((h) => h.split("#")[0]),
  ).size;
  const externalLinks = new Set(hrefs.filter((h) => /^https?:\/\//i.test(h))).size;

  const robots = meta(html, "robots");
  const words = visibleText(html).split(/\s+/).filter(Boolean).length;

  const haystack = `${title} ${description}`.toLowerCase();
  const keyphraseHit = route.targets.some((phrase) => haystack.includes(phrase));

  const core: Omit<PageAudit, "checks" | "ok"> = {
    ...route,
    title,
    titleLength: title.length,
    description,
    descriptionLength: description.length,
    canonical,
    h1,
    h2Count,
    words,
    images: imgTags.length,
    imagesWithAlt,
    internalLinks,
    externalLinks,
    schemaTypes: schemaTypesIn(html),
    ogTags: [...html.matchAll(/<meta[^>]*property="og:/gi)].length,
    noindex: /noindex/i.test(robots),
  };

  const checks = buildChecks(core, keyphraseHit);
  return { ...core, checks, ok: !checks.some((c) => c.status === "fail") };
}

export async function runAudit(origin: string): Promise<PageAudit[]> {
  return Promise.all(auditRoutes().map((route) => auditOne(origin, route)));
}

/* ------------------------------------------------------------------ */
/* Coverage — what exists to be found at all                           */
/* ------------------------------------------------------------------ */

export type CoverageRow = { label: string; count: number; note: string };

export function siteCoverage(): CoverageRow[] {
  return [
    {
      label: "Pages in the sitemap",
      count: auditRoutes().length + services.length - 1,
      note: "Every page submitted to search engines.",
    },
    {
      label: "Service pages",
      count: services.length,
      note: "One per line of work. Each is its own page and can rank on its own.",
    },
    {
      label: "Destinations described",
      count: destinations.length,
      note: "Written out in full on the destination weddings page.",
    },
    {
      label: "Cities named",
      count: site.cities.length,
      note: "Listed as places the studio works, and used in the business listing data.",
    },
  ];
}
