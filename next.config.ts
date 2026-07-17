import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      { source: "/ingest/static/:path*", destination: "https://us-assets.i.posthog.com/static/:path*" },
      { source: "/ingest/:path*", destination: "https://us.i.posthog.com/:path*" },
      { source: "/api/admin/:path*", destination: "https://qntm-api.onrender.com/api/admin/:path*" },
    ];
  },
  skipTrailingSlashRedirect: true,
};

export default nextConfig;
