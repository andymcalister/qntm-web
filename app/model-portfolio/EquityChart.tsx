"use client";

import { useMemo, useState } from "react";
import { FONT_MONO } from "../screener/lib";

export type CurvePoint = { d: string; model: number; spy: number; rsp?: number | null; qqq?: number | null };
export type DayMove = {
  model_now: number; model_prev: number; model_pct: number; model_dollar: number;
  spy_now: number; spy_prev: number; spy_pct: number; spy_dollar: number; vs_spy_pct: number;
};

// DAY = intraday "prev close → now" (2-point, position-weighted, includes pre/
// post-market since "now" is the cron-fresh mark). The rest are calendar windows;
// 1W spans the weekend (7 calendar days back from the latest session).
const RANGES: { key: string; label: string; days: number | null; day?: boolean }[] = [
  { key: "DAY", label: "DAY", days: 0, day: true },
  { key: "1W", label: "1W", days: 7 },
  { key: "1M", label: "1M", days: 30 },
  { key: "3M", label: "3M", days: 90 },
  { key: "1Y", label: "1Y", days: 365 },
  { key: "ALL", label: "ALL", days: null },
];

const GOLD = "#d4a843";
const SLATE = "#7c8aa0";
const fmtk = (v: number) => `$${(v / 1000).toFixed(1)}K`;
const pctstr = (n: number) => `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`;
const pcol = (x: number) => (x >= 0 ? "#34d399" : "#f87171");

function minusDays(iso: string, days: number): string {
  const dt = new Date(iso + "T00:00:00Z");
  dt.setUTCDate(dt.getUTCDate() - days);
  return dt.toISOString().slice(0, 10);
}

export default function EquityChart({ curve, day, benchmark = "spy" }: { curve: CurvePoint[]; day?: DayMove | null; benchmark?: "spy" | "rsp" | "qqq" }) {
  const [range, setRange] = useState(day ? "DAY" : "1M");
  const [hover, setHover] = useState<number | null>(null);

  const isDay = range === "DAY";
  const benchLabel = (benchmark || "spy").toUpperCase();

  const data: CurvePoint[] = useMemo(() => {
    if (isDay) {
      if (!day) return [];
      return [
        { d: "prev close", model: day.model_prev, spy: day.spy_prev },
        { d: "now", model: day.model_now, spy: day.spy_now },
      ];
    }
    const days = RANGES.find((r) => r.key === range)?.days ?? null;
    if (!curve.length || days == null) return curve;
    const cutoff = minusDays(curve[curve.length - 1].d, days);
    const f = curve.filter((p) => p.d >= cutoff);
    return f.length >= 2 ? f : curve.slice(-2);
  }, [curve, day, range, isDay]);

  const enabled = useMemo(() => {
    const set = new Set<string>();
    for (const r of RANGES) {
      if (r.day) { if (day) set.add(r.key); continue; }
      if (r.days == null) { if (curve.length >= 2) set.add(r.key); continue; }
      if (!curve.length) continue;
      const cutoff = minusDays(curve[curve.length - 1].d, r.days);
      if (curve.filter((p) => p.d >= cutoff).length >= 2) set.add(r.key);
    }
    return set;
  }, [curve, day]);

  const W = 760, H = 300, PL = 52, PR = 70, PT = 16, PB = 30;
  const BASE = H - PB;

  const geom = useMemo(() => {
    if (data.length < 2) return null;
    const mv = data.map((p) => p.model);
    const _bk = (benchmark || "spy") as "spy" | "rsp" | "qqq";
    let _lastB: number | null = null;
    const sv = data.map((p) => {
      const raw = _bk === "spy" ? p.spy : (p[_bk] ?? null);
      const v = (raw == null || Number.isNaN(raw as number)) ? _lastB : (raw as number);
      if (v != null) _lastB = v;
      return v ?? p.spy;
    });
    const _BASE = 100000;
    const _m0 = mv[0] || 1;
    const _s0 = sv[0] || 1;
    const mvN = mv.map((v) => _BASE * v / _m0);
    const svN = sv.map((v) => _BASE * v / _s0);
    let lo = Math.min(...mvN, ...svN);
    let hi = Math.max(...mvN, ...svN);
    if (hi === lo) hi = lo + 1;
    const pad = (hi - lo) * 0.1;
    lo -= pad; hi += pad;
    const n = data.length;
    const X = (i: number) => PL + (W - PL - PR) * (i / (n - 1));
    const Y = (v: number) => PT + (BASE - PT) * (1 - (v - lo) / (hi - lo));
    const line = (vals: number[]) => "M " + vals.map((v, i) => `${X(i).toFixed(1)},${Y(v).toFixed(1)}`).join(" L ");
    const area = (vals: number[]) =>
      `M ${X(0).toFixed(1)},${BASE} L ` + vals.map((v, i) => `${X(i).toFixed(1)},${Y(v).toFixed(1)}`).join(" L ") + ` L ${X(n - 1).toFixed(1)},${BASE} Z`;
    const grid = [0, 1, 2, 3].map((k) => { const tv = lo + (hi - lo) * k / 3; return { y: Y(tv), label: fmtk(tv) }; });
    const ref100 = lo <= 100000 && 100000 <= hi ? Y(100000) : null;
    const xlabel = (i: number) => (isDay ? data[i].d : data[i].d.slice(5).replace("-", "/"));
    const tickIdx = isDay ? [0, n - 1] : Array.from(new Set([0, Math.floor(n / 2), n - 1]));
    const ticks = tickIdx.map((i) => ({ x: X(i), label: xlabel(i), anchor: i === 0 ? "start" : i === n - 1 ? "end" : "middle" }));
    const mPct = mvN[0] ? (mvN[n - 1] / mvN[0] - 1) * 100 : 0;
    const sPct = svN[0] ? (svN[n - 1] / svN[0] - 1) * 100 : 0;
    return { mv: mvN, sv: svN, n, X, Y, line, area, grid, ref100, ticks, mPct, sPct };
  }, [data, isDay, benchmark]);

  // header change line
  const hdr = isDay && day
    ? { m: day.model_pct, s: day.spy_pct, vs: day.vs_spy_pct, suffix: "today" }
    : geom
    ? { m: geom.mPct, s: geom.sPct, vs: geom.mPct - geom.sPct, suffix: range }
    : null;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8, marginBottom: 6 }}>
        {hdr && (
          <div style={{ fontFamily: FONT_MONO, fontSize: 13 }}>
            <span style={{ color: GOLD }}>— QNTM Model </span><span style={{ color: pcol(hdr.m) }}>{pctstr(hdr.m)}</span>
            <span style={{ color: SLATE }}>{"  — " + benchLabel + " "}</span><span style={{ color: pcol(hdr.s) }}>{pctstr(hdr.s)}</span>
            <span style={{ color: "#8896ac" }}>{"  vs " + benchLabel + " "}</span><span style={{ color: pcol(hdr.vs) }}>{pctstr(hdr.vs)}</span>
            <span style={{ color: "#64748b" }}> {hdr.suffix}</span>
          </div>
        )}
        <div style={{ display: "flex", gap: 2, marginLeft: "auto" }}>
          {RANGES.map((r) => {
            const on = enabled.has(r.key);
            const active = range === r.key;
            return (
              <button key={r.key} disabled={!on} onClick={() => on && setRange(r.key)}
                style={{ fontFamily: FONT_MONO, fontSize: 11, letterSpacing: ".05em", padding: "4px 10px", borderRadius: 6, border: "none",
                  cursor: on ? "pointer" : "default", background: active ? "rgba(212,168,67,.18)" : "transparent",
                  color: active ? "#f0c668" : on ? "#9fabc0" : "#4b5568" }}>
                {r.label}
              </button>
            );
          })}
        </div>
      </div>

      {!geom ? (
        <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b", fontFamily: FONT_MONO, fontSize: 13 }}>
          Not enough sessions in this window yet.
        </div>
      ) : (
        <div style={{ position: "relative" }}>
          <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: "block" }}
            onMouseLeave={() => setHover(null)}
            onMouseMove={(e) => {
              const rect = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
              const px = ((e.clientX - rect.left) / rect.width) * W;
              const t = Math.max(0, Math.min(1, (px - PL) / (W - PL - PR)));
              setHover(Math.round(t * (geom.n - 1)));
            }}>
            <defs>
              <linearGradient id="trGold" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={GOLD} stopOpacity="0.28" /><stop offset="100%" stopColor={GOLD} stopOpacity="0" />
              </linearGradient>
              <linearGradient id="trSpy" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#9fabc0" stopOpacity="0.12" /><stop offset="100%" stopColor="#9fabc0" stopOpacity="0" />
              </linearGradient>
            </defs>

            {geom.grid.map((g, i) => (
              <g key={i}>
                <line x1={PL} y1={g.y} x2={W - PR} y2={g.y} stroke="rgba(255,255,255,.045)" />
                <text x={PL - 8} y={g.y + 3} textAnchor="end" fontFamily="DM Mono, monospace" fontSize="10" fill="#8896ac">{g.label}</text>
              </g>
            ))}
            {geom.ref100 != null && <line x1={PL} y1={geom.ref100} x2={W - PR} y2={geom.ref100} stroke="rgba(255,255,255,.15)" strokeDasharray="2,4" />}
            {geom.ticks.map((t, i) => (
              <text key={i} x={t.x} y={H - 8} textAnchor={t.anchor as "start" | "middle" | "end"} fontFamily="DM Mono, monospace" fontSize="10" fill="#8896ac">{t.label}</text>
            ))}

            <path d={geom.area(geom.sv)} fill="url(#trSpy)" stroke="none" />
            <path d={geom.area(geom.mv)} fill="url(#trGold)" stroke="none" />
            <path d={geom.line(geom.sv)} fill="none" stroke={SLATE} strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" />
            <path d={geom.line(geom.mv)} fill="none" stroke={GOLD} strokeWidth="2.6" strokeLinejoin="round" strokeLinecap="round" />

            <circle cx={geom.X(geom.n - 1)} cy={geom.Y(geom.sv[geom.n - 1])} r="3" fill={SLATE} />
            <circle cx={geom.X(geom.n - 1)} cy={geom.Y(geom.mv[geom.n - 1])} r="3.5" fill={GOLD} />
            <text x={geom.X(geom.n - 1) + 8} y={geom.Y(geom.sv[geom.n - 1]) + 3} fontFamily="DM Mono, monospace" fontSize="10" fill="#b3bed0">{fmtk(geom.sv[geom.n - 1])}</text>
            <text x={geom.X(geom.n - 1) + 8} y={geom.Y(geom.sv[geom.n - 1]) + 15} fontFamily="DM Mono, monospace" fontSize="9" fill={pcol(geom.sPct)}>{geom.sPct >= 0 ? "+" : ""}{geom.sPct.toFixed(1)}%</text>
            <text x={geom.X(geom.n - 1) + 8} y={geom.Y(geom.mv[geom.n - 1]) + 3.5} fontFamily="DM Mono, monospace" fontSize="11" fontWeight="700" fill={GOLD}>{fmtk(geom.mv[geom.n - 1])}</text>
            <text x={geom.X(geom.n - 1) + 8} y={geom.Y(geom.mv[geom.n - 1]) + 15.5} fontFamily="DM Mono, monospace" fontSize="9" fill={pcol(geom.mPct)}>{geom.mPct >= 0 ? "+" : ""}{geom.mPct.toFixed(1)}%</text>

            {hover != null && hover >= 0 && hover < geom.n && (
              <g>
                <line x1={geom.X(hover)} y1={PT} x2={geom.X(hover)} y2={BASE} stroke="rgba(255,255,255,.18)" strokeWidth="1" />
                <circle cx={geom.X(hover)} cy={geom.Y(geom.sv[hover])} r="3" fill={SLATE} />
                <circle cx={geom.X(hover)} cy={geom.Y(geom.mv[hover])} r="3.5" fill={GOLD} />
              </g>
            )}
          </svg>

          {hover != null && hover >= 0 && hover < data.length && (
            <div style={{ position: "absolute", top: 4, left: `${(geom.X(hover) / W) * 100}%`, transform: "translateX(-50%)", pointerEvents: "none",
              background: "#0d0e16", border: "1px solid rgba(255,255,255,.12)", borderRadius: 6, padding: "5px 9px", fontFamily: FONT_MONO, fontSize: 11, whiteSpace: "nowrap", boxShadow: "0 6px 18px rgba(0,0,0,.5)" }}>
              <div style={{ color: "#94a3b8", marginBottom: 2 }}>{data[hover].d}</div>
              <div style={{ color: GOLD }}>Model {fmtk(data[hover].model)}</div>
              <div style={{ color: SLATE }}>{(benchmark || "spy").toUpperCase()} {fmtk(geom.sv[hover])}</div>
            </div>
          )}
        </div>
      )}

      <div style={{ display: "flex", gap: 16, marginTop: 4, fontFamily: FONT_MONO, fontSize: 11, color: "#8896ac" }}>
        <span><span style={{ color: GOLD }}>■</span> Model</span>
        <span><span style={{ color: SLATE }}>■</span> SPY</span>
        <span style={{ color: "#64748b" }}>· $100K invested at inception, marked daily</span>
      </div>
    </div>
  );
}
