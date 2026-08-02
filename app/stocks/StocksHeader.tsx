// app/stocks/StocksHeader.tsx
// Public header for the /stocks pages. Gives cold SEO/landing traffic a way
// back to browse, home, and to sign up — so stock pages aren't dead-ends.
// Server component (no client hooks); matches the home-page nav styling.

import Link from "next/link";

export default function StocksHeader({ back = false }: { back?: boolean }) {
  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 20,
        backdropFilter: "blur(8px)",
        background: "rgba(6,7,9,.72)",
        borderBottom: "1px solid rgba(255,255,255,.06)",
      }}
    >
      <div
        style={{
          maxWidth: 960,
          margin: "0 auto",
          padding: "12px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <a href="/" style={{ flexShrink: 0, display: "inline-flex" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/qntm-wordmark.png" alt="QNTM" style={{ height: 26, width: "auto" }} />
        </a>

        <nav style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {back && (
            <Link
              href="/stocks"
              style={{
                fontFamily: "var(--font-dm-mono, 'DM Mono'), monospace",
                fontSize: 12,
                letterSpacing: ".08em",
                color: "#cbd5e1",
                textDecoration: "none",
                padding: "8px 14px",
                borderRadius: 8,
                border: "1px solid rgba(255,255,255,.10)",
              }}
            >
              ← All stocks
            </Link>
          )}
          <a
            href="/login"
            style={{
              fontFamily: "var(--font-dm-mono, 'DM Mono'), monospace",
              fontSize: 12,
              letterSpacing: ".08em",
              color: "#cbd5e1",
              textDecoration: "none",
              padding: "8px 14px",
              borderRadius: 8,
              border: "1px solid rgba(255,255,255,.10)",
            }}
          >
            Sign in
          </a>
          <a
            href="/register"
            style={{
              fontFamily: "var(--font-dm-mono, 'DM Mono'), monospace",
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: ".08em",
              color: "#04120c",
              textDecoration: "none",
              padding: "8px 16px",
              borderRadius: 8,
              background: "#34d399",
            }}
          >
            Join free
          </a>
        </nav>
      </div>
    </header>
  );
}
