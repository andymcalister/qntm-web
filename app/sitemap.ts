import type { MetadataRoute } from "next";

const SITE = "https://qntm.live";
const LEGAL = "https://legal.qntm.live";
const API = process.env.API_BASE || process.env.NEXT_PUBLIC_API_BASE || "https://qntm-api.onrender.com";

export const revalidate = 3600;

async function datedEntries(now: Date): Promise<MetadataRoute.Sitemap> {
  try {
    const r = await fetch(`${API}/api/outlook?limit=90`, { next: { revalidate: 3600 } });
    if (!r.ok) return [];
    const d = await r.json();
    const items: any[] = d.items || [];
    return items
      .filter((it) => it && it.outlook_date && it.kind)
      .map((it) => {
        const seg = it.kind === "outlook" ? "outlook" : "wrap";
        return {
          url: `${SITE}/${seg}/${it.outlook_date}`,
          lastModified: it.created_at ? new Date(it.created_at) : now,
          changeFrequency: "monthly" as const,
          priority: 0.7,
        };
      });
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const dated = await datedEntries(now);
  const staticEntries: MetadataRoute.Sitemap = [
    // ── Public marketing / content (indexable) ──────────────────────────────
    { url: `${SITE}/`, lastModified: now, changeFrequency: "weekly", priority: 1.0 },
    { url: `${SITE}/market-outlook`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE}/how-it-works`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE}/register`, lastModified: now, changeFrequency: "yearly", priority: 0.6 },
    { url: `${SITE}/login`, lastModified: now, changeFrequency: "yearly", priority: 0.5 },

    // ── Legal (static, crawlable) ───────────────────────────────────────────
    { url: `${LEGAL}/privacy.html`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${LEGAL}/terms.html`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${LEGAL}/billing.html`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
    { url: `${LEGAL}/disclaimer.html`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
    { url: `${LEGAL}/cookies.html`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
  ];
  return [...staticEntries, ...dated];
}
