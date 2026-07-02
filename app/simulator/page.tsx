"use client";

import { useEffect, useMemo, useState } from "react";
import NavBar from "../screener/NavBar";
import { Row, searchUniverse, companyName, FONT_DISPLAY, FONT_MONO } from "../screener/lib";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "https://qntm-api.onrender.com";
const LOGIN_URL = process.env.NEXT_PUBLIC_LOGIN_URL || "https://app.qntm.live";

type SimTeaser = { sector: string; tier: string };
type SimResp = { locked: boolean; profile: string; as_of: string | null; count: number; picks: Row[]; teaser: SimTeaser[] };

const PROFILES: { key: string; label: string; desc: string; color: string }[] = [
  { key: "HIGH", label: "🔥 High Risk", desc: "Top 20 by momentum. Higher volatility, higher potential.", color: "#d4a843" },
  { key: "MEDIUM", label: "⚖️ Medium Risk", desc: "Top 20 by conviction. Balanced — the model default.", color: "#b3bed0" },
  { key: "LOW", label: "🛡 Low Risk", desc: "Top 20 by quality + value. More defensive.", color: "#34d399" },
];

const money = (n: number) => `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
const scoreColor = (s: number) => (s >= 60 ? "#34d399" : s < 45 ? "#f87171" : "#fbbf24");

export default function Simulator() {
  const [profile, setProfile] = useState("MEDIUM");
  const [amount, setAmount] = useState(50000);
  const [equalWeight, setEqualWeight] = useState(true);
  const [data, setData] = useState<SimResp | null>(null);
  const [univRows, setUnivRows] = useState<Row[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [showSug, setShowSug] = useState(false);
  const [uid, setUid] = useState("");
  const [plan, setPlan] = useState("free");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // universe + identity once
  useEffect(() => {
    (async () => {
      const me = await fetch("/api/me").then((r) => r.json()).catch(() => ({ plan: "free" }));
      setUid(me?.user_id || ""); setPlan(me?.plan || "free");
      const scr = await fetch(`${API_BASE}/api/screener?limit=2000`, { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)).catch(() => null);
      if (scr?.rows) setUnivRows(scr.rows);
    })();
  }, []);

  // picks per profile
  useEffect(() => {
    (async () => {
      setLoading(true); setError(null);
      try {
        const d: SimResp = await fetch(`/api/simulator?profile=${profile}`, { cache: "no-store" }).then((r) => r.json());
        setData(d);
        if (!d.locked) setSelected(d.picks.map((p) => p.ticker));  // reset basket to the profile picks
      } catch {
        setError("Could not load the simulator.");
      } finally {
        setLoading(false);
      }
    })();
  }, [profile]);

  async function signOut() {
    try { await fetch("/api/session", { method: "DELETE" }); } catch {}
    window.location.href = LOGIN_URL;
  }

  const rowMap = useMemo(() => {
    const m: Record<string, Row> = {};
    for (const r of univRows) m[r.ticker] = r;
    for (const p of (data?.picks || [])) m[p.ticker] = p;  // picks win (fresh)
    return m;
  }, [univRows, data]);

  const tickers = useMemo(() => univRows.map((r) => r.ticker), [univRows]);
  const suggestions = useMemo(() => (showSug && query.trim() ? searchUniverse(query, tickers).filter((s) => !selected.includes(s.ticker)) : []), [showSug, query, tickers, selected]);

  const alloc = useMemo(() => {
    const rows = selected.map((tk) => rowMap[tk]).filter(Boolean) as Row[];
    const n = rows.length;
    let weightOf: (r: Row) => number;
    if (equalWeight || n === 0) {
      weightOf = () => (n ? 100 / n : 0);
    } else {
      const tot = rows.reduce((s, r) => s + Math.max(r.score, 1), 0);
      weightOf = (r) => (tot > 0 ? (Math.max(r.score, 1) / tot) * 100 : 100 / n);
    }
    return rows.map((r) => {
      const pct = weightOf(r);
      const dollars = (amount * pct) / 100;
      const shares = r.price && r.price > 0 ? dollars / r.price : null;
      return { r, pct, dollars, shares };
    });
  }, [selected, rowMap, equalWeight, amount]);

  const weightedScore = useMemo(() => alloc.reduce((s, a) => s + a.pct * a.r.score, 0) / 100, [alloc]);
  const sectorSpread = useMemo(() => {
    const t: Record<string, number> = {};
    for (const a of alloc) t[a.r.sector || "Unknown"] = (t[a.r.sector || "Unknown"] || 0) + a.dollars;
    return Object.entries(t).sort((x, y) => y[1] - x[1]).slice(0, 8);
  }, [alloc]);

  const locked = data ? data.locked : false;

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-bg,#060709)", color: "#cbd5e1" }}>
      <NavBar uid={uid} plan={plan} active="simulator" onSignOut={signOut} />
      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "28px 24px 60px" }}>
        <p style={{ fontFamily: FONT_MONO, fontSize: 13, letterSpacing: ".2em", color: "#d4a843", margin: 0 }}>🧮 PORTFOLIO SIMULATOR</p>
        <h1 style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 30, color: "#fff", margin: "8px 0 0" }}>Build a hypothetical portfolio</h1>
        <p style={{ fontFamily: FONT_MONO, fontSize: 13, color: "#64748b", margin: "4px 0 0" }}>Sample allocations from current signals · nightly scores</p>

        {loading && !data ? (
          <div style={{ color: "#64748b", fontFamily: FONT_MONO, fontSize: 13, padding: "48px 0" }}>Loading signals…</div>
        ) : error ? (
          <div style={{ color: "#f87171", fontFamily: FONT_MONO, fontSize: 13, padding: "48px 0" }}>{error}</div>
        ) : locked ? (
          // ── Pro gate ──
          <div style={{ marginTop: 24, background: "rgba(212,168,67,.05)", border: "1px solid rgba(212,168,67,.22)", borderRadius: 12, padding: "32px 28px", textAlign: "center" }}>
            <div style={{ fontSize: 44, marginBottom: 12 }}>🔒</div>
            <div style={{ fontFamily: FONT_DISPLAY, fontSize: 22, fontWeight: 800, color: "#d4a843", marginBottom: 8 }}>Portfolio Simulator — Pro</div>
            <div style={{ color: "#9fabc0", maxWidth: 480, margin: "0 auto", lineHeight: 1.7, fontSize: 14 }}>
              Build hypothetical portfolios from current high-conviction signals, spread across sectors{data && data.count ? ` — today's model surfaced ${data.count} candidates` : ""}.
            </div>
            {(data?.teaser?.length ?? 0) > 0 && (
              <div style={{ maxWidth: 420, margin: "18px auto 0", display: "flex", flexDirection: "column", gap: 8 }}>
                {data!.teaser.map((t, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.06)", borderRadius: 8, padding: "10px 14px" }}>
                    <span style={{ fontFamily: FONT_MONO, fontSize: 13, fontWeight: 700, color: "#4b5568", filter: "blur(5px)", userSelect: "none" }}>●●●●</span>
                    <span style={{ fontFamily: FONT_MONO, fontSize: 12, color: "#8896ac" }}>{t.sector}</span>
                    <span style={{ fontFamily: FONT_MONO, fontSize: 12, color: t.tier === "High" ? "#34d399" : t.tier === "Low" ? "#f87171" : "#fbbf24" }}>{t.tier}</span>
                  </div>
                ))}
              </div>
            )}
            <a href={`${LOGIN_URL}/?qnav=account&uid=${encodeURIComponent(uid)}&plan=${encodeURIComponent(plan)}&ck=1`}
              style={{ display: "inline-block", marginTop: 22, fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 14, letterSpacing: ".03em", color: "#0b0c10", background: "#d4a843", borderRadius: 10, padding: "12px 26px", textDecoration: "none" }}>
              Unlock Simulator — Upgrade to Pro
            </a>
          </div>
        ) : (
          <>
            {/* controls */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center", marginTop: 20 }}>
              <label style={{ fontFamily: FONT_MONO, fontSize: 12, color: "#9fabc0" }}>Amount
                <input type="number" min={1000} max={10000000} step={1000} value={amount}
                  onChange={(e) => setAmount(Math.max(0, parseInt(e.target.value || "0", 10)))}
                  style={{ marginLeft: 8, width: 130, background: "rgba(13,14,22,.8)", border: "1px solid rgba(255,255,255,.1)", borderRadius: 8, padding: "8px 10px", color: "#e2e8f0", fontFamily: FONT_MONO, fontSize: 14 }} />
              </label>
              <button onClick={() => setEqualWeight((v) => !v)} style={{ fontFamily: FONT_MONO, fontSize: 12, letterSpacing: ".03em", padding: "8px 14px", borderRadius: 8, border: "1px solid rgba(255,255,255,.12)", cursor: "pointer", background: "rgba(255,255,255,.04)", color: "#cbd5e1" }}>
                {equalWeight ? "⚖️ Equal weight" : "🎯 Conviction weighted"}
              </button>
              {loading && <span style={{ fontFamily: FONT_MONO, fontSize: 12, color: "#64748b" }}>updating…</span>}
            </div>

            {/* profile selector */}
            <div style={{ fontFamily: FONT_MONO, fontSize: 12, color: "#9fabc0", letterSpacing: ".08em", margin: "18px 0 8px" }}>RISK PROFILE</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 8 }}>
              {PROFILES.map((p) => {
                const active = profile === p.key;
                return (
                  <button key={p.key} onClick={() => setProfile(p.key)} style={{
                    textAlign: "left", cursor: "pointer", borderRadius: 10, padding: "12px 14px",
                    background: active ? "rgba(255,255,255,.06)" : "rgba(255,255,255,.02)",
                    border: `1px solid ${active ? p.color : "rgba(255,255,255,.08)"}`,
                  }}>
                    <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 14, color: p.color }}>{p.label}</div>
                    <div style={{ fontFamily: FONT_MONO, fontSize: 11.5, color: "#9fabc0", marginTop: 4, lineHeight: 1.4 }}>{p.desc}</div>
                    <div style={{ fontFamily: FONT_MONO, fontSize: 12, color: active ? p.color : "#64748b", marginTop: 6, fontWeight: 700 }}>{active ? "✓ Selected" : "Select"}</div>
                  </button>
                );
              })}
            </div>

            {/* metric cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, margin: "18px 0" }}>
              {[["INVESTED", money(amount), "#d4a843"], ["POSITIONS", String(alloc.length), "#cbd5e1"], ["AVG SCORE", weightedScore.toFixed(1), scoreColor(weightedScore)]].map(([label, val, col]) => (
                <div key={label} style={{ background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.07)", borderRadius: 8, padding: "12px", textAlign: "center" }}>
                  <div style={{ fontFamily: FONT_MONO, fontSize: 12, color: "#9fabc0", letterSpacing: ".08em", marginBottom: 4 }}>{label}</div>
                  <div style={{ fontFamily: FONT_DISPLAY, fontSize: 20, fontWeight: 800, color: col as string }}>{val}</div>
                </div>
              ))}
            </div>

            {/* add position */}
            <div style={{ position: "relative", maxWidth: 320, marginBottom: 14 }}>
              <input value={query} onChange={(e) => { setQuery(e.target.value); setShowSug(true); }}
                onFocus={() => setShowSug(true)} onBlur={() => setTimeout(() => setShowSug(false), 120)}
                placeholder="🔍  Add a position — NVDA, Apple…"
                style={{ width: "100%", background: "rgba(13,14,22,.8)", border: "1px solid rgba(255,255,255,.1)", borderRadius: 8, padding: "9px 12px", fontSize: 14, color: "#e2e8f0", fontFamily: FONT_MONO }} />
              {suggestions.length > 0 && (
                <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 20, background: "#0d0e16", border: "1px solid rgba(255,255,255,.12)", borderRadius: 8, overflow: "hidden", boxShadow: "0 8px 24px rgba(0,0,0,.5)" }}>
                  {suggestions.map((s) => (
                    <button key={s.ticker} onMouseDown={(e) => { e.preventDefault(); setSelected((prev) => [...prev, s.ticker]); setQuery(""); setShowSug(false); }}
                      style={{ display: "flex", gap: 8, width: "100%", textAlign: "left", padding: "8px 12px", background: "transparent", border: "none", borderBottom: "1px solid rgba(255,255,255,.05)", cursor: "pointer", color: "#e2e8f0" }}>
                      <span style={{ fontFamily: FONT_MONO, fontSize: 13, fontWeight: 600, minWidth: 52 }}>{s.ticker}</span>
                      <span style={{ fontSize: 12, color: "#8896ac" }}>{s.name || ""}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* allocation table */}
            <div style={{ border: "1px solid rgba(255,255,255,.07)", borderRadius: 12, overflow: "hidden" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1.2fr 0.8fr 1fr 1fr 0.5fr", gap: 8, padding: "10px 16px", background: "rgba(255,255,255,.03)", fontFamily: FONT_MONO, fontSize: 11, color: "#8896ac", letterSpacing: ".06em" }}>
                <span>TICKER</span><span>SECTOR</span><span style={{ textAlign: "right" }}>SCORE</span><span style={{ textAlign: "right" }}>WEIGHT</span><span style={{ textAlign: "right" }}>ALLOCATION</span><span />
              </div>
              {alloc.length === 0 ? (
                <div style={{ padding: "32px 16px", textAlign: "center", color: "#8896ac", fontFamily: FONT_MONO, fontSize: 13 }}>No positions — pick a profile or add one above.</div>
              ) : (
                alloc.map((a, i) => (
                  <div key={a.r.ticker} style={{ display: "grid", gridTemplateColumns: "1.4fr 1.2fr 0.8fr 1fr 1fr 0.5fr", gap: 8, padding: "10px 16px", alignItems: "center", borderTop: "1px solid rgba(255,255,255,.05)", background: i % 2 ? "transparent" : "rgba(255,255,255,.012)" }}>
                    <span>
                      <span style={{ fontFamily: FONT_MONO, fontSize: 13, fontWeight: 700, color: "#e2e8f0" }}>{a.r.ticker}</span>
                      <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: "#64748b", display: "block" }}>{companyName(a.r.ticker) || ""}</span>
                    </span>
                    <span style={{ fontFamily: FONT_MONO, fontSize: 12, color: "#8896ac" }}>{a.r.sector}</span>
                    <span style={{ fontFamily: FONT_MONO, fontSize: 13, color: scoreColor(a.r.score), textAlign: "right", fontWeight: 700 }}>{a.r.score.toFixed(0)}</span>
                    <span style={{ fontFamily: FONT_MONO, fontSize: 13, color: "#cbd5e1", textAlign: "right" }}>{a.pct.toFixed(1)}%</span>
                    <span style={{ textAlign: "right" }}>
                      <span style={{ fontFamily: FONT_MONO, fontSize: 13, color: "#d4a843", fontWeight: 700 }}>{money(a.dollars)}</span>
                      {a.shares != null && <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: "#64748b", display: "block" }}>{a.shares.toLocaleString(undefined, { maximumFractionDigits: 2 })} sh</span>}
                    </span>
                    <button onClick={() => setSelected((prev) => prev.filter((t) => t !== a.r.ticker))} title="Remove"
                      style={{ justifySelf: "end", background: "transparent", border: "1px solid rgba(255,255,255,.12)", borderRadius: 6, color: "#94a3b8", fontFamily: FONT_MONO, fontSize: 12, padding: "2px 8px", cursor: "pointer" }}>✕</button>
                  </div>
                ))
              )}
            </div>

            {/* sector spread */}
            {sectorSpread.length > 0 && (
              <div style={{ marginTop: 18 }}>
                <div style={{ fontFamily: FONT_MONO, fontSize: 12, color: "#9fabc0", letterSpacing: ".08em", marginBottom: 8 }}>SECTOR ALLOCATION</div>
                {sectorSpread.map(([sec, val]) => {
                  const pct = amount > 0 ? (val / amount) * 100 : 0;
                  return (
                    <div key={sec} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
                      <span style={{ fontFamily: FONT_MONO, fontSize: 12, color: "#b3bed0", width: 120, flexShrink: 0 }}>{sec}</span>
                      <div style={{ flex: 1, height: 8, background: "rgba(255,255,255,.05)", borderRadius: 4, overflow: "hidden" }}>
                        <div style={{ width: `${Math.min(pct, 100)}%`, height: "100%", background: "linear-gradient(90deg,#d4a843,#b8922e)" }} />
                      </div>
                      <span style={{ fontFamily: FONT_MONO, fontSize: 12, color: "#8896ac", width: 84, textAlign: "right" }}>{money(val)} · {pct.toFixed(0)}%</span>
                    </div>
                  );
                })}
              </div>
            )}

            <p style={{ fontFamily: FONT_MONO, fontSize: 11, color: "#4b5568", marginTop: 22, lineHeight: 1.6 }}>
              Hypothetical illustration from current model scores — not a recommendation or advice. Weights are equal or conviction-proportional; allocations assume the entered amount fully invested.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
