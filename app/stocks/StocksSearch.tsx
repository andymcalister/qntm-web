"use client";
// Client-side search for the /stocks index. Receives the full universe (already
// server-rendered below for SEO) and filters by ticker or sector as the user
// types. Purely additive: the SSR sector list stays in the HTML for crawling.

import { useState, useMemo } from "react";
import Link from "next/link";
import { companyName } from "../screener/lib";

type Row = { ticker: string; sector?: string; conviction?: string; score?: number };

const FONT_MONO = "var(--font-dm-mono, 'DM Mono'), monospace";
const CONV_COLOR: Record<string, string> = {
  HIGH: "#34d399",
  MODERATE: "#d4a843",
  LOW: "#f87171",
};

export default function StocksSearch({ rows }: { rows: Row[] }) {
  const [q, setQ] = useState("");

  const results = useMemo(() => {
    const query = q.trim().toUpperCase();
    if (!query) return [];
    const starts: Row[] = [];
    const contains: Row[] = [];
    for (const r of rows) {
      const tk = r.ticker.toUpperCase();
      const sec = (r.sector || "").toUpperCase();
      const nm = (companyName(r.ticker) || "").toUpperCase();
      if (tk === query || tk.startsWith(query) || nm.startsWith(query)) starts.push(r);
      else if (tk.includes(query) || nm.includes(query) || sec.includes(query)) contains.push(r);
    }
    // exact/prefix ticker matches first, then substring/sector matches
    return [...starts, ...contains].slice(0, 40);
  }, [q, rows]);

  return (
    <div style={{ marginTop: 20, marginBottom: 8 }}>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search a ticker or sector — e.g. NVDA, energy…"
        aria-label="Search stocks"
        style={{
          width: "100%",
          boxSizing: "border-box",
          fontFamily: FONT_MONO,
          fontSize: 15,
          color: "#f1f5f9",
          background: "rgba(255,255,255,.04)",
          border: "1px solid rgba(255,255,255,.12)",
          borderRadius: 10,
          padding: "12px 16px",
          outline: "none",
        }}
      />

      {q.trim() && (
        <div
          style={{
            marginTop: 10,
            border: "1px solid rgba(255,255,255,.08)",
            borderRadius: 10,
            overflow: "hidden",
          }}
        >
          {results.length === 0 ? (
            <div style={{ fontFamily: FONT_MONO, fontSize: 13, color: "#8896ac", padding: "14px 16px" }}>
              No matches for “{q.trim()}”.
            </div>
          ) : (
            results.map((r) => {
              const c = CONV_COLOR[r.conviction || ""] || "#8896ac";
              return (
                <Link
                  key={r.ticker}
                  href={`/stocks/${r.ticker}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                    padding: "11px 16px",
                    textDecoration: "none",
                    borderTop: "1px solid rgba(255,255,255,.05)",
                  }}
                >
                  <span style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
                    <span style={{ fontFamily: FONT_MONO, fontSize: 14, fontWeight: 700, color: "#f1f5f9" }}>
                      {r.ticker}
                    </span>
                    <span style={{ fontFamily: FONT_MONO, fontSize: 12, color: "#8896ac" }}>
                      {companyName(r.ticker) || r.sector || ""}
                    </span>
                  </span>
                  {typeof r.score === "number" && (
                    <span style={{ fontFamily: FONT_MONO, fontSize: 13, color: c }}>
                      {r.score.toFixed(0)}
                    </span>
                  )}
                </Link>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
