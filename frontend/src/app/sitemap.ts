import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://vocabric.com",
      changeFrequency: "monthly",
      priority: 1,
    },
  ];
}
