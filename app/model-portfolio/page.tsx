"use client";

import { useEffect, useMemo, useState } from "react";
import NavBar from "../screener/NavBar";
import FactorCard from "../screener/FactorCard";
import { Row, pctRankFn, valueCallout, FONT_DISPLAY, FONT_MONO } from "../screener/lib";
import EquityChart, { CurvePoint } from "./EquityChart";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "https://qntm-api.onrender.com";
const LOGIN_URL = process.env.NEXT_PUBLIC_LOGIN_URL || "https://app.qntm.live";

type Position = Row & {
  entry_date: string | null; entry_price: number | null; entry_score: number | null;
  current_price: number | null; ret_since_entry: number | null;
};
type Stats = {
  inception: string | null; model_value: number; spy_value: number;
  model_ret: number; spy_ret: number; alpha: number; day_model: number; day_spy: number;
  basis: number; n_sessions: number;
};
type Exit = { ticker: string; sector: string; entry_date: string; exit_date: string; ret: number; reason: string };
type SectorCount = { sector: string; count: number };
type MPResp = {
  inception: string | null; curve: CurvePoint[]; stats: Stats | null;
  positions: Position[]; exits: Exit[]; sector_counts: SectorCount[];
};

const money = (n: number | null | undefined) =>
  n == null ? "—" : `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const pct = (n: number | null | undefined, dp = 2) => (n == null ? "—" : `${n >= 0 ? "+" : ""}${n.toFixed(dp)}%`);
const pcol = (n: number | null | undefined) => (n == null ? "#8896ac" : n >= 0 ? "#34d399" : "#f87171");

export default function ModelPortfolio() {
  const [data, setData] = useState<MPResp | null>(null);
  const [univScores, setUnivScores] = useState<number[]>([]);
  const [uid, setUid] = useState("");
  const [plan, setPlan] = useState("free");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true); setError(null);
      try {
        const me = await fetch("/api/me").then((r) => r.json()).catch(() => ({ plan: "free" }));
        setUid(me?.user_id || ""); setPlan(me?.plan || "free");
        const [mp, scr] = await Promise.all([
          fetch(`${API_BASE}/api/model-portfolio`, { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)),
          fetch(`${API_BASE}/api/screener?limit=2000`, { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)).catch(() => null),
        ]);
        if (!mp) throw new Error("Could not load the model portfolio.");
        setData(mp);
        if (scr?.rows) setUnivScores(scr.rows.map((r: Row) => r.score));
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Could not load the model portfolio.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const pctRank = useMemo(() => pctRankFn(univScores.length ? univScores : (data?.positions || []).map((p) => p.score)), [univScores, data]);

  async function signOut() {
    try { await fetch("/api/session", { method: "DELETE" }); } catch {}
    window.location.href = LOGIN_URL;
  }

  const s = data?.stats || null;
  const positions = data?.positions || [];
  const exits = data?.exits || [];

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-bg,#060709)", color: "#cbd5e1" }}>
      <NavBar uid={uid} plan={plan} active="model_portfolio" onSignOut={signOut} />
      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "28px 24px 60px" }}>
        <p style={{ fontFamily: FONT_MONO, fontSize: 13, letterSpacing: ".2em", color: "#d4a843", margin: 0 }}>🏆 PORTFOLIO &amp; TRACK RECORD</p>
        <h1 style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 30, color: "#fff", margin: "8px 0 0" }}>Live model portfolio vs SPY</h1>
        <p style={{ fontFamily: FONT_MONO, fontSize: 13, color: "#64748b", margin: "4px 0 0" }}>
          Equal-weighted $2K positions · marked-to-market · exits at Low Conviction{s?.inception ? ` · since ${s.inception}` : ""}
        </p>

        {loading ? (
          <div style={{ color: "#64748b", fontFamily: FONT_MONO, fontSize: 13, padding: "48px 0" }}>Loading the equity curve…</div>
        ) : error ? (
          <div style={{ color: "#f87171", fontFamily: FONT_MONO, fontSize: 13, padding: "48px 0" }}>{error}</div>
        ) : (
          <>
            {/* stats strip */}
            {s && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 28, alignItems: "flex-end", marginTop: 18, padding: "16px 20px", background: "rgba(255,255,255,.02)", border: "1px solid rgba(255,255,255,.07)", borderRadius: 12 }}>
                <div>
                  <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: "#8896ac", letterSpacing: ".1em" }}>MODEL</div>
                  <div style={{ fontFamily: FONT_DISPLAY, fontSize: 24, fontWeight: 800, color: "#e7ecf3" }}>{money(s.model_value)}</div>
                  <div style={{ fontFamily: FONT_MONO, fontSize: 13, color: pcol(s.model_ret) }}>{pct(s.model_ret)} <span style={{ color: "#64748b" }}>· day {pct(s.day_model)}</span></div>
                </div>
                <div>
                  <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: "#8896ac", letterSpacing: ".1em" }}>SPY</div>
                  <div style={{ fontFamily: FONT_DISPLAY, fontSize: 24, fontWeight: 800, color: "#b3bed0" }}>{money(s.spy_value)}</div>
                  <div style={{ fontFamily: FONT_MONO, fontSize: 13, color: pcol(s.spy_ret) }}>{pct(s.spy_ret)} <span style={{ color: "#64748b" }}>· day {pct(s.day_spy)}</span></div>
                </div>
                <div>
                  <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: "#8896ac", letterSpacing: ".1em" }}>ALPHA vs SPY</div>
                  <div style={{ fontFamily: FONT_DISPLAY, fontSize: 24, fontWeight: 800, color: pcol(s.alpha) }}>{pct(s.alpha)}</div>
                  <div style={{ fontFamily: FONT_MONO, fontSize: 12, color: "#64748b" }}>{positions.length} open · {s.n_sessions} sessions</div>
                </div>
              </div>
            )}

            {/* equity curve */}
            {data && data.curve.length >= 2 ? (
              <div style={{ marginTop: 18, padding: "16px 12px 12px", background: "rgba(255,255,255,.015)", border: "1px solid rgba(255,255,255,.06)", borderRadius: 12 }}>
                <EquityChart curve={data.curve} />
              </div>
            ) : (
              <div style={{ marginTop: 18, padding: "24px", border: "1px dashed rgba(255,255,255,.12)", borderRadius: 12, color: "#8896ac", fontFamily: FONT_MONO, fontSize: 13 }}>
                The equity curve needs at least two sessions of benchmark data — it&apos;ll appear once a second session is recorded.
              </div>
            )}

            {/* sector spread */}
            {data && data.sector_counts.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 16 }}>
                {data.sector_counts.map((sc) => (
                  <span key={sc.sector} style={{ fontFamily: FONT_MONO, fontSize: 12, color: "#b3bed0", background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 20, padding: "4px 12px" }}>
                    {sc.sector} <span style={{ color: "#d4a843" }}>{sc.count}</span>
                  </span>
                ))}
              </div>
            )}

            {/* open positions */}
            <h2 style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 20, color: "#fff", margin: "34px 0 12px" }}>Open positions <span style={{ color: "#64748b", fontSize: 14, fontWeight: 400 }}>({positions.length})</span></h2>
            {positions.length === 0 ? (
              <div style={{ color: "#8896ac", fontFamily: FONT_MONO, fontSize: 13 }}>No open positions right now.</div>
            ) : (
              positions.map((p) => (
                <div key={p.ticker}>
                  <FactorCard r={p} isGem={p.is_hidden_gem} pctRank={pctRank(p.score)} callout={valueCallout(p)} />
                  <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "4px 12px", fontFamily: FONT_MONO, fontSize: 12, color: "#8896ac", margin: "-2px 0 12px 3px" }}>
                    <span>entered {p.entry_date || "—"} @ {money(p.entry_price)}</span>
                    {p.ret_since_entry != null && (
                      <>
                        <span style={{ color: "#6b7686" }}>·</span>
                        <span style={{ color: pcol(p.ret_since_entry) }}>{p.ret_since_entry >= 0 ? "▲" : "▼"} {pct(p.ret_since_entry, 1)} since entry</span>
                      </>
                    )}
                    {p.entry_score != null && (<><span style={{ color: "#6b7686" }}>·</span><span>entry score {p.entry_score.toFixed(0)}</span></>)}
                  </div>
                </div>
              ))
            )}

            {/* closed trades */}
            {exits.length > 0 && (
              <>
                <h2 style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 20, color: "#fff", margin: "30px 0 12px" }}>Closed trades <span style={{ color: "#64748b", fontSize: 14, fontWeight: 400 }}>({exits.length})</span></h2>
                <div style={{ border: "1px solid rgba(255,255,255,.07)", borderRadius: 12, overflow: "hidden" }}>
                  {exits.map((x, i) => (
                    <div key={`${x.ticker}-${x.exit_date}-${i}`} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", borderBottom: i < exits.length - 1 ? "1px solid rgba(255,255,255,.05)" : "none", background: i % 2 ? "transparent" : "rgba(255,255,255,.012)" }}>
                      <span style={{ fontFamily: FONT_MONO, fontSize: 13, fontWeight: 700, color: "#e2e8f0", minWidth: 56 }}>{x.ticker}</span>
                      <span style={{ fontFamily: FONT_MONO, fontSize: 12, color: "#8896ac", minWidth: 100 }}>{x.sector}</span>
                      <span style={{ fontFamily: FONT_MONO, fontSize: 12, color: "#64748b", flex: 1 }}>{x.entry_date} → {x.exit_date}</span>
                      <span style={{ fontFamily: FONT_MONO, fontSize: 12, color: "#8896ac", maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{x.reason}</span>
                      <span style={{ fontFamily: FONT_MONO, fontSize: 13, fontWeight: 700, color: pcol(x.ret), minWidth: 68, textAlign: "right" }}>{pct(x.ret, 1)}</span>
                    </div>
                  ))}
                </div>
              </>
            )}

            <p style={{ fontFamily: FONT_MONO, fontSize: 11, color: "#4b5568", marginTop: 24, lineHeight: 1.6 }}>
              Hypothetical model portfolio for illustration. $100K notional, $2K equal-weight entries, marked to stored daily closes. Not investment advice; past performance does not guarantee future results.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
