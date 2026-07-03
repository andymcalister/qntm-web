import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/how-it-works", "/login", "/register"],
      // Auth-gated app routes have no SEO value and shouldn't be indexed.
      disallow: ["/screener", "/watchlist", "/hidden-gems", "/portfolio", "/simulator", "/model-portfolio", "/alerts", "/account", "/methodology", "/api/"],
    },
    sitemap: "https://qntm.live/sitemap.xml",
  };
}
