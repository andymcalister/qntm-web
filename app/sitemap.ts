import type { MetadataRoute } from "next";

const SITE = "https://qntm.live";
const LEGAL = "https://legal.qntm.live";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: `${SITE}/`, lastModified: now, changeFrequency: "weekly", priority: 1.0 },
    { url: `${SITE}/how-it-works`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE}/register`, lastModified: now, changeFrequency: "yearly", priority: 0.6 },
    { url: `${SITE}/login`, lastModified: now, changeFrequency: "yearly", priority: 0.5 },
    { url: `${LEGAL}/privacy.html`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${LEGAL}/terms.html`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${LEGAL}/billing.html`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
    { url: `${LEGAL}/disclaimer.html`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
    { url: `${LEGAL}/cookies.html`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
  ];
}
