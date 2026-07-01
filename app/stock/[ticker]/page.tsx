"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import NavBar from "../../screener/NavBar";
import FactorCard from "../../screener/FactorCard";
import { Row, valueCallout, FONT_DISPLAY, FONT_MONO } from "../../screener/lib";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "https://qntm-api.onrender.com";
const LOGIN_URL = process.env.NEXT_PUBLIC_LOGIN_URL || "https://app.qntm.live";

type Changes = {
  prev_date: string | null;
  prev_score: number | null;
  now_score: number | null;
  pillars: { key: string; label: string; delta: number }[];
  macro_delta: number | null;
  macro_unchanged: boolean;
};
type Stock = Row & { pct_rank: number; changes: Changes | null };

export default function StockDetail() {
  const params = useParams();
  const ticker = String(params?.ticker || "").toUpperCase();
  const [data, setData] = useState<Stock | null>(null);
  const [uid, setUid] = useState("");
  const [plan, setPlan] = useState("free");
  const [watched, setWatched] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setNotFound(false);
      try {
        const me = await fetch("/api/me").then((r) => r.json()).catch(() => ({ plan: "free" }));
        setUid(me?.user_id || "");
        setPlan(me?.plan || "free");
        const r = await fetch(`${API_BASE}/api/stock/${encodeURIComponent(ticker)}`, { cache: "no-store" });
        if (r.status === 404) { setNotFound(true); setData(null); }
        else if (r.ok) setData(await r.json());
        fetch("/api/watchlist").then((x) => (x.ok ? x.json() : null)).then((d) => {
          if (d?.items) setWatched(d.items.some((i: { ticker: string }) => i.ticker === ticker));
        }).catch(() => {});
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    })();
  }, [ticker]);

  async function signOut() {
    try { await fetch("/api/session", { method: "DELETE" }); } catch {}
    window.location.href = LOGIN_URL;
  }

  async function toggleWatch(tk: string) {
    const has = watched;
    setWatched(!has);
    try {
      if (has) await fetch(`/api/watchlist/${encodeURIComponent(tk)}`, { method: "DELETE" });
      else await fetch("/api/watchlist", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ticker: tk }) });
    } catch {
      setWatched(has);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-bg,#060709)", color: "#cbd5e1" }}>
      <NavBar uid={uid} plan={plan} active="" onSignOut={signOut} />
      <div style={{ maxWidth: 820, margin: "0 auto", padding: "22px 24px 60px" }}>
        <a href="/screener" style={{ fontFamily: FONT_MONO, fontSize: 12, color: "#8896ac", textDecoration: "none" }}>‹ Back to screener</a>
        {loading ? (
          <div style={{ color: "#64748b", fontFamily: FONT_MONO, fontSize: 13, padding: "60px 0" }}>Loading {ticker}…</div>
        ) : notFound || !data ? (
          <div style={{ border: "1px solid rgba(255,255,255,.08)", borderRadius: 10, padding: "28px", marginTop: 16 }}>
            <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 18, color: "#b3bed0" }}>&ldquo;{ticker}&rdquo; not scored</div>
            <div style={{ fontSize: 14, color: "#8896ac", marginTop: 6 }}>
              This ticker isn&apos;t in the current scored universe. Try a name from the{" "}
              <a href="/screener" style={{ color: "#d4a843", textDecoration: "none" }}>screener</a>.
            </div>
          </div>
        ) : (
          <div style={{ marginTop: 14 }}>
            <FactorCard r={data} isGem={data.is_hidden_gem} pctRank={data.pct_rank} callout={valueCallout(data)} isWatched={watched} onToggleWatch={toggleWatch} defaultOpen />
            {data.changes && <WhatsChanged c={data.changes} />}
          </div>
        )}
      </div>
    </div>
  );
}

function WhatsChanged({ c }: { c: Changes }) {
  const scoreMoved = c.prev_score != null && c.now_score != null && c.prev_score !== c.now_score;
  const hasMoves = c.pillars.length > 0 || c.macro_delta != null || scoreMoved;
  return (
    <div style={{ marginTop: 12, padding: "14px 16px", background: "rgba(255,255,255,.02)", borderRadius: 8, borderLeft: "2px solid rgba(255,255,255,.1)" }}>
      <div style={{ fontFamily: FONT_MONO, fontSize: 12, letterSpacing: ".08em", color: "#8896ac", marginBottom: hasMoves ? 10 : 0 }}>
        WHAT&apos;S CHANGED {c.prev_date && <span style={{ color: "#6b7686" }}>· since {c.prev_date}</span>}
      </div>
      {hasMoves ? (
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "6px 16px" }}>
          {c.pillars.map((p) => (
            <span key={p.key} style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
              <span style={{ fontSize: 13, color: "#b3bed0" }}>{p.label}</span>
              <span style={{ fontFamily: FONT_MONO, fontSize: 13, color: p.delta > 0 ? "#34d399" : "#f87171" }}>{p.delta > 0 ? "▲" : "▼"}{Math.abs(p.delta)}</span>
            </span>
          ))}
          {c.macro_delta != null ? (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
              <span style={{ fontSize: 13, color: "#b3bed0" }}>Macro overlay</span>
              <span style={{ fontFamily: FONT_MONO, fontSize: 13, color: c.macro_delta > 0 ? "#34d399" : "#f97316" }}>{c.macro_delta > 0 ? "▲" : "▼"}{Math.abs(c.macro_delta)}</span>
            </span>
          ) : c.macro_unchanged ? (
            <span style={{ fontSize: 13, color: "#6b7686" }}>Macro overlay unchanged</span>
          ) : null}
          {scoreMoved && (
            <span style={{ fontFamily: FONT_MONO, fontSize: 13, color: "#8896ac" }}>
              Score {c.prev_score}→<span style={{ color: (c.now_score as number) > (c.prev_score as number) ? "#34d399" : "#f87171", fontWeight: 600 }}>{c.now_score}</span>
            </span>
          )}
        </div>
      ) : (
        <span style={{ fontSize: 13, color: "#8896ac" }}>No material model change since the prior scored day.</span>
      )}
    </div>
  );
}
