"use client";

import { useEffect, useMemo, useState } from "react";
import NavBar from "../screener/NavBar";
import { Row, searchUniverse, companyName, FONT_DISPLAY, FONT_MONO } from "../screener/lib";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "https://qntm-api.onrender.com";
const LOGIN_URL = process.env.NEXT_PUBLIC_LOGIN_URL || "/login";

type Notif = { id: string; ticker: string | null; notification_type: string | null; title: string | null; body: string | null; is_read: boolean; created_at: string | null };
type Alert = { id: string; ticker: string | null; kind: string | null; kind_label: string | null; threshold: number | null; scope: string | null; active: boolean; armed: boolean; created_at: string | null };
type AlertsResp = { locked: boolean; unread: number; notifications: Notif[]; alerts: Alert[] };

const KINDS = [
  { key: "value_lower", label: "Enters lower value range" },
  { key: "value_upper", label: "Enters upper value range" },
  { key: "price_below", label: "Price drops to / below" },
  { key: "price_above", label: "Price rises to / above" },
  { key: "conviction_high", label: "Moves to HIGH conviction" },
  { key: "conviction_low", label: "Drops to LOW conviction" },
  { key: "gem", label: "Flagged a hidden gem" },
];
const SCOPES = [
  { key: "ticker", label: "This ticker" },
  { key: "watchlist", label: "Any stock on my watchlist" },
  { key: "portfolio", label: "Any stock in my portfolio" },
  { key: "model", label: "Any stock in the model portfolio" },
];
const PRESETS = [
  { label: "🟢  A watchlist stock gets cheap", scope: "watchlist", kind: "value_lower", threshold: 20 },
  { label: "📉  A holding drops to LOW conviction", scope: "portfolio", kind: "conviction_low", threshold: null },
  { label: "📈  A watchlist stock hits HIGH conviction", scope: "watchlist", kind: "conviction_high", threshold: null },
  { label: "💎  A model name becomes a hidden gem", scope: "model", kind: "gem", threshold: null },
];
const FILTERS = ["All", "HIGH", "LOW", "Macro", "Gems"];
const PRICE_KINDS = new Set(["price_below", "price_above"]);
const VALUE_KINDS = new Set(["value_lower", "value_upper"]);

const scopeLabel = (s: string | null) => SCOPES.find((x) => x.key === s)?.label || s || "";
const timeAgo = (iso: string | null) => {
  if (!iso) return "";
  const d = new Date(iso); if (isNaN(d.getTime())) return "";
  const m = Math.floor((Date.now() - d.getTime()) / 60000);
  if (m < 1) return "just now"; if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

export default function Alerts() {
  const [data, setData] = useState<AlertsResp | null>(null);
  const [univRows, setUnivRows] = useState<Row[]>([]);
  const [uid, setUid] = useState(""); const [plan, setPlan] = useState("free");
  const [loading, setLoading] = useState(true); const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("All");
  const [busy, setBusy] = useState(false);

  // create form
  const [scope, setScope] = useState("ticker");
  const [query, setQuery] = useState(""); const [picked, setPicked] = useState(""); const [showSug, setShowSug] = useState(false);
  const [kind, setKind] = useState("value_lower");
  const [threshold, setThreshold] = useState<string>("20");
  const [msg, setMsg] = useState<string | null>(null);

  async function loadAlerts() {
    const r = await fetch("/api/alerts", { cache: "no-store" });
    if (r.status === 401) { window.location.href = LOGIN_URL; return; }
    setData(await r.json().catch(() => null));
  }

  useEffect(() => {
    (async () => {
      setLoading(true); setError(null);
      try {
        const me = await fetch("/api/me").then((r) => r.json()).catch(() => ({ plan: "free" }));
        setUid(me?.user_id || ""); setPlan(me?.plan || "free");
        const scrP = fetch(`${API_BASE}/api/screener?limit=2000`, { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)).catch(() => null);
        const [, scr] = await Promise.all([loadAlerts(), scrP]);
        if (scr?.rows) setUnivRows(scr.rows);
      } catch { setError("Could not load alerts."); }
      finally { setLoading(false); }
    })();
  }, []);

  async function signOut() { try { await fetch("/api/session", { method: "DELETE" }); } catch {} window.location.href = LOGIN_URL; }

  const tickers = useMemo(() => univRows.map((r) => r.ticker), [univRows]);
  const suggestions = useMemo(() => (showSug && query.trim() && !picked ? searchUniverse(query, tickers) : []), [showSug, query, picked, tickers]);
  const locked = data ? data.locked : false;
  const notifs = data?.notifications || [];
  const alerts = data?.alerts || [];

  // kinds available for the chosen scope (collections can't use price triggers)
  const kindOptions = useMemo(() => (scope === "ticker" ? KINDS : KINDS.filter((k) => !PRICE_KINDS.has(k.key))), [scope]);
  useEffect(() => { if (!kindOptions.find((k) => k.key === kind)) setKind(kindOptions[0].key); }, [kindOptions, kind]);
  useEffect(() => { setThreshold(kind === "value_upper" ? "80" : VALUE_KINDS.has(kind) ? "20" : ""); }, [kind]);

  const filteredNotifs = useMemo(() => {
    if (filter === "All") return notifs;
    const want = filter.toLowerCase();
    return notifs.filter((n) => {
      const t = (n.notification_type || "").toLowerCase();
      if (want === "high") return t.includes("high");
      if (want === "low") return t.includes("low");
      if (want === "macro") return t.includes("macro") || t.includes("regime");
      if (want === "gems") return t.includes("gem");
      return true;
    });
  }, [notifs, filter]);

  async function createAlert(body: { ticker: string | null; kind: string; threshold: number | null; scope: string }) {
    setBusy(true); setMsg(null);
    try {
      const r = await fetch("/api/alerts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (r.ok) { setQuery(""); setPicked(""); await loadAlerts(); }
      else { const d = await r.json().catch(() => ({})); setMsg(prettyErr(d?.detail)); }
    } catch { setMsg("Couldn't create that alert."); }
    finally { setBusy(false); }
  }
  function prettyErr(code?: string) {
    return ({ invalid_ticker: "Pick a valid ticker.", invalid_kind: "Choose a trigger.", price_not_for_collections: "Price triggers only work on a single ticker.", pro_required: "Alerts are a Pro feature." } as Record<string, string>)[code || ""] || "Couldn't create that alert.";
  }
  async function submitCreate() {
    if (scope === "ticker" && !(picked || tickers.includes(query.trim().toUpperCase()))) { setMsg("Pick a ticker for a single-ticker alert."); return; }
    const th = (VALUE_KINDS.has(kind) || PRICE_KINDS.has(kind)) && threshold !== "" ? parseFloat(threshold) : null;
    await createAlert({ ticker: scope === "ticker" ? (picked || query.trim().toUpperCase()) : null, kind, threshold: th, scope });
  }
  async function removeAlert(id: string) { setAlertsOptimistic(id); try { await fetch(`/api/alerts/${id}`, { method: "DELETE" }); await loadAlerts(); } catch { await loadAlerts(); } }
  function setAlertsOptimistic(id: string) { setData((d) => (d ? { ...d, alerts: d.alerts.filter((a) => a.id !== id) } : d)); }
  async function toggleActive(a: Alert) {
    setData((d) => (d ? { ...d, alerts: d.alerts.map((x) => (x.id === a.id ? { ...x, active: !x.active } : x)) } : d));
    try { await fetch(`/api/alerts/${a.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ active: !a.active }) }); await loadAlerts(); } catch { await loadAlerts(); }
  }
  async function markRead() { setData((d) => (d ? { ...d, unread: 0, notifications: d.notifications.map((n) => ({ ...n, is_read: true })) } : d)); try { await fetch("/api/alerts/read", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) }); await loadAlerts(); } catch { await loadAlerts(); } }

  const presetExists = (p: typeof PRESETS[number]) => alerts.some((a) => a.scope === p.scope && a.kind === p.kind);
  const input = { background: "rgba(13,14,22,.8)", border: "1px solid rgba(255,255,255,.1)", borderRadius: 8, padding: "9px 12px", fontSize: 14, color: "#e2e8f0", fontFamily: FONT_MONO } as const;

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-bg,#060709)", color: "#cbd5e1" }}>
      <NavBar uid={uid} plan={plan} active="alerts" onSignOut={signOut} />
      <div style={{ maxWidth: 1440, margin: "0 auto", padding: "28px 24px 60px" }}>
        <p style={{ fontFamily: FONT_MONO, fontSize: 13, letterSpacing: ".2em", color: "#d4a843", margin: 0 }}>🔔 ALERTS</p>
        <h1 style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 30, color: "#fff", margin: "8px 0 0" }}>Signal &amp; price alerts</h1>
        <p style={{ fontFamily: FONT_MONO, fontSize: 13, color: "#64748b", margin: "4px 0 0" }}>Price, valuation-range, and conviction alerts on any stock — or your whole watchlist, portfolio, or the model. Delivered in-app and by email.</p>

        {loading ? (
          <div style={{ color: "#64748b", fontFamily: FONT_MONO, fontSize: 13, padding: "48px 0" }}>Loading alerts…</div>
        ) : error ? (
          <div style={{ color: "#f87171", fontFamily: FONT_MONO, fontSize: 13, padding: "48px 0" }}>{error}</div>
        ) : locked ? (
          <div style={{ marginTop: 24, background: "rgba(212,168,67,.05)", border: "1px solid rgba(212,168,67,.22)", borderRadius: 12, padding: "32px 28px", textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 14 }}>🔔</div>
            <div style={{ fontFamily: FONT_DISPLAY, fontSize: 22, fontWeight: 800, color: "#d4a843", marginBottom: 10 }}>Pro Feature — Signal Alerts</div>
            <div style={{ color: "#9fabc0", maxWidth: 520, margin: "0 auto", lineHeight: 1.8, fontSize: 14 }}>
              Get notified the moment the model issues a conviction change on any of your holdings. Macro regime shifts, hidden-gem flags, and the weekly recap included.
            </div>
            <a href={`${LOGIN_URL}/?qnav=account&uid=${encodeURIComponent(uid)}&plan=${encodeURIComponent(plan)}&ck=1`}
              style={{ display: "inline-block", marginTop: 22, fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 14, letterSpacing: ".03em", color: "#0b0c10", background: "#d4a843", borderRadius: 10, padding: "12px 26px", textDecoration: "none" }}>
              Unlock Alerts — Upgrade to Pro
            </a>
          </div>
        ) : (
          <>
            {/* notifications feed */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10, margin: "22px 0 10px" }}>
              <div style={{ fontFamily: FONT_MONO, fontSize: 13, color: "#b3bed0" }}>
                {notifs.length} notification{notifs.length === 1 ? "" : "s"}{data && data.unread > 0 && <span style={{ color: "#34d399" }}> · {data.unread} unread</span>}
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                {FILTERS.map((f) => (
                  <button key={f} onClick={() => setFilter(f)} style={{ fontFamily: FONT_MONO, fontSize: 11.5, padding: "5px 10px", borderRadius: 6, border: "none", cursor: "pointer", background: filter === f ? "rgba(212,168,67,.18)" : "transparent", color: filter === f ? "#f0c668" : "#9fabc0" }}>{f}</button>
                ))}
                {data && data.unread > 0 && <button onClick={markRead} style={{ fontFamily: FONT_MONO, fontSize: 11.5, padding: "5px 12px", borderRadius: 6, border: "1px solid rgba(52,211,153,.3)", cursor: "pointer", background: "rgba(52,211,153,.08)", color: "#34d399" }}>✓ Mark read</button>}
              </div>
            </div>
            <div style={{ border: "1px solid rgba(255,255,255,.07)", borderRadius: 12, overflow: "hidden" }}>
              {filteredNotifs.length === 0 ? (
                <div style={{ padding: "36px 16px", textAlign: "center", color: "#8896ac", fontFamily: FONT_MONO, fontSize: 13 }}>{notifs.length === 0 ? "No notifications yet — set an alert below and the model will ping you here." : "Nothing in this filter."}</div>
              ) : (
                filteredNotifs.map((n, i) => (
                  <div key={n.id || i} style={{ display: "flex", gap: 12, padding: "12px 16px", borderTop: i ? "1px solid rgba(255,255,255,.05)" : "none", background: n.is_read ? "transparent" : "rgba(52,211,153,.04)" }}>
                    <span style={{ width: 6, flexShrink: 0, display: "flex", alignItems: "flex-start", paddingTop: 5 }}>{!n.is_read && <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#34d399", display: "inline-block" }} />}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                        <span style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 14, color: "#e7ecf3" }}>{n.ticker ? `${n.ticker} · ` : ""}{n.title || ""}</span>
                        <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: "#64748b", flexShrink: 0 }}>{timeAgo(n.created_at)}</span>
                      </div>
                      {n.body && <div style={{ fontFamily: FONT_MONO, fontSize: 12, color: "#8896ac", marginTop: 3, lineHeight: 1.5 }}>{n.body}</div>}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* my alerts */}
            <h2 style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 20, color: "#fff", margin: "32px 0 4px" }}>My alerts</h2>
            <p style={{ fontFamily: FONT_MONO, fontSize: 12.5, color: "#8896ac", margin: "0 0 12px", lineHeight: 1.6 }}>Each alert re-arms after it fires, so you won&apos;t get the same ping twice in a row.</p>

            {/* presets */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 8, marginBottom: 14 }}>
              {PRESETS.map((p) => {
                const exists = presetExists(p);
                return (
                  <button key={p.label} disabled={exists || busy} onClick={() => createAlert({ ticker: null, kind: p.kind, threshold: p.threshold, scope: p.scope })}
                    style={{ textAlign: "left", fontFamily: FONT_MONO, fontSize: 12.5, padding: "11px 14px", borderRadius: 8, cursor: exists ? "default" : "pointer",
                      background: exists ? "rgba(52,211,153,.06)" : "rgba(255,255,255,.03)", border: `1px solid ${exists ? "rgba(52,211,153,.3)" : "rgba(255,255,255,.09)"}`, color: exists ? "#34d399" : "#cbd5e1" }}>
                    {exists ? "✓ " : ""}{p.label}
                  </button>
                );
              })}
            </div>

            {/* create form */}
            <div style={{ background: "rgba(255,255,255,.02)", border: "1px solid rgba(255,255,255,.07)", borderRadius: 12, padding: "16px 18px", marginBottom: 18 }}>
              <div style={{ fontFamily: FONT_MONO, fontSize: 12, color: "#9fabc0", letterSpacing: ".08em", marginBottom: 10 }}>＋ CREATE AN ALERT</div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-start" }}>
                <select value={scope} onChange={(e) => { setScope(e.target.value); setPicked(""); setQuery(""); }} style={{ ...input, cursor: "pointer" }}>
                  {SCOPES.map((s) => <option key={s.key} value={s.key} style={{ background: "#0d0e16" }}>{s.label}</option>)}
                </select>

                {scope === "ticker" && (
                  <div style={{ position: "relative", width: 220 }}>
                    <input value={query} onChange={(e) => { setQuery(e.target.value); setPicked(""); setShowSug(true); const up = e.target.value.trim().toUpperCase(); if (tickers.includes(up)) setPicked(up); }}
                      onFocus={() => setShowSug(true)} onBlur={() => setTimeout(() => setShowSug(false), 120)}
                      placeholder="🔍  Ticker or company" style={{ ...input, width: "100%" }} />
                    {suggestions.length > 0 && (
                      <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 20, background: "#0d0e16", border: "1px solid rgba(255,255,255,.12)", borderRadius: 8, overflow: "hidden", boxShadow: "0 8px 24px rgba(0,0,0,.5)" }}>
                        {suggestions.map((s) => (
                          <button key={s.ticker} onMouseDown={(e) => { e.preventDefault(); setPicked(s.ticker); setQuery(s.ticker); setShowSug(false); }} style={{ display: "flex", gap: 8, width: "100%", textAlign: "left", padding: "8px 12px", background: "transparent", border: "none", borderBottom: "1px solid rgba(255,255,255,.05)", cursor: "pointer", color: "#e2e8f0" }}>
                            <span style={{ fontFamily: FONT_MONO, fontSize: 13, fontWeight: 600, minWidth: 52 }}>{s.ticker}</span>
                            <span style={{ fontSize: 12, color: "#8896ac" }}>{s.name || ""}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <select value={kind} onChange={(e) => setKind(e.target.value)} style={{ ...input, cursor: "pointer" }}>
                  {kindOptions.map((k) => <option key={k.key} value={k.key} style={{ background: "#0d0e16" }}>{k.label}</option>)}
                </select>

                {VALUE_KINDS.has(kind) && (
                  <label style={{ fontFamily: FONT_MONO, fontSize: 12, color: "#9fabc0", display: "inline-flex", alignItems: "center", gap: 6 }}>
                    <input type="range" min={0} max={100} value={threshold || "0"} onChange={(e) => setThreshold(e.target.value)} />
                    <span style={{ color: "#cbd5e1", width: 36 }}>{threshold}%</span>
                  </label>
                )}
                {PRICE_KINDS.has(kind) && (
                  <input type="number" min={0} step={1} value={threshold} onChange={(e) => setThreshold(e.target.value)} placeholder="Price $" style={{ ...input, width: 110 }} />
                )}

                <button onClick={submitCreate} disabled={busy} style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 13, letterSpacing: ".04em", color: "#0b0c10", background: "#d4a843", border: "none", borderRadius: 8, padding: "9px 18px", cursor: busy ? "default" : "pointer", opacity: busy ? 0.5 : 1 }}>{busy ? "…" : "Create"}</button>
              </div>
              {msg && <div style={{ fontFamily: FONT_MONO, fontSize: 12, color: "#f87171", marginTop: 8 }}>{msg}</div>}
            </div>

            {/* alerts list */}
            {alerts.length === 0 ? (
              <div style={{ color: "#8896ac", fontFamily: FONT_MONO, fontSize: 13, padding: "8px 0 24px" }}>No alerts yet — tap a preset above or create one.</div>
            ) : (
              <div style={{ border: "1px solid rgba(255,255,255,.07)", borderRadius: 12, overflow: "hidden" }}>
                {alerts.map((a, i) => (
                  <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderTop: i ? "1px solid rgba(255,255,255,.05)" : "none" }}>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontFamily: FONT_MONO, fontSize: 13, fontWeight: 700, color: a.active ? "#e2e8f0" : "#64748b" }}>
                        {a.ticker ? a.ticker : scopeLabel(a.scope)}
                        {a.ticker && companyName(a.ticker) ? <span style={{ fontWeight: 400, color: "#64748b" }}> · {companyName(a.ticker)}</span> : null}
                      </span>
                      <div style={{ fontFamily: FONT_MONO, fontSize: 12, color: "#8896ac", marginTop: 2 }}>
                        {a.kind_label}{a.threshold != null ? ` · ${PRICE_KINDS.has(a.kind || "") ? "$" + a.threshold : a.threshold + "%"}` : ""}{!a.ticker ? ` · ${scopeLabel(a.scope)}` : ""}
                      </div>
                    </div>
                    <button onClick={() => toggleActive(a)} title={a.active ? "Pause" : "Resume"} style={{ fontFamily: FONT_MONO, fontSize: 11, padding: "4px 10px", borderRadius: 6, cursor: "pointer", background: a.active ? "rgba(52,211,153,.1)" : "rgba(255,255,255,.04)", border: `1px solid ${a.active ? "rgba(52,211,153,.35)" : "rgba(255,255,255,.12)"}`, color: a.active ? "#34d399" : "#94a3b8" }}>{a.active ? "● Active" : "○ Paused"}</button>
                    <button onClick={() => removeAlert(a.id)} title="Delete" style={{ background: "transparent", border: "1px solid rgba(255,255,255,.12)", borderRadius: 6, color: "#94a3b8", fontFamily: FONT_MONO, fontSize: 12, padding: "4px 9px", cursor: "pointer" }}>✕</button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
