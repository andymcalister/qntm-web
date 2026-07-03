import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "QNTM — Quantitative Stock Conviction",
    short_name: "QNTM",
    description: "Daily quantitative conviction scores for 1,400+ US stocks, with a live macro overlay and rules-based model portfolio.",
    start_url: "/screener",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#08090c",
    theme_color: "#08090c",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
