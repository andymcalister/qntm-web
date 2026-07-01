"use client";

import { useEffect, useMemo, useState } from "react";
import NavBar from "../screener/NavBar";
import FactorCard from "../screener/FactorCard";
import { Row, pctRankFn, FONT_DISPLAY, FONT_MONO } from "../screener/lib";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "https://qntm-api.onrender.com";
const LOGIN_URL = process.env.NEXT_PUBLIC_LOGIN_URL || "https://app.qntm.live";

type Holding = Row & {
  shares: number; avg_cost: number; entry_date: string | null; notes: string | null;
  market_value: number | null; cost_basis: number | null; pnl: number | null; pnl_pct: number | null;
};
type Summary = {
  count: number; hi: number; mo: number; lo: number; avg_score: number | null;
  total_value: number; total_cost: number; total_pnl: number; total_pnl_pct: number | null;
};

const money = (n: number | null | undefined) =>
  n == null ? "—" : `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function Portfolio() {
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [univScores, setUnivScores] = useState<number[]>([]);
  const [uid, setUid] = useState("");
  const [plan, setPlan] = useState("free");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [tk, setTk] = useState("");
  const [sh, setSh] = useState("");
  const [cost, setCost] = useState("");
  const [adding, setAdding] = useState(false);
  const [addMsg, setAddMsg] = useState<string | null>(null);
  const [upsell, setUpsell] = useState(false);

  async function loadPortfolio() {
    const r = await fetch("/api/portfolio");
    if (r.status === 401) { window.location.href = LOGIN_URL; return; }
    const d = await r.json().catch(() => ({}));
    setHoldings(d.holdings || []);
    setSummary(d.summary || null);
  }

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const me = await fetch("/api/me").then((r) => r.json()).catch(() => ({ plan: "free" }));
        setUid(me?.user_id || "");
        setPlan(me?.plan || "free");
        const scrP = fetch(`${API_BASE}/api/screener?limit=2000`, { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)).catch(() => null);
        const [, scr] = await Promise.all([loadPortfolio(), scrP]);
        if (scr?.rows) setUnivScores(scr.rows.map((x: Row) => x.score));
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Could not load your portfolio.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const pctRank = useMemo(() => pctRankFn(univScores), [univScores]);
  const atLimit = plan === "free" && holdings.length >= 10;

  async function signOut() {
    try { await fetch("/api/session", { method: "DELETE" }); } catch {}
    window.location.href = LOGIN_URL;
  }

  async function addPosition() {
    const ticker = tk.trim().toUpperCase();
    const shares = parseFloat(sh);
    const avg_cost = parseFloat(cost);
    if (!ticker || !(shares > 0) || !(avg_cost >= 0)) {
      setAddMsg("Enter a ticker, share count, and cost.");
      return;
    }
    setAdding(true);
    setAddMsg(null);
    setUpsell(false);
    try {
      const r = await fetch("/api/portfolio", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ticker, shares, avg_cost }) });
      if (r.ok) { setTk(""); setSh(""); setCost(""); await loadPortfolio(); }
      else if (r.status === 402) setUpsell(true);
      else setAddMsg(`Couldn't add ${ticker} — check it's a recognized ticker.`);
    } catch {
      setAddMsg("Add failed — try again.");
    } finally {
      setAdding(false);
    }
  }

  async function removePosition(ticker: string) {
    setHoldings((prev) => prev.filter((h) => h.ticker !== ticker));
    try { await fetch(`/api/portfolio/${encodeURIComponent(ticker)}`, { method: "DELETE" }); await loadPortfolio(); }
    catch { await loadPortfolio(); }
  }

  const pnlColor = (n: number | null | undefined) => (n == null ? "#8896ac" : n >= 0 ? "#34d399" : "#f87171");
  const avgLabel = (s: number | null) => (s == null ? "—" : s >= 60 ? "High" : s < 45 ? "Low" : "Moderate");

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-bg,#060709)", color: "#cbd5e1" }}>
      <NavBar uid={uid} plan={plan} active="portfolio" onSignOut={signOut} />
      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "28px 24px 60px" }}>
        <p style={{ fontFamily: FONT_MONO, fontSize: 13, letterSpacing: ".2em", color: "#d4a843", margin: 0 }}>💼 PORTFOLIO</p>
        <h1 style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 30, color: "#fff", margin: "8px 0 0" }}>
          {loading ? "Loading…" : `${holdings.length} position${holdings.length === 1 ? "" : "s"}`}
        </h1>
        <p style={{ fontFamily: FONT_MONO, fontSize: 13, color: "#64748b", margin: "4px 0 0" }}>Position-level conviction scores · updated daily</p>

        {/* summary strip */}
        {summary && holdings.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 24, alignItems: "center", justifyContent: "space-between", marginTop: 18, padding: "16px 20px", background: "rgba(255,255,255,.02)", border: "1px solid rgba(255,255,255,.07)", borderRadius: 12 }}>
            <div style={{ display: "flex", gap: 28, flexWrap: "wrap" }}>
              <div>
                <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: "#8896ac", letterSpacing: ".1em" }}>MARKET VALUE</div>
                <div style={{ fontFamily: FONT_DISPLAY, fontSize: 22, fontWeight: 800, color: "#e7ecf3" }}>{money(summary.total_value)}</div>
              </div>
              <div>
                <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: "#8896ac", letterSpacing: ".1em" }}>UNREALIZED P&amp;L</div>
                <div style={{ fontFamily: FONT_DISPLAY, fontSize: 22, fontWeight: 800, color: pnlColor(summary.total_pnl) }}>
                  {summary.total_pnl >= 0 ? "+" : "−"}{money(Math.abs(summary.total_pnl))}
                  {summary.total_pnl_pct != null && <span style={{ fontSize: 14, marginLeft: 6 }}>({summary.total_pnl_pct >= 0 ? "+" : ""}{summary.total_pnl_pct.toFixed(1)}%)</span>}
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontFamily: FONT_DISPLAY, fontSize: 20, fontWeight: 800, color: "#b3bed0" }}>avg {summary.avg_score != null ? summary.avg_score.toFixed(0) : "—"}</div>
                <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: "#8896ac" }}>{avgLabel(summary.avg_score)} conviction</div>
              </div>
              <div style={{ display: "flex", gap: 14 }}>
                <div style={{ textAlign: "center" }}><div style={{ fontFamily: FONT_MONO, fontSize: 16, color: "#34d399" }}>{summary.hi}</div><div style={{ fontSize: 11, color: "#8896ac" }}>HIGH</div></div>
                <div style={{ textAlign: "center" }}><div style={{ fontFamily: FONT_MONO, fontSize: 16, color: "#fbbf24" }}>{summary.mo}</div><div style={{ fontSize: 11, color: "#8896ac" }}>MOD</div></div>
                <div style={{ textAlign: "center" }}><div style={{ fontFamily: FONT_MONO, fontSize: 16, color: "#f87171" }}>{summary.lo}</div><div style={{ fontSize: 11, color: "#8896ac" }}>LOW</div></div>
              </div>
            </div>
          </div>
        )}

        {/* add form / upsell */}
        {atLimit || upsell ? (
          <div style={{ marginTop: 18, padding: "16px 20px", background: "rgba(212,168,67,.06)", border: "1px solid rgba(212,168,67,.25)", borderRadius: 10 }}>
            <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 15, color: "#e7ecf3" }}>Free plan holds up to 10 positions</div>
            <div style={{ fontSize: 13, color: "#b3bed0", margin: "4px 0 10px" }}>Upgrade to Pro for unlimited holdings, signal alerts, and hidden gems.</div>
            <a href={`${LOGIN_URL}/?qnav=account&uid=${encodeURIComponent(uid)}&plan=${encodeURIComponent(plan)}&ck=1`} style={{ display: "inline-block", fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 13, letterSpacing: ".04em", color: "#0b0c10", background: "#d4a843", borderRadius: 8, padding: "9px 18px", textDecoration: "none" }}>Upgrade to Pro</a>
          </div>
        ) : (
          <div style={{ display: "flex", gap: 8, marginTop: 18, flexWrap: "wrap", alignItems: "center" }}>
            <input value={tk} onChange={(e) => setTk(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") addPosition(); }} placeholder="Ticker" style={{ background: "rgba(13,14,22,.8)", border: "1px solid rgba(255,255,255,.1)", borderRadius: 8, padding: "9px 12px", fontSize: 14, color: "#e2e8f0", width: 120, fontFamily: FONT_MONO, letterSpacing: ".04em" }} />
            <input value={sh} onChange={(e) => setSh(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") addPosition(); }} placeholder="Shares" inputMode="decimal" style={{ background: "rgba(13,14,22,.8)", border: "1px solid rgba(255,255,255,.1)", borderRadius: 8, padding: "9px 12px", fontSize: 14, color: "#e2e8f0", width: 110, fontFamily: FONT_MONO }} />
            <input value={cost} onChange={(e) => setCost(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") addPosition(); }} placeholder="Avg cost $" inputMode="decimal" style={{ background: "rgba(13,14,22,.8)", border: "1px solid rgba(255,255,255,.1)", borderRadius: 8, padding: "9px 12px", fontSize: 14, color: "#e2e8f0", width: 120, fontFamily: FONT_MONO }} />
            <button onClick={addPosition} disabled={adding} style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 13, letterSpacing: ".04em", color: "#0b0c10", background: "#d4a843", border: "none", borderRadius: 8, padding: "9px 18px", cursor: adding ? "default" : "pointer", opacity: adding ? 0.5 : 1 }}>{adding ? "ADDING…" : "ADD"}</button>
            {addMsg && <span style={{ fontSize: 13, color: "#f87171" }}>{addMsg}</span>}
          </div>
        )}

        {/* holdings */}
        <div style={{ marginTop: 22 }}>
          {loading ? (
            <div style={{ color: "#64748b", fontFamily: FONT_MONO, fontSize: 13, padding: "40px 0" }}>Loading your portfolio…</div>
          ) : error ? (
            <div style={{ color: "#f87171", fontFamily: FONT_MONO, fontSize: 13, padding: "40px 0" }}>{error}</div>
          ) : holdings.length === 0 ? (
            <div style={{ border: "1px dashed rgba(255,255,255,.12)", borderRadius: 12, padding: "48px 24px", textAlign: "center" }}>
              <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 18, color: "#cbd5e1" }}>No positions yet</div>
              <div style={{ fontSize: 14, color: "#8896ac", marginTop: 6 }}>Add a position above to track its conviction score and P&amp;L.</div>
            </div>
          ) : (
            holdings.map((h) => (
              <div key={h.ticker}>
                <FactorCard r={h} isGem={h.is_hidden_gem} pctRank={pctRank(h.score)} callout={null} />
                <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "4px 12px", fontFamily: FONT_MONO, fontSize: 12, color: "#8896ac", margin: "-2px 0 12px 3px" }}>
                  <span>{h.shares.toLocaleString()} sh @ {money(h.avg_cost)}</span>
                  <span style={{ color: "#6b7686" }}>·</span>
                  <span>value {money(h.market_value)}</span>
                  {h.pnl != null && (
                    <>
                      <span style={{ color: "#6b7686" }}>·</span>
                      <span style={{ color: pnlColor(h.pnl) }}>{h.pnl >= 0 ? "▲" : "▼"} {money(Math.abs(h.pnl))}{h.pnl_pct != null ? ` (${h.pnl_pct >= 0 ? "+" : ""}${h.pnl_pct.toFixed(1)}%)` : ""}</span>
                    </>
                  )}
                  <button onClick={() => removePosition(h.ticker)} style={{ marginLeft: "auto", background: "transparent", border: "1px solid rgba(255,255,255,.12)", borderRadius: 6, color: "#94a3b8", fontFamily: FONT_MONO, fontSize: 11, padding: "3px 8px", cursor: "pointer" }}>✕ Remove</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
