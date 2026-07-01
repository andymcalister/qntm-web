"use client";

import { useEffect, useState } from "react";
import { FONT_MONO } from "../screener/lib";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "https://qntm-api.onrender.com";

type Pt = { d: string; v: number };
type Series = {
  ticker: string; days: number; stock: Pt[]; spy: Pt[];
  stock_ret_pct: number | null; spy_ret_pct: number | null;
};

// Rebase each series to 0% at the window start, matching _mini_vs_spy_svg.
function paths(stock: Pt[], spy: Pt[]) {
  const norm = (pairs: Pt[]) => {
    const base = pairs[0]?.v;
    if (!base) return null;
    return pairs.map((p) => (p.v / base - 1) * 100);
  };
  const s = norm(stock), k = norm(spy);
  if (!s || !k || s.length < 2 || k.length < 2) return null;
  const W = 260, H = 58, P = 5;
  const allv = [...s, ...k];
  let lo = Math.min(...allv), hi = Math.max(...allv);
  if (hi === lo) hi = lo + 1;
  const pad = (hi - lo) * 0.14;
  lo -= pad; hi += pad;
  const X = (i: number, n: number) => P + (W - 2 * P) * (i / (n - 1));
  const Y = (v: number) => P + (H - 2 * P) * (1 - (v - lo) / (hi - lo));
  const d = (arr: number[]) => "M " + arr.map((v, i) => `${X(i, arr.length).toFixed(1)},${Y(v).toFixed(1)}`).join(" L ");
  return { W, H, P, pathStock: d(s), pathSpy: d(k), y0: lo <= 0 && hi >= 0 ? Y(0) : null };
}

export default function RelSpyChart({ ticker }: { ticker: string }) {
  const [data, setData] = useState<Series | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let live = true;
    fetch(`${API_BASE}/api/stock/${encodeURIComponent(ticker)}/prices?days=20`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (live) setData(d); })
      .catch(() => {})
      .finally(() => { if (live) setDone(true); });
    return () => { live = false; };
  }, [ticker]);

  if (!done) return null;
  if (!data || data.stock.length < 2 || data.spy.length < 2) return null;
  const p = paths(data.stock, data.spy);
  if (!p) return null;

  const s = data.stock_ret_pct ?? 0, k = data.spy_ret_pct ?? 0;
  const ss = s >= 0 ? "+" : "", ks = k >= 0 ? "+" : "";

  return (
    <div style={{ padding: "12px 16px 14px", marginTop: 12, background: "rgba(255,255,255,.02)", borderRadius: 8, border: "1px solid rgba(255,255,255,.05)" }}>
      <div style={{ display: "flex", gap: 14, alignItems: "center", fontFamily: FONT_MONO, fontSize: 11, marginBottom: 6 }}>
        <span style={{ color: "#d4a843" }}>— {ticker} {ss}{s.toFixed(1)}%</span>
        <span style={{ color: "#7c8aa0" }}>— SPY {ks}{k.toFixed(1)}%</span>
        <span style={{ color: "#8896ac", marginLeft: "auto" }}>{data.stock.length}-day vs SPY</span>
      </div>
      <svg viewBox={`0 0 ${p.W} ${p.H}`} width="100%" style={{ display: "block", maxWidth: 300 }}>
        {p.y0 != null && (
          <line x1={p.P} y1={p.y0.toFixed(1)} x2={p.W - p.P} y2={p.y0.toFixed(1)} stroke="rgba(255,255,255,.10)" strokeDasharray="2,3" />
        )}
        <path d={p.pathSpy} fill="none" stroke="#7c8aa0" strokeWidth={1.4} strokeLinejoin="round" />
        <path d={p.pathStock} fill="none" stroke="#d4a843" strokeWidth={2} strokeLinejoin="round" />
      </svg>
    </div>
  );
}
