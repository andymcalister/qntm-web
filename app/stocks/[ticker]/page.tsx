// app/stocks/[ticker]/page.tsx
// PUBLIC, server-rendered per-stock page. Deliberately OUTSIDE the middleware
// matcher so Google and logged-out searchers can reach it. Renders QNTM's live
// factor scores as crawlable HTML targeting "<TICKER> stock analysis / quant
// score" search intent. Full interactive tools stay gated behind signup.

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

const API =
  process.env.API_BASE ||
  process.env.NEXT_PUBLIC_API_BASE ||
  "https://qntm-api.onrender.com";
const SITE = "https://qntm.live";

export const revalidate = 3600; // refresh scores hourly

type Stock = {
  ticker: string;
  sector: string;
  conviction: string;
  action: string;
  score: number;
  composite: number;
  momentum: number;
  quality: number;
  volume: number;
  value: number;
  sentiment: number;
  macro_overlay: number;
  price: number;
  value_position: number;
  is_hidden_gem: boolean;
  mktcap: string;
  val_low: number | null;
  val_high: number | null;
  val_basis: string | null;
  signal_date: string;
  pct_rank: number;
};

async function getStock(ticker: string): Promise<Stock | null> {
  try {
    const r = await fetch(`${API}/api/stock/${encodeURIComponent(ticker)}`, {
      next: { revalidate: 3600 },
    });
    if (!r.ok) return null;
    return (await r.json()) as Stock;
  } catch {
    return null;
  }
}

// ── SEO metadata, unique per stock ──────────────────────────────────────────
export async function generateMetadata({
  params,
}: {
  params: Promise<{ ticker: string }>;
}): Promise<Metadata> {
  const { ticker: raw } = await params;
  const ticker = raw.toUpperCase();
  const s = await getStock(ticker);
  if (!s) {
    return { title: `${ticker} — Stock Analysis | QNTM`, robots: { index: false } };
  }
  const title = `${ticker} Quant Score, Factor Analysis & Conviction | QNTM`;
  const desc =
    `${ticker} scores ${s.score.toFixed(0)}/100 on QNTM's five-factor quant model ` +
    `(${s.conviction} conviction). Momentum ${s.momentum.toFixed(0)}, quality ` +
    `${s.quality.toFixed(0)}, value ${s.value.toFixed(0)}, sentiment ` +
    `${s.sentiment.toFixed(0)}. Updated ${s.signal_date}. Research, not advice.`;
  const url = `${SITE}/stocks/${ticker}`;
  return {
    title,
    description: desc,
    alternates: { canonical: url },
    openGraph: { title, description: desc, url, type: "website" },
    twitter: { card: "summary_large_image", title, description: desc },
  };
}

// ── small presentational helpers (server-safe, no client hooks) ─────────────
const FONT_MONO = "var(--font-dm-mono, 'DM Mono'), monospace";
const FONT_DISPLAY = "var(--font-syne, 'Syne'), sans-serif";

const CONV_COLOR: Record<string, string> = {
  HIGH: "#34d399",
  MODERATE: "#d4a843",
  LOW: "#f87171",
};

function Pillar({ label, value }: { label: string; value: number }) {
  const pct = Math.max(0, Math.min(100, value));
  const color = value >= 65 ? "#34d399" : value >= 45 ? "#d4a843" : "#f87171";
  return (
    <div style={{ marginBottom: 12 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontFamily: FONT_MONO,
          fontSize: 12,
          color: "#8896ac",
          marginBottom: 4,
        }}
      >
        <span>{label}</span>
        <span style={{ color }}>{value.toFixed(0)}</span>
      </div>
      <div style={{ height: 6, background: "rgba(255,255,255,.06)", borderRadius: 3 }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 3 }} />
      </div>
    </div>
  );
}

export default async function StockPage({
  params,
}: {
  params: Promise<{ ticker: string }>;
}) {
  const { ticker: raw } = await params;
  const ticker = raw.toUpperCase();
  const s = await getStock(ticker);
  if (!s) notFound();

  const convColor = CONV_COLOR[s.conviction] || "#8896ac";
  const belowBand =
    s.val_low != null && s.price < s.val_low
      ? `${(((s.val_low - s.price) / s.val_low) * 100).toFixed(0)}% below the band floor`
      : s.val_high != null && s.price > s.val_high
      ? `${(((s.price - s.val_high) / s.val_high) * 100).toFixed(0)}% above the band ceiling`
      : "within its fair-value band";

  // JSON-LD structured data — helps search engines understand the page.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FinancialProduct",
    name: `${ticker} — QNTM Quant Analysis`,
    category: "Equity research",
    url: `${SITE}/stocks/${ticker}`,
    provider: { "@type": "Organization", name: "QNTM", url: SITE },
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-bg,#060709)", color: "#cbd5e1" }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div style={{ maxWidth: 780, margin: "0 auto", padding: "40px 24px 72px" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
          <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: 34, fontWeight: 800, margin: 0, color: "#f1f5f9" }}>
            {ticker}
          </h1>
          <span style={{ fontFamily: FONT_MONO, fontSize: 13, color: "#8896ac" }}>{s.sector}</span>
          <span style={{ fontFamily: FONT_MONO, fontSize: 13, color: "#8896ac" }}>
            {s.mktcap} cap
          </span>
        </div>

        {/* Score + conviction */}
        <div style={{ display: "flex", alignItems: "center", gap: 20, margin: "24px 0" }}>
          <div>
            <div style={{ fontFamily: FONT_MONO, fontSize: 12, color: "#8896ac", letterSpacing: ".1em" }}>
              QNTM SCORE
            </div>
            <div style={{ fontFamily: FONT_DISPLAY, fontSize: 48, fontWeight: 800, color: "#f1f5f9", lineHeight: 1 }}>
              {s.score.toFixed(0)}
              <span style={{ fontSize: 20, color: "#4b5568" }}>/100</span>
            </div>
          </div>
          <div
            style={{
              fontFamily: FONT_MONO,
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: ".08em",
              color: convColor,
              border: `1px solid ${convColor}`,
              borderRadius: 6,
              padding: "6px 12px",
            }}
          >
            {s.conviction} CONVICTION
          </div>
          <div style={{ fontFamily: FONT_MONO, fontSize: 12, color: "#8896ac" }}>
            top {100 - s.pct_rank}% of the universe
          </div>
        </div>

        {/* Prose intro — real, indexable content targeting the search intent */}
        <p style={{ fontFamily: FONT_MONO, fontSize: 14, lineHeight: 1.7, color: "#a9b4c6" }}>
          As of {s.signal_date}, {ticker} scores {s.score.toFixed(0)} out of 100 on
          QNTM&rsquo;s five-factor quantitative model, a {s.conviction.toLowerCase()}{" "}
          conviction reading. The score blends momentum, quality, volume, value and
          sentiment, then adjusts for the current macro regime. {ticker} trades at{" "}
          ${s.price.toFixed(2)}, {belowBand}.
        </p>

        {/* Factor breakdown */}
        <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 16, fontWeight: 700, color: "#93b4ff", margin: "32px 0 16px", letterSpacing: ".04em" }}>
          FACTOR BREAKDOWN
        </h2>
        <Pillar label="Momentum" value={s.momentum} />
        <Pillar label="Quality" value={s.quality} />
        <Pillar label="Value" value={s.value} />
        <Pillar label="Volume" value={s.volume} />
        <Pillar label="Sentiment" value={s.sentiment} />

        {/* Valuation band */}
        {s.val_low != null && s.val_high != null && (
          <>
            <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 16, fontWeight: 700, color: "#93b4ff", margin: "32px 0 12px", letterSpacing: ".04em" }}>
              VALUATION RANGE
            </h2>
            <p style={{ fontFamily: FONT_MONO, fontSize: 14, lineHeight: 1.7, color: "#a9b4c6" }}>
              QNTM&rsquo;s descriptive fair-value band for {ticker} runs $
              {s.val_low.toFixed(2)}&ndash;${s.val_high.toFixed(2)}. Current price $
              {s.price.toFixed(2)} sits {belowBand}. This is valuation context, not a
              price target.
            </p>
          </>
        )}

        {/* Conversion CTA — the searcher -> signup path */}
        <div
          style={{
            marginTop: 40,
            padding: "24px",
            border: "1px solid rgba(52,211,153,.3)",
            borderRadius: 12,
            background: "rgba(52,211,153,.04)",
          }}
        >
          <div style={{ fontFamily: FONT_DISPLAY, fontSize: 17, fontWeight: 800, color: "#f1f5f9", marginBottom: 8 }}>
            See {ticker} update live, and set an alert when its conviction changes
          </div>
          <p style={{ fontFamily: FONT_MONO, fontSize: 13, lineHeight: 1.6, color: "#8896ac", margin: "0 0 16px" }}>
            QNTM rescores {ticker} and ~1,400 other names every session. Track it,
            get notified the moment it crosses a conviction tier, and see the full
            signal history.
          </p>
          <Link
            href="/register"
            style={{
              fontFamily: FONT_DISPLAY,
              fontWeight: 800,
              fontSize: 14,
              color: "#04120c",
              background: "#34d399",
              borderRadius: 10,
              padding: "12px 24px",
              textDecoration: "none",
            }}
          >
            Start free →
          </Link>
        </div>

        {/* Disclaimer */}
        <p style={{ fontFamily: FONT_MONO, fontSize: 11, color: "#4b5568", marginTop: 32, lineHeight: 1.7 }}>
          QNTM provides quantitative model outputs for informational and educational
          purposes only. It is not investment advice and QNTM is not a registered
          investment adviser. Scores are rankings, not buy/sell recommendations. Data
          as of {s.signal_date}.
        </p>
      </div>
    </div>
  );
}
