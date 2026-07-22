"use client";

import { useEffect, useMemo, useState } from "react";
import NavBar from "../screener/NavBar";
import FactorCard from "../screener/FactorCard";
import { Row, pctRankFn, valueCallout, FONT_DISPLAY, FONT_MONO } from "../screener/lib";
import { useWatchlist } from "../screener/useWatchlist";
import EquityChart, { CurvePoint, DayMove } from "./EquityChart";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "https://qntm-api.onrender.com";

// Dated portfolio changes shown above the methodology box. Entries auto-expire
// after 30 days so this can't go stale the way the digest's "New in QNTM" did.
const PORTFOLIO_CHANGES: { iso: string; date: string; body: string }[] = [
  {
    iso: "2026-07-21",
    date: "Jul 21",
    body: "Corrected \u2014 19 holdings were closed in error. An intraday scoring pass exited them on conviction scores that were never saved to the record; the published scores for those names were above the exit line. Those exits have been voided and the positions restored at their original entry prices. Intraday passes now refresh scores only \u2014 exits run once a day on settled scores.",
  },
  {
    iso: "2026-07-17",
    date: "Jul 17",
    body: "The macro overlay moved to risk-off as tariff and conflict pressure widened, lowering adjusted conviction across the universe. Twelve positions fell below the exit line and were closed. The book holds cash when no name meets the entry bar.",
  },
  {
    iso: "2026-07-16",
    date: "Jul 16",
    body: "Conviction bands raised \u2014 High Conviction now means 65+ (was 60), and positions exit at 55 or under (was 45). Six holdings below the new bar were closed. Applies going forward; the record before this date reflects the earlier rule.",
  },
];

const RECENT_CHANGES = PORTFOLIO_CHANGES.filter(
  (c) => (Date.now() - new Date(c.iso + "T00:00:00Z").getTime()) / 86400000 <= 30
);

const LOGIN_URL = process.env.NEXT_PUBLIC_LOGIN_URL || "/login";

type Position = Row & {
  entry_date: string | null; entry_price: number | null; entry_score: number | null;
  current_price: number | null; ret_since_entry: number | null;
  day_pct?: number | null; day_dollar?: number | null;
  ext_pct?: number | null; ext_session?: string | null;
};
type Stats = {
  inception: string | null; model_value: number; spy_value: number;
  model_ret: number; spy_ret: number; alpha: number; day_model: number; day_spy: number;
  rsp_value?: number | null; qqq_value?: number | null;
  rsp_ret?: number | null; qqq_ret?: number | null;
  vs_rsp?: number | null; vs_qqq?: number | null;
  basis: number; n_sessions: number;
  pre_post?: { session: "pre" | "post"; model: number; spy: number | null; coverage: number; held: number } | null;
};
type Exit = { ticker: string; sector: string; entry_date: string; exit_date: string; ret: number; reason: string };
type SectorCount = { sector: string; count: number };
type ExitedTicker = { ticker: string; score: number | null; reason: string };
type TodayMoves = { date: string | null; is_today?: boolean; entered: string[]; exited: ExitedTicker[] };
type MPResp = {
  inception: string | null; curve: CurvePoint[]; stats: Stats | null;
  day: (DayMove & { as_of_date?: string | null; is_current_session?: boolean }) | null;
  prices_as_of: string | null; positions: Position[]; exits: Exit[]; sector_counts: SectorCount[];
  today_moves?: TodayMoves | null;
};

const money0 = (n: number | null | undefined) => (n == null ? "—" : `$${Math.round(n).toLocaleString()}`);
const money = (n: number | null | undefined) => (n == null ? "—" : `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
const pct = (n: number | null | undefined, dp = 1) => (n == null ? "—" : `${n >= 0 ? "+" : ""}${n.toFixed(dp)}%`);
const dollarSigned = (n: number) => `${n >= 0 ? "+" : "−"}$${Math.abs(Math.round(n)).toLocaleString()}`;
const pcol = (n: number | null | undefined) => (n == null ? "#8896ac" : n >= 0 ? "#34d399" : "#f87171");

function StatCard({ label, value, valueColor, sub, subColor }: { label: string; value: string; valueColor?: string; sub?: string; subColor?: string }) {
  return (
    <div style={{ flex: "1 1 150px", minWidth: 140, background: "#0d1117", border: "1px solid rgba(255,255,255,.07)", borderRadius: 8, padding: "14px 16px", textAlign: "center" }}>
      <div style={{ fontFamily: FONT_MONO, fontSize: 12, color: "#9fabc0", letterSpacing: ".08em", marginBottom: 6 }}>{label}</div>
      <div style={{ fontFamily: FONT_DISPLAY, fontSize: 22, fontWeight: 800, color: valueColor || "#e7ecf3" }}>{value}</div>
      {sub && <div style={{ fontFamily: FONT_MONO, fontSize: 13, color: subColor || "#8896ac", marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

export default function ModelPortfolio() {
  const [data, setData] = useState<MPResp | null>(null);
  const [bench, setBench] = useState<"spy" | "rsp" | "qqq">("spy");
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

  const asOf = useMemo(() => {
    if (!data?.prices_as_of) return null;
    const dt = new Date(data.prices_as_of);
    if (isNaN(dt.getTime())) return null;
    const mins = Math.floor((Date.now() - dt.getTime()) / 60000);
    const t = dt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    // Current ET session (DST-aware via Intl) — the "stale/lagging" warning only
    // makes sense during the regular session; outside it, prices are meant to sit.
    const et = new Date(new Date().toLocaleString("en-US", { timeZone: "America/New_York" }));
    const wd = et.getDay(); // 0 Sun .. 6 Sat
    const m = et.getHours() * 60 + et.getMinutes();
    let session: "pre" | "regular" | "post" | "closed" = "closed";
    if (wd >= 1 && wd <= 5) {
      if (m >= 4 * 60 && m < 9 * 60 + 30) session = "pre";
      else if (m >= 9 * 60 + 30 && m <= 16 * 60) session = "regular";
      else if (m > 16 * 60 && m <= 20 * 60) session = "post";
    }
    const warn = session === "regular" && mins > 20;
    const note =
      warn ? " · stale, refresh may be lagging"
      : session === "pre" ? " · pre-market · regular prices resume at 9:30 ET"
      : session === "post" ? " · after-hours · marked at the 4:00 ET close"
      : session === "regular" ? ""
      : " · market closed · last session's close";
    return { t, warn, note, mins };
  }, [data]);

  async function signOut() {
    try { await fetch("/api/session", { method: "DELETE" }); } catch {}
    window.location.href = LOGIN_URL;
  }

  const s = data?.stats || null;
  const day = data?.day || null;
  const positions = data?.positions || [];
  const exits = data?.exits || [];
  const dollarChange = s ? s.model_value - s.basis : 0;
  const dollarVsSpy = s ? s.model_value - s.spy_value : 0;
  const benchVs = s ? (bench === "spy" ? s.alpha : bench === "rsp" ? (s.vs_rsp ?? 0) : (s.vs_qqq ?? 0)) : 0;
  const benchVal = s ? (bench === "spy" ? s.spy_value : bench === "rsp" ? (s.rsp_value ?? s.model_value) : (s.qqq_value ?? s.model_value)) : 0;
  const benchDollar = s ? s.model_value - benchVal : 0;
  const benchNote = bench === "spy" ? "S&P 500, cap-weighted \u2014 the market as most investors hold it"
    : bench === "rsp" ? "S&P 500 Equal Weight \u2014 strips out the mega-cap size tilt"
    : "Nasdaq-100 \u2014 a growth / tech lens";

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-bg,#060709)", color: "#cbd5e1" }}>
      <NavBar uid={uid} plan={plan} active="model_portfolio" onSignOut={signOut} />
      <div style={{ maxWidth: 1440, margin: "0 auto", padding: "28px 24px 60px" }}>
        <p style={{ fontFamily: FONT_MONO, fontSize: 13, letterSpacing: ".2em", color: "#d4a843", margin: 0 }}>🏆 PORTFOLIO &amp; TRACK RECORD</p>
        <h1 style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 30, color: "#fff", margin: "8px 0 0" }}>Live model portfolio vs SPY</h1>
        <p style={{ fontFamily: FONT_MONO, fontSize: 13, color: "#64748b", margin: "4px 0 0" }}>
          Equal-weighted $2K positions · marked-to-market · exits at Low Conviction
        </p>

        {loading ? (
          <div style={{ color: "#64748b", fontFamily: FONT_MONO, fontSize: 13, padding: "48px 0" }}>Loading the equity curve…</div>
        ) : error ? (
          <div style={{ color: "#f87171", fontFamily: FONT_MONO, fontSize: 13, padding: "48px 0" }}>{error}</div>
        ) : (
          <>
            {/* what changed */}
            {RECENT_CHANGES.length > 0 && (
              <div style={{ background: "rgba(147,180,255,.04)", border: "1px solid rgba(147,180,255,.18)", borderRadius: 8, padding: "16px 20px", margin: "20px 0 0" }}>
                <div style={{ fontFamily: FONT_MONO, fontSize: 13, color: "#93b4ff", letterSpacing: ".1em", marginBottom: 10 }}>WHAT CHANGED RECENTLY</div>
                {RECENT_CHANGES.map((c) => (
                  <div key={c.iso} style={{ display: "flex", gap: 12, marginBottom: 8 }}>
                    <div style={{ fontFamily: FONT_MONO, fontSize: 12, color: "#93b4ff", flexShrink: 0, width: 46, paddingTop: 2 }}>{c.date}</div>
                    <div style={{ fontSize: 13, color: "#b3bed0", lineHeight: 1.7 }}>{c.body}</div>
                  </div>
                ))}
              </div>
            )}

            {/* methodology */}
            <div style={{ background: "rgba(212,168,67,.04)", border: "1px solid rgba(212,168,67,.15)", borderRadius: 8, padding: "16px 20px", margin: "20px 0" }}>
              <div style={{ fontFamily: FONT_MONO, fontSize: 13, color: "#d4a843", letterSpacing: ".1em", marginBottom: 8 }}>⚡ INVESTMENT METHODOLOGY</div>
              <div style={{ fontSize: 13, color: "#b3bed0", lineHeight: 1.7 }}>
                Built from <strong style={{ color: "#cbd5e1" }}>{s?.inception || data?.inception || "—"}</strong> — highest conviction signals entered each day. Entry threshold: <strong style={{ color: "#34d399" }}>≥ 70</strong> in HIGH VOLATILITY regimes, <strong style={{ color: "#34d399" }}>≥ 65</strong> otherwise. Equal-weighted at <strong style={{ color: "#cbd5e1" }}>$2,000 per position</strong> ($100K total). 30% sector cap enforced at entry.
                <br /><br />
                <strong style={{ color: "#cbd5e1" }}>Exit discipline:</strong> Positions exit when conviction drops to <strong style={{ color: "#f87171" }}>55</strong> or under. Capital redeploys into next highest conviction signal. No discretionary overrides.
              </div>
            </div>

            {/* stat cards */}
            {s && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                <StatCard label="PORTFOLIO VALUE" value={money0(s.model_value)} valueColor="#d4a843" />
                <StatCard label={day?.is_current_session === false ? "LAST SESSION" : "TODAY"} value={pct(day?.model_pct ?? s.day_model, 2)} valueColor={pcol(day?.model_pct ?? s.day_model)} sub={day ? dollarSigned(day.model_dollar) : undefined} />
                <StatCard label="$ CHANGE" value={dollarSigned(dollarChange)} valueColor={pcol(dollarChange)} />
                <StatCard label="% RETURN" value={pct(s.model_ret)} valueColor={pcol(s.model_ret)} />
                <StatCard label={`$ vs ${bench.toUpperCase()}`} value={dollarSigned(benchDollar)} valueColor={pcol(benchDollar)} />
                <StatCard label={`% vs ${bench.toUpperCase()}`} value={pct(benchVs)} valueColor={pcol(benchVs)} />
              </div>
            )}

            {data?.today_moves && (data.today_moves.entered.length > 0 || data.today_moves.exited.length > 0) && (
              <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "6px 12px", marginTop: 10, padding: "10px 14px", background: "rgba(255,255,255,.02)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 8 }}>
                <span style={{ fontFamily: FONT_MONO, fontSize: 11.5, letterSpacing: ".1em", color: "#8896ac", fontWeight: 700 }}>{data?.today_moves?.is_today === false ? (data.today_moves.date || "LAST SESSION") : "TODAY"}</span>
                {data.today_moves.entered.length > 0 && (
                  <>
                    <span style={{ color: "#4b5568" }}>·</span>
                    <span style={{ fontFamily: FONT_MONO, fontSize: 13, color: "#cbd5e1" }}>
                      <strong style={{ color: "#34d399" }}>Entered</strong> {data.today_moves.entered.join(", ")}
                    </span>
                  </>
                )}
                {data.today_moves.exited.length > 0 && (
                  <>
                    <span style={{ color: "#4b5568" }}>·</span>
                    <span style={{ fontFamily: FONT_MONO, fontSize: 13, color: "#cbd5e1" }}>
                      <strong style={{ color: "#f87171" }}>Exited</strong>{" "}
                      {data.today_moves.exited.map((e, i) => (
                        <span key={e.ticker}>{i > 0 ? ", " : ""}{e.ticker}{e.score != null ? ` (${e.score})` : ""}</span>
                      ))}
                    </span>
                    <span style={{ color: "#4b5568" }}>·</span>
                    <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: "#64748b" }}>SELL_SIGNAL</span>
                  </>
                )}
              </div>
            )}

            {s?.pre_post && (
              <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "6px 14px", marginTop: 10, padding: "10px 14px", background: "rgba(56,120,255,.06)", border: "1px solid rgba(120,160,255,.18)", borderRadius: 8 }}>
                <span style={{ fontFamily: FONT_MONO, fontSize: 11.5, letterSpacing: ".1em", color: "#93b4ff", fontWeight: 700 }}>
                  {s.pre_post.session === "pre" ? "PRE-MARKET" : "AFTER-HOURS"}
                </span>
                <span style={{ fontFamily: FONT_MONO, fontSize: 13, color: "#cbd5e1" }}>
                  Model <strong style={{ color: pcol(s.pre_post.model) }}>{pct(s.pre_post.model, 2)}</strong>
                </span>
                <span style={{ color: "#4b5568" }}>·</span>
                <span style={{ fontFamily: FONT_MONO, fontSize: 13, color: "#cbd5e1" }}>
                  SPY <strong style={{ color: pcol(s.pre_post.spy) }}>{pct(s.pre_post.spy, 2)}</strong>
                </span>
                <span style={{ color: "#4b5568" }}>·</span>
                <span style={{ fontFamily: FONT_MONO, fontSize: 12, color: "#8896ac" }}>
                  {s.pre_post.coverage}/{s.pre_post.held} holdings trading
                </span>
                <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: "#64748b", flexBasis: "100%" }}>
                  Extended-hours indicator · doesn&apos;t change portfolio value until the open
                </span>
              </div>
            )}

            {asOf && (
              <div style={{ fontFamily: FONT_MONO, fontSize: 12, color: asOf.warn ? "#f59e0b" : "#8896ac", margin: "10px 0 0 2px" }}>
                prices as of {asOf.t}{asOf.note}
              </div>
            )}

            {/* equity curve */}
            {data && data.curve.length >= 2 ? (
              <div style={{ marginTop: 16, padding: "16px 12px 12px", background: "rgba(255,255,255,.015)", border: "1px solid rgba(255,255,255,.06)", borderRadius: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4, paddingLeft: 4 }}>
                  {(["spy", "rsp", "qqq"] as const).map((b) => (
                    <button key={b} onClick={() => setBench(b)}
                      style={{ fontFamily: FONT_MONO, fontSize: 11, letterSpacing: ".08em", padding: "4px 11px", borderRadius: 6, cursor: "pointer",
                        border: bench === b ? "1px solid rgba(212,168,67,.5)" : "1px solid rgba(255,255,255,.10)",
                        background: bench === b ? "rgba(212,168,67,.14)" : "transparent",
                        color: bench === b ? "#d4a843" : "#8896ac", fontWeight: bench === b ? 700 : 500 }}>
                      {b.toUpperCase()}
                    </button>
                  ))}
                  <span style={{ fontFamily: FONT_MONO, fontSize: 10.5, color: "#64748b", marginLeft: 4 }}>
                    since inception · {s?.n_sessions ?? 0} sessions
                  </span>
                </div>
                <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: "#8896ac", paddingLeft: 4, marginBottom: 10 }}>{benchNote}</div>
                <EquityChart curve={data.curve} day={day} benchmark={bench} />
              </div>
            ) : (
              <div style={{ marginTop: 16, padding: "24px", border: "1px dashed rgba(255,255,255,.12)", borderRadius: 12, color: "#8896ac", fontFamily: FONT_MONO, fontSize: 13 }}>
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
                  <FactorCard r={p} isGem={p.is_hidden_gem} pctRank={pctRank(p.score)} callout={valueCallout(p)} isWatched={watched.has(p.ticker)} onToggleWatch={toggleWatch} />
                  <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "4px 12px", fontFamily: FONT_MONO, fontSize: 12, color: "#8896ac", margin: "-2px 0 12px 3px" }}>
                    <span>entered {p.entry_date || "—"} @ {money(p.entry_price)}</span>
                    {p.ret_since_entry != null && (
                      <>
                        <span style={{ color: "#6b7686" }}>·</span>
                        <span style={{ color: pcol(p.ret_since_entry) }}>{p.ret_since_entry >= 0 ? "▲" : "▼"} {pct(p.ret_since_entry, 1)} since entry</span>
                      </>
                    )}
                    {p.day_pct != null && (
                      <>
                        <span style={{ color: "#6b7686" }}>·</span>
                        <span style={{ color: pcol(p.day_pct) }}>
                          {p.day_pct >= 0 ? "▲" : "▼"} {pct(p.day_pct, 2)}
                          {p.day_dollar != null ? ` (${dollarSigned(p.day_dollar)})` : ""} today
                        </span>
                      </>
                    )}
                    {p.ext_pct != null && p.ext_session && (
                      <>
                        <span style={{ color: "#6b7686" }}>·</span>
                        <span style={{ color: "#7c8aa0" }}>
                          <span style={{ color: pcol(p.ext_pct) }}>{pct(p.ext_pct, 2)}</span>
                          {" "}{p.ext_session === "pre" ? "PRE" : "AH"}
                        </span>
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
