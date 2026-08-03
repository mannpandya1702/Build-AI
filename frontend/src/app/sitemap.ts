import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://maana.agency",
      changeFrequency: "monthly",
      priority: 1,
    },
  ];
}
