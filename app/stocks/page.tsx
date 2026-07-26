// app/stocks/page.tsx
// PUBLIC index of every stock page. Its job is DISCOVERY: one crawlable page
// that links to all ~1,400 per-ticker pages, so Googlebot can reach the whole
// universe by following links (faster + deeper than sitemap-only). Also a real
// browsable directory for humans. Server-rendered, outside the middleware matcher.

import type { Metadata } from "next";
import Link from "next/link";

const API =
  process.env.API_BASE ||
  process.env.NEXT_PUBLIC_API_BASE ||
  "https://qntm-api.onrender.com";
const SITE = "https://qntm.live";

export const revalidate = 3600;

type Row = {
  ticker: string;
  sector?: string;
  conviction?: string;
  score?: number;
};

async function getUniverse(): Promise<Row[]> {
  try {
    const r = await fetch(`${API}/api/screener?limit=2000`, {
      next: { revalidate: 3600 },
    });
    if (!r.ok) return [];
    const d = await r.json();
    const items: any[] = Array.isArray(d) ? d : d.items || d.rows || d.data || [];
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
        score: typeof it.score === "number" ? it.score : undefined,
      });
    }
    out.sort((a, b) => a.ticker.localeCompare(b.ticker));
    return out;
  } catch {
    return [];
  }
}

export const metadata: Metadata = {
  title: "All Stocks — Quant Scores & Factor Analysis | QNTM",
  description:
    "Browse QNTM's quantitative analysis across the full stock universe. " +
    "Five-factor scores, conviction ratings, and valuation context for every " +
    "name the model tracks, updated each session. Research, not advice.",
  alternates: { canonical: `${SITE}/stocks` },
};

const FONT_MONO = "var(--font-dm-mono, 'DM Mono'), monospace";
const FONT_DISPLAY = "var(--font-syne, 'Syne'), sans-serif";

const CONV_COLOR: Record<string, string> = {
  HIGH: "#34d399",
  MODERATE: "#d4a843",
  LOW: "#f87171",
};

export default async function StocksIndex() {
  const rows = await getUniverse();

  // group by sector for a browsable, well-structured directory (also gives Google
  // sector-clustered internal linking).
  const bySector = new Map<string, Row[]>();
  for (const r of rows) {
    const sec = r.sector || "Other";
    if (!bySector.has(sec)) bySector.set(sec, []);
    bySector.get(sec)!.push(r);
  }
  const sectors = [...bySector.keys()].sort();

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-bg,#060709)", color: "#cbd5e1" }}>
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "40px 24px 72px" }}>
        <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: 32, fontWeight: 800, margin: 0, color: "#f1f5f9" }}>
          All Stocks
        </h1>
        <p style={{ fontFamily: FONT_MONO, fontSize: 14, lineHeight: 1.7, color: "#a9b4c6", marginTop: 12 }}>
          QNTM scores {rows.length.toLocaleString()} stocks on a five-factor
          quantitative model every session &mdash; momentum, quality, value,
          volume and sentiment, adjusted for the macro regime. Pick a name to see
          its full factor breakdown, conviction reading and valuation context.
        </p>

        {rows.length === 0 && (
          <p style={{ fontFamily: FONT_MONO, fontSize: 13, color: "#8896ac", marginTop: 24 }}>
            The universe is loading. Please check back shortly.
          </p>
        )}

        {sectors.map((sec) => {
          const names = bySector.get(sec)!;
          return (
            <section key={sec} style={{ marginTop: 36 }}>
              <h2
                style={{
                  fontFamily: FONT_DISPLAY,
                  fontSize: 15,
                  fontWeight: 700,
                  color: "#93b4ff",
                  letterSpacing: ".04em",
                  margin: "0 0 12px",
                  borderBottom: "1px solid rgba(255,255,255,.08)",
                  paddingBottom: 8,
                }}
              >
                {sec} <span style={{ color: "#4b5568", fontWeight: 400 }}>({names.length})</span>
              </h2>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
                  gap: 8,
                }}
              >
                {names.map((r) => {
                  const c = CONV_COLOR[r.conviction || ""] || "#8896ac";
                  return (
                    <Link
                      key={r.ticker}
                      href={`/stocks/${r.ticker}`}
                      style={{
                        fontFamily: FONT_MONO,
                        fontSize: 13,
                        color: "#cbd5e1",
                        textDecoration: "none",
                        padding: "8px 10px",
                        border: "1px solid rgba(255,255,255,.06)",
                        borderRadius: 8,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 6,
                      }}
                    >
                      <span style={{ fontWeight: 700 }}>{r.ticker}</span>
                      {typeof r.score === "number" && (
                        <span style={{ color: c, fontSize: 12 }}>{r.score.toFixed(0)}</span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </section>
          );
        })}

        <p style={{ fontFamily: FONT_MONO, fontSize: 11, color: "#4b5568", marginTop: 44, lineHeight: 1.7 }}>
          QNTM provides quantitative model outputs for informational and educational
          purposes only. It is not investment advice and QNTM is not a registered
          investment adviser. Scores are rankings, not buy/sell recommendations.
        </p>
      </div>
    </div>
  );
}
