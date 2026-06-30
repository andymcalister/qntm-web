"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE || "https://qntm-api.onrender.com";
const LOGIN_URL = process.env.NEXT_PUBLIC_LOGIN_URL || "https://app.qntm.live";
const LIMIT = 50;

const SECTORS = [
  "Technology", "Financials", "Healthcare", "Consumer Discretionary",
  "Comm Services", "Industrials", "Consumer Staples", "Energy",
  "Materials", "Real Estate", "Utilities",
];

const TIERS = ["all", "HIGH", "MODERATE", "LOW"] as const;

type Row = {
  ticker: string; sector: string; conviction: string; score: number;
  composite: number; momentum: number; quality: number; volume: number;
  value: number; sentiment: number; macro_overlay: number | null;
  price: number | null; value_position: number | null; is_hidden_gem: boolean;
};
type Regime = { label: string; vix: number | null; event: string | null; summary: string | null };
type ApiResp = { as_of: string | null; regime: Regime; total: number; count: number; offset: number; limit: number; rows: Row[] };

const COLS: { key: string; label: string; sortable: boolean; num?: boolean }[] = [
  { key: "ticker", label: "Ticker", sortable: true },
  { key: "sector", label: "Sector", sortable: false },
  { key: "conviction", label: "Conviction", sortable: false },
  { key: "score", label: "Score", sortable: true, num: true },
  { key: "momentum", label: "Mom", sortable: true, num: true },
  { key: "quality", label: "Qual", sortable: true, num: true },
  { key: "volume", label: "Vol", sortable: true, num: true },
  { key: "value", label: "Val", sortable: true, num: true },
  { key: "sentiment", label: "Sent", sortable: true, num: true },
  { key: "price", label: "Price", sortable: true, num: true },
];

function convClass(c: string) {
  if (c === "HIGH") return "text-gold border-gold/40";
  if (c === "MODERATE") return "text-slate-200 border-white/20";
  return "text-slate-500 border-white/10";
}

export default function Screener() {
  const [conviction, setConviction] = useState<(typeof TIERS)[number]>("all");
  const [sector, setSector] = useState("");
  const [gemsOnly, setGemsOnly] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("score");
  const [order, setOrder] = useState<"asc" | "desc">("desc");
  const [offset, setOffset] = useState(0);

  const [data, setData] = useState<ApiResp | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const firstLoad = useRef(true);

  // Debounce the search box so we don't fire a request per keystroke.
  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput.trim()); setOffset(0); }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const qs = new URLSearchParams({
      conviction, sort, order, limit: String(LIMIT), offset: String(offset),
    });
    if (sector) qs.set("sector", sector);
    if (search) qs.set("search", search);
    if (gemsOnly) qs.set("gems_only", "true");
    try {
      const res = await fetch(`${API_BASE}/api/screener?${qs.toString()}`, { cache: "no-store" });
      if (!res.ok) throw new Error(`API ${res.status}`);
      setData(await res.json());
    } catch (e: any) {
      setError(e?.message || "Could not load the screener.");
    } finally {
      setLoading(false);
      firstLoad.current = false;
    }
  }, [conviction, sector, gemsOnly, search, sort, order, offset]);

  useEffect(() => { fetchData(); }, [fetchData]);

  function toggleSort(key: string) {
    if (sort === key) setOrder((o) => (o === "desc" ? "asc" : "desc"));
    else { setSort(key); setOrder("desc"); }
    setOffset(0);
  }

  async function signOut() {
    try { await fetch("/api/session", { method: "DELETE" }); } catch {}
    window.location.href = LOGIN_URL;
  }

  const regime = data?.regime;
  const total = data?.total ?? 0;
  const rangeStart = total === 0 ? 0 : offset + 1;
  const rangeEnd = Math.min(offset + LIMIT, total);

  const regimeTone = useMemo(() => {
    const l = (regime?.label || "").toUpperCase();
    if (l.includes("RISK_ON") || l.includes("BULLISH")) return "text-mint";
    if (l.includes("RISK_OFF") || l.includes("VOLATIL")) return "text-rose-400";
    return "text-slate-300";
  }, [regime?.label]);

  return (
    <div className="min-h-screen bg-bg text-slate-200">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="font-mono text-sm tracking-widest text-gold">— SCREENER</p>
            <h1 className="font-display font-extrabold text-3xl sm:text-4xl mt-2 text-white">
              Conviction across {total.toLocaleString()} names
            </h1>
            {data?.as_of && (
              <p className="mt-1 text-sm text-slate-500 font-mono">as of {data.as_of}</p>
            )}
          </div>
          <button
            onClick={signOut}
            className="font-mono text-xs tracking-widest text-slate-400 hover:text-slate-200 border border-white/10 rounded-lg px-3 py-2"
          >
            SIGN OUT
          </button>
        </div>

        {/* Regime strip */}
        {regime && (
          <div className="mt-6 rounded-2xl border border-white/10 bg-card/50 px-5 py-4 flex flex-wrap items-center gap-x-8 gap-y-2">
            <div>
              <p className="font-mono text-[11px] tracking-widest text-slate-500">REGIME</p>
              <p className={`font-display font-bold text-lg ${regimeTone}`}>
                {regime.label.replace(/_/g, " ")}
              </p>
            </div>
            {regime.vix != null && (
              <div>
                <p className="font-mono text-[11px] tracking-widest text-slate-500">VIX</p>
                <p className="font-mono text-lg text-slate-200">{regime.vix.toFixed(1)}</p>
              </div>
            )}
            {regime.event && (
              <div className="min-w-0">
                <p className="font-mono text-[11px] tracking-widest text-slate-500">EVENT</p>
                <p className="text-sm text-slate-300 truncate">{regime.event}</p>
              </div>
            )}
          </div>
        )}

        {/* Filters */}
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <div className="flex rounded-lg border border-white/10 overflow-hidden">
            {TIERS.map((t) => (
              <button
                key={t}
                onClick={() => { setConviction(t); setOffset(0); }}
                className={`px-3 py-2 font-mono text-xs tracking-widest transition-colors ${
                  conviction === t ? "bg-gold/15 text-gold" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {t === "all" ? "ALL" : t}
              </button>
            ))}
          </div>

          <select
            value={sector}
            onChange={(e) => { setSector(e.target.value); setOffset(0); }}
            className="bg-card border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200"
          >
            <option value="">All sectors</option>
            {SECTORS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>

          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search ticker…"
            className="bg-card border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 w-40"
          />

          <button
            onClick={() => { setGemsOnly((g) => !g); setOffset(0); }}
            className={`px-3 py-2 rounded-lg border font-mono text-xs tracking-widest ${
              gemsOnly ? "border-gold/40 text-gold bg-gold/10" : "border-white/10 text-slate-400 hover:text-slate-200"
            }`}
          >
            HIDDEN GEMS
          </button>
        </div>

        {/* Table */}
        <div className="mt-5 rounded-2xl border border-white/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-card/60 text-slate-400">
                  {COLS.map((c) => (
                    <th
                      key={c.key}
                      onClick={() => c.sortable && toggleSort(c.key)}
                      className={`text-left font-mono text-[11px] tracking-widest px-4 py-3 whitespace-nowrap ${
                        c.num ? "text-right" : ""
                      } ${c.sortable ? "cursor-pointer hover:text-slate-200 select-none" : ""}`}
                    >
                      {c.label}
                      {sort === c.key ? (order === "desc" ? " ↓" : " ↑") : ""}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr><td colSpan={COLS.length} className="px-4 py-10 text-center text-slate-500 font-mono text-sm">
                    {firstLoad.current ? "Loading… (first load may take ~30s while the API wakes)" : "Loading…"}
                  </td></tr>
                )}
                {!loading && error && (
                  <tr><td colSpan={COLS.length} className="px-4 py-10 text-center text-rose-400 font-mono text-sm">
                    {error} <button onClick={fetchData} className="underline ml-2">retry</button>
                  </td></tr>
                )}
                {!loading && !error && data?.rows.length === 0 && (
                  <tr><td colSpan={COLS.length} className="px-4 py-10 text-center text-slate-500 font-mono text-sm">
                    No names match these filters.
                  </td></tr>
                )}
                {!loading && !error && data?.rows.map((r) => (
                  <tr key={r.ticker} className="border-t border-white/5 hover:bg-white/[0.02]">
                    <td className="px-4 py-3 font-mono font-bold text-slate-100 whitespace-nowrap">
                      {r.ticker}
                      {r.is_hidden_gem && <span className="ml-2 text-gold text-xs">◆</span>}
                    </td>
                    <td className="px-4 py-3 text-slate-400 whitespace-nowrap">{r.sector}</td>
                    <td className="px-4 py-3">
                      <span className={`font-mono text-[11px] tracking-widest border rounded px-2 py-1 ${convClass(r.conviction)}`}>
                        {r.conviction}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-slate-100">{r.score.toFixed(1)}</td>
                    <td className="px-4 py-3 text-right font-mono text-slate-400">{r.momentum.toFixed(0)}</td>
                    <td className="px-4 py-3 text-right font-mono text-slate-400">{r.quality.toFixed(0)}</td>
                    <td className="px-4 py-3 text-right font-mono text-slate-400">{r.volume.toFixed(0)}</td>
                    <td className="px-4 py-3 text-right font-mono text-slate-400">{r.value.toFixed(0)}</td>
                    <td className="px-4 py-3 text-right font-mono text-slate-400">{r.sentiment.toFixed(0)}</td>
                    <td className="px-4 py-3 text-right font-mono text-slate-300 whitespace-nowrap">
                      {r.price != null ? `$${r.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        <div className="mt-4 flex items-center justify-between font-mono text-xs text-slate-500">
          <span>{total > 0 ? `${rangeStart}–${rangeEnd} of ${total.toLocaleString()}` : ""}</span>
          <div className="flex gap-2">
            <button
              disabled={offset === 0 || loading}
              onClick={() => setOffset((o) => Math.max(0, o - LIMIT))}
              className="border border-white/10 rounded px-3 py-1.5 tracking-widest disabled:opacity-30 hover:text-slate-200"
            >PREV</button>
            <button
              disabled={rangeEnd >= total || loading}
              onClick={() => setOffset((o) => o + LIMIT)}
              className="border border-white/10 rounded px-3 py-1.5 tracking-widest disabled:opacity-30 hover:text-slate-200"
            >NEXT</button>
          </div>
        </div>

        <p className="mt-6 text-[11px] text-slate-600 leading-relaxed max-w-2xl">
          Research and factor-analysis output, not investment advice. Conviction reflects the
          macro-adjusted composite (HIGH ≥ 60 · MODERATE ≥ 45 · LOW &lt; 45). ◆ marks hidden gems.
        </p>
      </div>
    </div>
  );
}
