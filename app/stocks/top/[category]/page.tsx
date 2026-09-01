// app/stocks/top/[category]/page.tsx
// Category / ranking pages — "Top Momentum Stocks", "Highest Conviction", etc.
// Each ranks a subset of the live universe by one dimension and links to every
// individual stock page (building internal-link topical authority). SSR + ISR so
// crawlers get real, daily-fresh HTML. All rankings are the model's real output —
// no fabricated prose.

import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Row, companyName, FONT_DISPLAY, FONT_MONO } from "../../../screener/lib";
import { convictionLabelTitle, convictionColor } from "../../../lib/conviction";
import StocksHeader from "../../StocksHeader";

const API =
  process.env.API_BASE ||
  process.env.NEXT_PUBLIC_API_BASE ||
  "https://qntm-api.onrender.com";

export const revalidate = 3600;

// ── Category definitions ─────────────────────────────────────────────────────
type Cat = {
  slug: string;
  h1: string;
  title: string;        // <title>
  description: string;  // meta description
  intro: string;        // on-page intro paragraph (targets the query)
  method: string;       // one-line "what this measures"
  rank: (rows: Row[]) => Row[];  // filter + sort
  col: { label: string; get: (r: Row) => number | string };  // the ranked column
};

const num = (v: any) => (typeof v === "number" && isFinite(v) ? v : 0);

const CATS: Record<string, Cat> = {
  momentum: {
    slug: "momentum",
    h1: "Top Momentum Stocks Today",
    title: "Top Momentum Stocks Today — Ranked by QNTM (updated daily)",
    description:
      "The US stocks scoring highest on price momentum in QNTM's quantitative model today — ranked and refreshed every trading day, each with a plain-English breakdown.",
    intro:
      "These are the stocks with the strongest price-momentum profile in QNTM's model right now — trend, relative strength, and multi-month return, blended into the momentum pillar. Rankings update every trading day. Each name links to its full factor breakdown.",
    method:
      "Momentum reflects 1-, 3- and 6-month return, trend consistency, and proximity to recent highs.",
    rank: (rows) => [...rows].sort((a, b) => num(b.momentum) - num(a.momentum)).slice(0, 50),
    col: { label: "Momentum", get: (r) => Math.round(num(r.momentum)) },
  },
  conviction: {
    slug: "conviction",
    h1: "Highest Conviction Stocks Today",
    title: "Highest Conviction Stocks Today — QNTM Model (updated daily)",
    description:
      "The highest-conviction US stocks in QNTM's five-factor model today — the strongest overall factor profiles, ranked and updated every trading day.",
    intro:
      "These stocks carry the highest overall conviction in QNTM's model today — the strongest blended profile across momentum, quality, volume, value and sentiment, adjusted for the macro regime. Updated every trading day.",
    method:
      "Conviction is the macro-adjusted composite of all five factor pillars. HIGH ≥ 65.",
    rank: (rows) => [...rows].sort((a, b) => num(b.score) - num(a.score)).slice(0, 50),
    col: { label: "Conviction", get: (r) => Math.round(num(r.score)) },
  },
  value: {
    slug: "value",
    h1: "Top Value Stocks Today",
    title: "Top Value Stocks Today — Cheapest by QNTM Model (updated daily)",
    description:
      "US stocks screening cheapest on QNTM's value pillar today — forward earnings, cash-flow yield and valuation multiples — ranked and refreshed daily.",
    intro:
      "These stocks screen cheapest on QNTM's value pillar today, based on forward earnings multiples and free-cash-flow yield. Cheap alone isn't a buy signal — each page shows the full picture, including whether sentiment confirms or contradicts the valuation.",
    method:
      "Value reflects forward P/E, PEG, EV/EBITDA, price-to-sales and free-cash-flow yield.",
    rank: (rows) => [...rows].sort((a, b) => num(b.value) - num(a.value)).slice(0, 50),
    col: { label: "Value", get: (r) => Math.round(num(r.value)) },
  },
  quality: {
    slug: "quality",
    h1: "Highest Quality Stocks Today",
    title: "Highest Quality Stocks — QNTM Model (updated daily)",
    description:
      "US stocks scoring highest on QNTM's quality pillar today — profitability, margins, earnings consistency and cash generation — ranked and updated daily.",
    intro:
      "These stocks score highest on QNTM's quality pillar today — strong profitability, healthy margins, consistent earnings and solid cash generation. Quality names tend to be the model's more durable holdings. Updated every trading day.",
    method:
      "Quality reflects ROE, profit margin, revenue growth, earnings-beat rate and free-cash-flow yield.",
    rank: (rows) => [...rows].sort((a, b) => num(b.quality) - num(a.quality)).slice(0, 50),
    col: { label: "Quality", get: (r) => Math.round(num(r.quality)) },
  },
};

async function getUniverse(): Promise<Row[]> {
  try {
    const r = await fetch(`${API}/api/screener?limit=2000`, { next: { revalidate } });
    if (!r.ok) return [];
    const d = await r.json();
    const items: any[] = Array.isArray(d) ? d : d.rows || d.items || d.data || [];
    const seen = new Set<string>();
    const out: Row[] = [];
    for (const it of items) {
      const tk = (it && it.ticker ? String(it.ticker) : "").toUpperCase();
      if (!tk || seen.has(tk)) continue;
      seen.add(tk);
      out.push({
        ticker: tk,
        sector: it.sector || "Other",
        conviction: it.conviction || "",
        score: num(it.score),
        momentum: num(it.momentum),
        quality: num(it.quality),
        volume: num(it.volume),
        value: num(it.value),
        sentiment: num(it.sentiment),
        value_position: it.value_position ?? null,
      } as Row);
    }
    return out;
  } catch {
    return [];
  }
}

export function generateMetadata({ params }: { params: { category: string } }): Metadata {
  const c = CATS[params.category];
  if (!c) return { title: "Stock Rankings — QNTM" };
  return {
    title: c.title,
    description: c.description,
    alternates: { canonical: `https://qntm.live/stocks/top/${c.slug}` },
  };
}

export function generateStaticParams() {
  return Object.keys(CATS).map((category) => ({ category }));
}

export default async function CategoryPage({ params }: { params: { category: string } }) {
  const cat = CATS[params.category];
  if (!cat) notFound();

  const universe = await getUniverse();
  const ranked = cat.rank(universe);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div style={{ minHeight: "100vh", background: "#0a0e14", color: "#e6edf3" }}>
      <StocksHeader />
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 20px 64px" }}>
        <p style={{ fontFamily: FONT_MONO, fontSize: 12, color: "#8896ac", letterSpacing: ".08em" }}>
          QNTM RANKINGS · UPDATED {today}
        </p>
        <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: 34, fontWeight: 800, margin: "10px 0 16px", lineHeight: 1.15 }}>
          {cat.h1}
        </h1>
        <p style={{ fontFamily: FONT_MONO, fontSize: 14, lineHeight: 1.7, color: "#a9b4c6", maxWidth: 720 }}>
          {cat.intro}
        </p>
        <p style={{ fontFamily: FONT_MONO, fontSize: 12.5, lineHeight: 1.6, color: "#6b7688", marginTop: 12 }}>
          {cat.method} Research and factor output, not investment advice.
        </p>

        {/* Cross-links to sibling categories — internal-link web */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, margin: "20px 0 8px" }}>
          {Object.values(CATS).filter((o) => o.slug !== cat.slug).map((o) => (
            <a key={o.slug} href={`/stocks/top/${o.slug}`}
               style={{ fontFamily: FONT_MONO, fontSize: 12, color: "#93b4ff", textDecoration: "none",
                        border: "1px solid rgba(147,180,255,.25)", borderRadius: 6, padding: "5px 10px" }}>
              {o.h1.replace(" Today", "")}
            </a>
          ))}
        </div>

        {ranked.length === 0 ? (
          <p style={{ fontFamily: FONT_MONO, color: "#8896ac", marginTop: 24 }}>Rankings are updating — check back shortly.</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 20, fontFamily: FONT_MONO, fontSize: 14 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,.1)", textAlign: "left" }}>
                <th style={{ padding: "10px 8px", color: "#8896ac", fontWeight: 400, width: 44 }}>#</th>
                <th style={{ padding: "10px 8px", color: "#8896ac", fontWeight: 400 }}>Stock</th>
                <th style={{ padding: "10px 8px", color: "#8896ac", fontWeight: 400, textAlign: "right" }}>{cat.col.label}</th>
                <th style={{ padding: "10px 8px", color: "#8896ac", fontWeight: 400, textAlign: "right" }}>Conviction</th>
              </tr>
            </thead>
            <tbody>
              {ranked.map((r, i) => {
                const nm = companyName(r.ticker) || r.ticker;
                return (
                  <tr key={r.ticker} style={{ borderBottom: "1px solid rgba(255,255,255,.05)" }}>
                    <td style={{ padding: "10px 8px", color: "#6b7688" }}>{i + 1}</td>
                    <td style={{ padding: "10px 8px" }}>
                      <a href={`/stocks/${r.ticker}`} style={{ color: "#e6edf3", textDecoration: "none", fontWeight: 600 }}>
                        {r.ticker}
                      </a>
                      <span style={{ color: "#6b7688", marginLeft: 8, fontSize: 12 }}>{nm}</span>
                    </td>
                    <td style={{ padding: "10px 8px", textAlign: "right", color: "#93b4ff" }}>{cat.col.get(r)}</td>
                    <td style={{ padding: "10px 8px", textAlign: "right", color: convictionColor(num(r.score)) }}>
                      {convictionLabelTitle(num(r.score))}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        <p style={{ fontFamily: FONT_MONO, fontSize: 12, color: "#6b7688", marginTop: 24 }}>
          <a href="/stocks" style={{ color: "#93b4ff", textDecoration: "none" }}>← Browse all stocks</a>
        </p>
      </div>
    </div>
  );
}
