"use client";

import { useEffect, useMemo, useState } from "react";
import NavBar from "../screener/NavBar";
import FactorCard from "../screener/FactorCard";
import { Row, pctRankFn, valueCallout, FONT_DISPLAY, FONT_MONO } from "../screener/lib";
import { useWatchlist } from "../screener/useWatchlist";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "https://qntm-api.onrender.com";
const LOGIN_URL = process.env.NEXT_PUBLIC_LOGIN_URL || "/login";

type Gem = Row & { gem_reasons: string[]; gem_regime: string | null };
type GemsResp = { locked: boolean; regime: string; threshold: number; as_of: string | null; count: number; gems: Gem[]; teaser_reasons: string[] };

const REGIME_COLOR: Record<string, string> = {
  RISK_OFF: "#f87171", "HIGH VOLATILITY": "#f97316", RISK_ON: "#34d399", MILDLY_BULLISH: "#4ade80", NEUTRAL: "#d4a843",
};

export default function HiddenGems() {
  const [data, setData] = useState<GemsResp | null>(null);
  const [univScores, setUnivScores] = useState<number[]>([]);
  const [uid, setUid] = useState("");
  const [plan, setPlan] = useState("free");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { watched, toggleWatch } = useWatchlist();

  useEffect(() => {
    (async () => {
      setLoading(true); setError(null);
      try {
        const me = await fetch("/api/me").then((r) => r.json()).catch(() => ({ plan: "free" }));
        setUid(me?.user_id || ""); setPlan(me?.plan || "free");
        const [g, scr] = await Promise.all([
          fetch("/api/hidden-gems", { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)),
          fetch(`${API_BASE}/api/screener?limit=2000`, { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)).catch(() => null),
        ]);
        if (!g) throw new Error("Could not load hidden gems.");
        setData(g);
        if (scr?.rows) setUnivScores(scr.rows.map((r: Row) => r.score));
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Could not load hidden gems.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const pctRank = useMemo(() => pctRankFn(univScores.length ? univScores : (data?.gems || []).map((g) => g.score)), [univScores, data]);
  const locked = data ? data.locked : true;

  async function signOut() {
    try { await fetch("/api/session", { method: "DELETE" }); } catch {}
    window.location.href = LOGIN_URL;
  }

  const regime = data?.regime || "NEUTRAL";
  const regimeColor = REGIME_COLOR[regime.replace(" ", "_")] || REGIME_COLOR[regime] || "#d4a843";
  const gems = data?.gems || [];

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-bg,#060709)", color: "#cbd5e1" }}>
      <NavBar uid={uid} plan={plan} active="gems" onSignOut={signOut} />
      <div style={{ maxWidth: 1440, margin: "0 auto", padding: "28px 24px 60px" }}>
        <p style={{ fontFamily: FONT_MONO, fontSize: 13, letterSpacing: ".2em", color: "#34d399", margin: 0 }}>💎 HIDDEN GEMS</p>
        <h1 style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 30, color: "#fff", margin: "8px 0 0" }}>Under Wall Street&apos;s radar</h1>
        <p style={{ fontFamily: FONT_MONO, fontSize: 13, color: "#64748b", margin: "4px 0 0" }}>Mid- and small-cap names with institutional-grade factor scores — the curated shortlist</p>

        {loading ? (
          <div style={{ color: "#64748b", fontFamily: FONT_MONO, fontSize: 13, padding: "48px 0" }}>Scanning for gems…</div>
        ) : error ? (
          <div style={{ color: "#f87171", fontFamily: FONT_MONO, fontSize: 13, padding: "48px 0" }}>{error}</div>
        ) : locked ? (
          // ── Non-Pro teaser: real count + reasons, names locked ──
          <div style={{ marginTop: 24, background: "rgba(52,211,153,.04)", border: "1px solid rgba(52,211,153,.2)", borderRadius: 12, padding: "32px 28px", textAlign: "center" }}>
            <div style={{ fontSize: 44, marginBottom: 12 }}>🔒</div>
            <div style={{ fontFamily: FONT_DISPLAY, fontSize: 22, fontWeight: 800, color: "#34d399", marginBottom: 8 }}>Founding Member Feature</div>
            <div style={{ color: "#9fabc0", maxWidth: 480, margin: "0 auto 6px", lineHeight: 1.7, fontSize: 14 }}>
              {data && data.count > 0
                ? `The model surfaced ${data.count} hidden ${data.count === 1 ? "gem" : "gems"} today — mid/small-caps with institutional-grade scores flying under the radar.`
                : "Hidden Gem detection surfaces mid/small-caps with institutional-grade scores before the crowd notices."}
            </div>
            {(data?.teaser_reasons?.length ?? 0) > 0 && (
              <div style={{ maxWidth: 460, margin: "18px auto 0", textAlign: "left", display: "flex", flexDirection: "column", gap: 8 }}>
                {data!.teaser_reasons.slice(0, 4).map((reason, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.06)", borderRadius: 8, padding: "10px 14px" }}>
                    <span style={{ fontFamily: FONT_MONO, fontSize: 13, fontWeight: 700, color: "#4b5568", filter: "blur(5px)", userSelect: "none" }}>●●●●</span>
                    <span style={{ fontFamily: FONT_MONO, fontSize: 12, color: "#8896ac" }}>{reason || "High-conviction signal"}</span>
                  </div>
                ))}
              </div>
            )}
            <a href={`${LOGIN_URL}/?qnav=account&uid=${encodeURIComponent(uid)}&plan=${encodeURIComponent(plan)}&ck=1`}
              style={{ display: "inline-block", marginTop: 22, fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 14, letterSpacing: ".03em", color: "#0b0c10", background: "#34d399", borderRadius: 10, padding: "12px 26px", textDecoration: "none" }}>
              Join Founding Members — Unlock Now
            </a>
          </div>
        ) : (
          // ── Pro: full gem list ──
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8, margin: "20px 0 14px" }}>
              <div style={{ fontFamily: FONT_MONO, fontSize: 13, color: "#b3bed0" }}>{gems.length} hidden {gems.length === 1 ? "gem" : "gems"} identified</div>
              <div style={{ fontFamily: FONT_MONO, fontSize: 13, color: regimeColor }}>Regime: {regime} · Threshold {data?.threshold ?? 62}+</div>
            </div>

            {gems.length === 0 ? (
              <div style={{ border: "1px dashed rgba(255,255,255,.12)", borderRadius: 12, padding: "48px 24px", textAlign: "center" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>💎</div>
                <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 18, color: "#8896ac" }}>No hidden gems today</div>
                <div style={{ fontSize: 13, color: "#94a3b8", maxWidth: 340, margin: "8px auto 0", lineHeight: 1.7 }}>
                  No mid/small-cap cleared the high-conviction threshold in the current {regime} regime. Check back after the next scan, or explore the Screener.
                </div>
              </div>
            ) : (
              gems.map((g) => (
                <div key={g.ticker}>
                  <FactorCard r={g} isGem pctRank={pctRank(g.score)} callout={valueCallout(g)} isWatched={watched.has(g.ticker)} onToggleWatch={toggleWatch} />
                  {g.gem_reasons.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, margin: "-2px 0 14px 3px" }}>
                      {g.gem_reasons.map((reason, i) => (
                        <span key={i} style={{ fontFamily: FONT_MONO, fontSize: 11, color: "#6ee7b7", background: "rgba(52,211,153,.08)", border: "1px solid rgba(52,211,153,.2)", borderRadius: 20, padding: "3px 10px" }}>{reason}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </>
        )}
      </div>
    </div>
  );
}
