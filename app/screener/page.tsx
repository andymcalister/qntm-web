"use client";

import { useEffect, useMemo, useState } from "react";
import FactorCard from "./FactorCard";
import MacroBanner, { Macro } from "./MacroBanner";
import NavBar from "./NavBar";
import Hero, { Mover } from "./Hero";
import {
  Row, Regime, FONT_DISPLAY, FONT_MONO, blendBuy, blendSell, valueCallout, pctRankFn,
} from "./lib";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "https://qntm-api.onrender.com";
const LOGIN_URL = process.env.NEXT_PUBLIC_LOGIN_URL || "https://app.qntm.live";

const CONV_OPTS = ["All", "High", "Moderate", "Low"] as const;
const CONV_ACTION: Record<string, string> = { High: "BUY", Moderate: "HOLD", Low: "SELL" };
const MIN_OPTS = ["All", "60+", "70+", "80+"] as const;

type Tab = "top10" | "full" | "sector";

export default function Screener() {
  const [rows, setRows] = useState<Row[]>([]);
  const [regime, setRegime] = useState<Regime | null>(null);
  const [macro, setMacro] = useState<Macro | null>(null);
  const [movers, setMovers] = useState<Mover[]>([]);
  const [watched, setWatched] = useState<Set<string>>(new Set());
  const [asOf, setAsOf] = useState<string | null>(null);
  const [plan, setPlan] = useState<string>("free");
  const [uid, setUid] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [tab, setTab] = useState<Tab>("top10");
  const [fSec, setFSec] = useState("All");
  const [fConv, setFConv] = useState<string>("All");
  const [fMin, setFMin] = useState<string>("All");

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        // Resolve session first (fast cookie decode) so the nav renders with the
        // right links even while the universe is still loading.
        const me = await fetch("/api/me").then((r) => r.json()).catch(() => ({ plan: "free" }));
        setPlan(me?.plan || "free");
        setUid(me?.user_id || "");

        const scrP = fetch(`${API_BASE}/api/screener?limit=2000`, { cache: "no-store" }).then((r) => {
          if (!r.ok) throw new Error(`API ${r.status}`);
          return r.json();
        });
        const macroP = fetch(`${API_BASE}/api/macro`, { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)).catch(() => null);
        const moversP = fetch(`${API_BASE}/api/movers`, { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)).catch(() => null);
        const [scr, mac, mov] = await Promise.all([scrP, macroP, moversP]);
        setRows(scr.rows || []);
        setRegime(scr.regime || null);
        setAsOf(scr.as_of || null);
        setMacro(mac && mac.regime ? mac : null);
        setMovers(mov?.movers || []);

        // watchlist membership for the star toggles (non-blocking)
        fetch("/api/watchlist").then((r) => (r.ok ? r.json() : null)).then((d) => {
          if (d?.items) setWatched(new Set(d.items.map((i: { ticker: string }) => i.ticker)));
        }).catch(() => {});
      } catch (e: any) {
        setError(e?.message || "Could not load the screener.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const pctRank = useMemo(() => pctRankFn(rows.map((r) => r.score)), [rows]);
  const gemSet = useMemo(() => new Set(rows.filter((r) => r.is_hidden_gem).map((r) => r.ticker)), [rows]);

  const breadth = useMemo(() => {
    let b = 0, h = 0, s = 0;
    for (const r of rows) { if (r.action === "BUY") b++; else if (r.action === "HOLD") h++; else s++; }
    return { buys: b, holds: h, sells: s, gems: gemSet.size, univ: rows.length };
  }, [rows, gemSet]);

  async function signOut() {
    try { await fetch("/api/session", { method: "DELETE" }); } catch {}
    window.location.href = LOGIN_URL;
  }

  async function toggleWatch(ticker: string) {
    const has = watched.has(ticker);
    setWatched((prev) => { const n = new Set(prev); if (has) n.delete(ticker); else n.add(ticker); return n; });
    try {
      if (has) await fetch(`/api/watchlist/${encodeURIComponent(ticker)}`, { method: "DELETE" });
      else await fetch("/api/watchlist", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ticker }) });
    } catch {
      setWatched((prev) => { const n = new Set(prev); if (has) n.add(ticker); else n.delete(ticker); return n; });
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--color-bg,#060709)" }}>
        <NavBar uid={uid} plan={plan} onSignOut={signOut} />
        <div style={{ color: "#94a3b8", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT_MONO, fontSize: 14, padding: "120px 20px" }}>
          Loading the universe… (first load may take ~30s while the API wakes)
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--color-bg,#060709)" }}>
        <NavBar uid={uid} plan={plan} onSignOut={signOut} />
        <div style={{ color: "#f87171", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT_MONO, fontSize: 14, padding: "120px 20px" }}>
          {error} <button onClick={() => location.reload()} style={{ marginLeft: 10, textDecoration: "underline", color: "#94a3b8" }}>retry</button>
        </div>
      </div>
    );
  }

  const sectors = ["All", ...Array.from(new Set(rows.map((r) => r.sector))).sort()];

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-bg,#060709)", color: "#cbd5e1" }}>
      <NavBar uid={uid} plan={plan} onSignOut={signOut} />
      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "28px 24px 60px" }}>
        {/* header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
          <div>
            <p style={{ fontFamily: FONT_MONO, fontSize: 13, letterSpacing: ".2em", color: "#d4a843", margin: 0 }}>— SCREENER</p>
            <h1 style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 30, color: "#fff", margin: "8px 0 0" }}>
              Conviction across {breadth.univ.toLocaleString()} names
            </h1>
            {asOf && <p style={{ fontFamily: FONT_MONO, fontSize: 13, color: "#64748b", margin: "4px 0 0" }}>as of {asOf}</p>}
          </div>
        </div>

        {/* breadth strip */}
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center", padding: "12px 0 10px", marginTop: 8, marginBottom: 4, borderBottom: "1px solid rgba(255,255,255,.04)" }}>
          <span style={{ fontFamily: FONT_MONO, fontSize: 13 }}>
            <span style={{ color: "#34d399" }}>HIGH {breadth.buys}</span>
            <span style={{ color: "#94a3b8" }}> · </span>
            <span style={{ color: "#8896ac" }}>MOD {breadth.holds}</span>
            <span style={{ color: "#94a3b8" }}> · </span>
            <span style={{ color: "#8896ac" }}>LOW {breadth.sells}</span>
            <span style={{ color: "#94a3b8" }}> · </span>
            <span style={{ color: "#34d399" }}>💎 {breadth.gems}</span>
            <span style={{ color: "#94a3b8" }}> · </span>
            <span style={{ color: "#94a3b8" }}>UNIV {breadth.univ}</span>
          </span>
        </div>

        {/* hero: today at a glance + conviction moves */}
        <Hero
          movers={movers}
          regime={macro?.regime || regime?.label || "NEUTRAL"}
          fallback={[...rows].filter((r) => r.action === "BUY").sort((a, b) => b.score - a.score)}
        />

        {/* macro banner (full) — falls back to the simple regime strip */}
        {macro ? (
          <MacroBanner m={macro} />
        ) : regime ? (
          <div style={{ marginTop: 14, borderRadius: 14, border: "1px solid rgba(255,255,255,.08)", background: "rgba(13,14,22,.5)", padding: "16px 20px", display: "flex", flexWrap: "wrap", alignItems: "center", gap: "8px 32px" }}>
            <RegimeCell label="REGIME" value={regime.label.replace(/_/g, " ")} valColor={regimeTone(regime.label)} big />
            {regime.vix != null && <RegimeCell label="VIX" value={regime.vix.toFixed(1)} />}
            {regime.event && <RegimeCell label="EVENT" value={regime.event} />}
          </div>
        ) : null}

        {/* tabs */}
        <div style={{ display: "flex", gap: 4, marginTop: 22, borderBottom: "1px solid rgba(255,255,255,.08)" }}>
          {([["top10", "⭐ TOP 10 SIGNALS"], ["full", "🔍 FULL UNIVERSE"], ["sector", "📈 SECTOR BREAKDOWN"]] as [Tab, string][]).map(([id, lbl]) => (
            <button key={id} onClick={() => setTab(id)} style={{
              fontFamily: FONT_DISPLAY, fontSize: 13, fontWeight: 700, letterSpacing: ".04em",
              padding: "10px 16px", background: "transparent", border: "none", cursor: "pointer",
              color: tab === id ? "#e8edf4" : "#7e8aa0",
              borderBottom: tab === id ? "2px solid #d4a843" : "2px solid transparent", marginBottom: -1,
            }}>{lbl}</button>
          ))}
        </div>

        <div style={{ marginTop: 18 }}>
          {tab === "top10" && <Top10 rows={rows} gemSet={gemSet} pctRank={pctRank} watched={watched} onToggleWatch={toggleWatch} />}
          {tab === "full" && (
            <FullUniverse
              rows={rows} gemSet={gemSet} pctRank={pctRank} plan={plan}
              sectors={sectors} fSec={fSec} setFSec={setFSec}
              fConv={fConv} setFConv={setFConv} fMin={fMin} setFMin={setFMin}
              watched={watched} onToggleWatch={toggleWatch}
            />
          )}
          {tab === "sector" && <SectorBreakdown rows={rows} />}
        </div>

        <p style={{ marginTop: 28, fontSize: 11, color: "#5b6677", lineHeight: 1.6, maxWidth: 680 }}>
          Research and factor-analysis output, not investment advice. Conviction reflects the macro-adjusted
          composite (HIGH ≥ 60 · MODERATE ≥ 45 · LOW &lt; 45). ◆ CHEAP = high conviction trading low in its
          valuation range; ◆ RICH = low conviction trading high. 💎 marks hidden gems.
        </p>
      </div>
    </div>
  );
}

function regimeTone(label: string): string {
  const l = (label || "").toUpperCase();
  if (l.includes("RISK_ON") || l.includes("BULLISH")) return "#34d399";
  if (l.includes("RISK_OFF") || l.includes("VOLATIL")) return "#f87171";
  return "#cbd5e1";
}

function RegimeCell({ label, value, valColor, big }: { label: string; value: string; valColor?: string; big?: boolean }) {
  return (
    <div style={{ minWidth: 0 }}>
      <p style={{ fontFamily: FONT_MONO, fontSize: 11, letterSpacing: ".15em", color: "#64748b", margin: 0 }}>{label}</p>
      <p style={{ fontFamily: big ? FONT_DISPLAY : FONT_MONO, fontWeight: big ? 700 : 400, fontSize: big ? 18 : 17, color: valColor || "#e2e8f0", margin: "2px 0 0" }}>{value}</p>
    </div>
  );
}

// TAB 1: TOP 10
function Top10({ rows, gemSet, pctRank, watched, onToggleWatch }: { rows: Row[]; gemSet: Set<string>; pctRank: (s: number) => number; watched: Set<string>; onToggleWatch: (t: string) => void }) {
  const buys = rows.filter((r) => r.action === "BUY").sort((a, b) => blendBuy(b) - blendBuy(a)).slice(0, 10);
  const sells = rows.filter((r) => r.action === "SELL").sort((a, b) => blendSell(a) - blendSell(b)).slice(0, 10);

  return (
    <>
      <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.6, margin: "2px 0 14px" }}>
        Ranked by conviction, tilted toward where price sits in each stock&apos;s valuation range — so high-conviction
        names trading <span style={{ color: "#34d399" }}>cheap</span> rise to the top.{" "}
        <span style={{ color: "#34d399", fontWeight: 700 }}>◆ CHEAP</span> flags high conviction + low in range;{" "}
        <span style={{ color: "#f87171", fontWeight: 700 }}>◆ RICH</span> flags low conviction + high in range.
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", gap: 20 }}>
        <div>
          <div style={{ fontFamily: FONT_MONO, fontSize: 13, color: "#34d399", letterSpacing: ".12em", margin: "0 0 6px", paddingBottom: 4, borderBottom: "1px solid rgba(255,255,255,.05)" }}>▲ HIGH CONVICTION</div>
          {buys.map((r) => <FactorCard key={r.ticker} r={r} isGem={gemSet.has(r.ticker)} pctRank={pctRank(r.score)} callout={valueCallout(r)} isWatched={watched.has(r.ticker)} onToggleWatch={onToggleWatch} detailHref={`/stock/${r.ticker}`} />)}
          {buys.length === 0 && <Empty />}
        </div>
        <div>
          <div style={{ fontFamily: FONT_MONO, fontSize: 13, color: "#f87171", letterSpacing: ".12em", margin: "0 0 6px", paddingBottom: 4, borderBottom: "1px solid rgba(255,255,255,.05)" }}>▼ LOW CONVICTION</div>
          {sells.map((r) => <FactorCard key={r.ticker} r={r} isGem={gemSet.has(r.ticker)} pctRank={pctRank(r.score)} callout={valueCallout(r)} isWatched={watched.has(r.ticker)} onToggleWatch={onToggleWatch} detailHref={`/stock/${r.ticker}`} />)}
          {sells.length === 0 && <Empty />}
        </div>
      </div>
    </>
  );
}

// TAB 2: FULL UNIVERSE
function FullUniverse(props: {
  rows: Row[]; gemSet: Set<string>; pctRank: (s: number) => number; plan: string;
  sectors: string[]; fSec: string; setFSec: (v: string) => void;
  fConv: string; setFConv: (v: string) => void; fMin: string; setFMin: (v: string) => void;
  watched: Set<string>; onToggleWatch: (t: string) => void;
}) {
  const { rows, gemSet, pctRank, plan, sectors, fSec, setFSec, fConv, setFConv, fMin, setFMin, watched, onToggleWatch } = props;

  let filtered = rows;
  if (fSec !== "All") filtered = filtered.filter((r) => r.sector === fSec);
  if (fConv !== "All") filtered = filtered.filter((r) => r.action === CONV_ACTION[fConv]);
  if (fMin !== "All") { const m = parseInt(fMin); filtered = filtered.filter((r) => r.score >= m); }

  const FREE_LIMIT = 50, RENDER_LIMIT = 200;
  const totalFiltered = filtered.length;
  const isFree = plan !== "pro" && plan !== "institutional";
  const showGate = isFree && totalFiltered > FREE_LIMIT;
  let shown = filtered;
  let showRenderCap = false;
  if (showGate) shown = filtered.slice(0, FREE_LIMIT);
  else if (filtered.length > RENDER_LIMIT) { shown = filtered.slice(0, RENDER_LIMIT); showRenderCap = true; }

  const selStyle = { background: "rgba(13,14,22,.8)", border: "1px solid rgba(255,255,255,.1)", borderRadius: 8, padding: "8px 10px", fontSize: 13, color: "#e2e8f0", fontFamily: "inherit" } as const;

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 10 }}>
        <Labeled label="Sector"><select value={fSec} onChange={(e) => setFSec(e.target.value)} style={selStyle}>{sectors.map((s) => <option key={s} value={s}>{s}</option>)}</select></Labeled>
        <Labeled label="Conviction"><select value={fConv} onChange={(e) => setFConv(e.target.value)} style={selStyle}>{CONV_OPTS.map((s) => <option key={s} value={s}>{s}</option>)}</select></Labeled>
        <Labeled label="Min Score"><select value={fMin} onChange={(e) => setFMin(e.target.value)} style={selStyle}>{MIN_OPTS.map((s) => <option key={s} value={s}>{s}</option>)}</select></Labeled>
      </div>

      <div style={{ fontFamily: FONT_MONO, fontSize: 13, color: "#9fabc0", letterSpacing: ".1em", margin: "16px 0 12px" }}>
        {shown.length} STOCKS · 💎 = HIDDEN GEM
        {showGate ? ` · Showing ${FREE_LIMIT} of ${totalFiltered}` : showRenderCap ? ` · Showing ${RENDER_LIMIT} of ${totalFiltered} — filter to see all` : ""}
      </div>

      {shown.map((r) => <FactorCard key={r.ticker} r={r} isGem={gemSet.has(r.ticker)} pctRank={pctRank(r.score)} callout={null} isWatched={watched.has(r.ticker)} onToggleWatch={onToggleWatch} detailHref={`/stock/${r.ticker}`} />)}
      {shown.length === 0 && <Empty />}

      {showGate && (
        <div style={{ background: "rgba(212,168,67,.06)", border: "1px solid rgba(212,168,67,.2)", borderRadius: 10, padding: 24, textAlign: "center", marginTop: 16 }}>
          <div style={{ fontFamily: FONT_DISPLAY, fontSize: 16, fontWeight: 700, color: "#d4a843", marginBottom: 8 }}>🔒 {totalFiltered - FREE_LIMIT} more stocks available on Pro</div>
          <div style={{ fontSize: 13, color: "#b3bed0" }}>Free accounts see the top {FREE_LIMIT} signals. Upgrade for the full {totalFiltered}-stock view, Hidden Gems, alerts, and unlimited portfolio tracking.</div>
        </div>
      )}
    </>
  );
}

// TAB 3: SECTOR BREAKDOWN
function SectorBreakdown({ rows }: { rows: Row[] }) {
  const counts: Record<string, { BUY: number; HOLD: number; SELL: number }> = {};
  for (const r of rows) {
    const sec = r.sector || "Other";
    if (!counts[sec]) counts[sec] = { BUY: 0, HOLD: 0, SELL: 0 };
    counts[sec][r.action]++;
  }
  const entries = Object.entries(counts).sort(([a], [b]) => a.localeCompare(b));

  return (
    <>
      <div style={{ fontFamily: FONT_MONO, fontSize: 13, color: "#b3bed0", letterSpacing: ".1em", margin: "4px 0 14px" }}>SIGNAL BREAKDOWN BY SECTOR</div>
      {entries.map(([sec, c]) => {
        const total = c.BUY + c.HOLD + c.SELL || 1;
        const bp = (c.BUY / total) * 100, hp = (c.HOLD / total) * 100, sp = (c.SELL / total) * 100;
        return (
          <div key={sec} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 7 }}>
            <div style={{ fontSize: 13, color: "#9fabc0", width: 170, flexShrink: 0 }}>{sec}</div>
            <div style={{ flex: 1, display: "flex", borderRadius: 4, overflow: "hidden", height: 20 }}>
              <div style={{ width: `${bp}%`, background: "rgba(52,211,153,.6)" }} />
              <div style={{ width: `${hp}%`, background: "rgba(251,191,36,.4)" }} />
              <div style={{ width: `${sp}%`, background: "rgba(248,113,113,.5)" }} />
            </div>
            <div style={{ fontSize: 14, color: "#b3bed0", width: 150, flexShrink: 0 }}>
              <span style={{ color: "#34d399" }}>{c.BUY} HIGH</span>{" "}
              <span style={{ color: "#fbbf24" }}>{c.HOLD} MOD</span>{" "}
              <span style={{ color: "#f87171" }}>{c.SELL} LOW</span>
            </div>
          </div>
        );
      })}
    </>
  );
}

function Labeled({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <span style={{ fontSize: 12, color: "#8896ac" }}>{label}</span>
      {children}
    </div>
  );
}
function Empty() {
  return <div style={{ padding: "24px 0", color: "#64748b", fontFamily: FONT_MONO, fontSize: 13 }}>No names match.</div>;
}
