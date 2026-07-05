"use client";

import { useEffect, useMemo, useState } from "react";
import NavBar from "../screener/NavBar";
import FactorCard from "../screener/FactorCard";
import { Row, pctRankFn, FONT_DISPLAY, FONT_MONO } from "../screener/lib";
import UntrackedNotice from "../UntrackedNotice";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "https://qntm-api.onrender.com";
const LOGIN_URL = process.env.NEXT_PUBLIC_LOGIN_URL || "/login";

type WItem = Row & { price_at_add: number | null; added_at: string | null; change_pct: number | null };

export default function Watchlist() {
  const [items, setItems] = useState<WItem[]>([]);
  const [univScores, setUnivScores] = useState<number[]>([]);
  const [uid, setUid] = useState("");
  const [plan, setPlan] = useState("free");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addInput, setAddInput] = useState("");
  const [adding, setAdding] = useState(false);
  const [addMsg, setAddMsg] = useState<string | null>(null);

  async function loadList() {
    const r = await fetch("/api/watchlist");
    if (r.status === 401) { window.location.href = LOGIN_URL; return; }
    const d = await r.json().catch(() => ({}));
    setItems(d.items || []);
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
        const [, scr] = await Promise.all([loadList(), scrP]);
        if (scr?.rows) setUnivScores(scr.rows.map((x: Row) => x.score));
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Could not load your watchlist.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const pctRank = useMemo(() => pctRankFn(univScores), [univScores]);

  async function signOut() {
    try { await fetch("/api/session", { method: "DELETE" }); } catch {}
    window.location.href = LOGIN_URL;
  }

  async function addTicker() {
    const tk = addInput.trim().toUpperCase();
    if (!tk) return;
    setAdding(true);
    setAddMsg(null);
    try {
      const r = await fetch("/api/watchlist", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ticker: tk }) });
      if (r.ok) { setAddInput(""); await loadList(); }
      else setAddMsg(`Couldn't add ${tk} — not a recognized ticker in the universe.`);
    } catch {
      setAddMsg("Add failed — try again.");
    } finally {
      setAdding(false);
    }
  }

  async function remove(ticker: string) {
    setItems((prev) => prev.filter((i) => i.ticker !== ticker));
    try { await fetch(`/api/watchlist/${encodeURIComponent(ticker)}`, { method: "DELETE" }); }
    catch { await loadList(); }
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-bg,#060709)", color: "#cbd5e1" }}>
      <NavBar uid={uid} plan={plan} active="watchlist" onSignOut={signOut} />
      <div style={{ maxWidth: 1440, margin: "0 auto", padding: "28px 24px 60px" }}>
        <p style={{ fontFamily: FONT_MONO, fontSize: 13, letterSpacing: ".2em", color: "#d4a843", margin: 0 }}>★ WATCHLIST</p>
        <h1 style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 30, color: "#fff", margin: "8px 0 0" }}>
          {loading ? "Loading…" : `${items.length} name${items.length === 1 ? "" : "s"} tracked`}
        </h1>
        <p style={{ fontFamily: FONT_MONO, fontSize: 13, color: "#64748b", margin: "4px 0 0" }}>Conviction scores update daily · change shown since you added</p>

        <UntrackedNotice items={items} kind="watchlist" onRemoved={(tk) => setItems((prev) => prev.filter((i) => i.ticker !== tk))} />

        {/* add box */}
        <div style={{ display: "flex", gap: 8, marginTop: 18, flexWrap: "wrap", alignItems: "center" }}>
          <input
            value={addInput}
            onChange={(e) => setAddInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") addTicker(); }}
            placeholder="Add ticker (e.g. NVDA)"
            style={{ background: "rgba(13,14,22,.8)", border: "1px solid rgba(255,255,255,.1)", borderRadius: 8, padding: "9px 12px", fontSize: 14, color: "#e2e8f0", width: 200, fontFamily: FONT_MONO, letterSpacing: ".04em" }}
          />
          <button
            onClick={addTicker}
            disabled={adding || !addInput.trim()}
            style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 13, letterSpacing: ".04em", color: "#0b0c10", background: "#d4a843", border: "none", borderRadius: 8, padding: "9px 18px", cursor: adding || !addInput.trim() ? "default" : "pointer", opacity: adding || !addInput.trim() ? 0.5 : 1 }}
          >
            {adding ? "ADDING…" : "ADD"}
          </button>
          {addMsg && <span style={{ fontSize: 13, color: "#f87171" }}>{addMsg}</span>}
        </div>

        {/* list */}
        <div style={{ marginTop: 22 }}>
          {loading ? (
            <div style={{ color: "#64748b", fontFamily: FONT_MONO, fontSize: 13, padding: "40px 0" }}>Loading your watchlist…</div>
          ) : error ? (
            <div style={{ color: "#f87171", fontFamily: FONT_MONO, fontSize: 13, padding: "40px 0" }}>{error}</div>
          ) : items.length === 0 ? (
            <div style={{ border: "1px dashed rgba(255,255,255,.12)", borderRadius: 12, padding: "48px 24px", textAlign: "center" }}>
              <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 18, color: "#cbd5e1" }}>No names yet</div>
              <div style={{ fontSize: 14, color: "#8896ac", marginTop: 6 }}>
                Add a ticker above, or tap the ☆ on any card in the{" "}
                <a href="/screener" style={{ color: "#d4a843", textDecoration: "none" }}>screener</a>.
              </div>
            </div>
          ) : (
            items.map((it) => (
              <div key={it.ticker}>
                <FactorCard r={it} isGem={it.is_hidden_gem} pctRank={pctRank(it.score)} callout={null} isWatched onToggleWatch={remove} />
                {(it.price_at_add != null || it.added_at) && (
                  <div style={{ fontFamily: FONT_MONO, fontSize: 12, color: "#6b7686", margin: "-2px 0 10px 3px" }}>
                    {it.added_at ? `Added ${it.added_at}` : "Added"}
                    {it.price_at_add != null ? ` @ $${it.price_at_add.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : ""}
                    {it.change_pct != null && (
                      <span style={{ color: it.change_pct >= 0 ? "#34d399" : "#f87171", marginLeft: 8 }}>
                        {it.change_pct >= 0 ? "▲" : "▼"} {Math.abs(it.change_pct).toFixed(2)}% since add
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
