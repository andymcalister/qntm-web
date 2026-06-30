import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://qntm.live",
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
  ];
}
