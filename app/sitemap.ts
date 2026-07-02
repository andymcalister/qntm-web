import type { MetadataRoute } from "next";

// Lists the publicly crawlable routes. If you already maintain a sitemap with
// more entries, merge /how-it-works into it rather than replacing.
const SITE = "https://qntm.live";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: `${SITE}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE}/how-it-works`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
  ];
}
