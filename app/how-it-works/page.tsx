import type { Metadata } from "next";
import HowItWorksBody from "./HowItWorksContent";

// Public, crawlable — deliberately NOT behind middleware auth and rendered as a
// server component so the full methodology is in the initial HTML for search
// engines. The copy itself lives in HowItWorksContent (shared with the in-app
// /methodology page so the two never drift).

const FONT_DISPLAY = "var(--font-syne, 'Syne'), sans-serif";
const FONT_MONO = "var(--font-dm-mono, 'DM Mono'), monospace";
const APP_URL = process.env.NEXT_PUBLIC_LOGIN_URL || "/login";
const SITE = "https://qntm.live";

export const metadata: Metadata = {
  title: "How QNTM Works — Methodology & Factor Model",
  description:
    "How QNTM scores stocks: a five-pillar factor model (momentum, quality, volume, value, sentiment) with a live macro overlay, conviction tiers, and hidden-gem detection across 1,400+ US stocks. Transparent methodology — and what the model does not do.",
  alternates: { canonical: `${SITE}/how-it-works` },
  openGraph: {
    title: "How QNTM Works — Methodology & Factor Model",
    description:
      "A transparent look at QNTM's five-pillar conviction model, macro overlay, and hidden-gem screen.",
    url: `${SITE}/how-it-works`,
    siteName: "QNTM",
    type: "article",
  },
  robots: { index: true, follow: true },
};

export default function HowItWorks() {
  return (
    <div style={{ minHeight: "100vh", background: "#060709", color: "#cbd5e1" }}>
      {/* public marketing header */}
      <header style={{ borderBottom: "1px solid rgba(255,255,255,.07)", background: "rgba(8,9,12,.9)" }}>
        <div style={{ maxWidth: 860, margin: "0 auto", padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <a href="/" style={{ textDecoration: "none" }}>
            <img src="/qntm-wordmark.png" alt="QNTM" style={{ height: 24, display: "block", width: "auto" }} />
          </a>
          <nav style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <a href={APP_URL} style={{ fontFamily: FONT_MONO, fontSize: 12.5, color: "#9fabc0", textDecoration: "none", padding: "8px 12px" }}>Sign in</a>
            <a href={APP_URL} style={{ fontFamily: FONT_MONO, fontSize: 12.5, fontWeight: 700, color: "#0b0c10", background: "#d4a843", borderRadius: 8, padding: "8px 14px", textDecoration: "none" }}>Get started</a>
          </nav>
        </div>
      </header>

      <main style={{ maxWidth: 860, margin: "0 auto", padding: "40px 24px 72px" }}>
        <HowItWorksBody />

        <div style={{ marginTop: 28, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <a href={APP_URL} style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 14, color: "#0b0c10", background: "#d4a843", borderRadius: 10, padding: "12px 24px", textDecoration: "none" }}>Open the screener →</a>
          <a href="/" style={{ fontFamily: FONT_MONO, fontSize: 13, color: "#9fabc0", border: "1px solid rgba(255,255,255,.14)", borderRadius: 10, padding: "12px 20px", textDecoration: "none" }}>Back to home</a>
        </div>

        <p style={{ fontFamily: FONT_MONO, fontSize: 11, color: "#4b5568", marginTop: 32, lineHeight: 1.7 }}>
          QNTM provides quantitative model outputs for informational and educational purposes only. It is not investment advice and QNTM is not a registered investment adviser. Consult a qualified financial adviser before investing.
        </p>
      </main>
    </div>
  );
}
