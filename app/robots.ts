import type { MetadataRoute } from "next";

import { site } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    // /admin is behind a password already; the Disallow keeps it out of
    // crawl logs and out of any "pages we found" report, which is tidier.
    rules: [{ userAgent: "*", allow: "/", disallow: "/admin" }],
    sitemap: `${site.url}/sitemap.xml`,
    host: site.url,
  };
}
