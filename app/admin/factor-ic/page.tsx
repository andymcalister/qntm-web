"use client";
import { useEffect, useState } from "react";

const MONO = "'DM Mono', ui-monospace, Menlo, monospace";
const green = "#34d399", red = "#f87171", amber = "#f59e0b", dim = "#9fabc0", text = "#b3bed0";

type Agg = { mean: number | null; tstat: number | null; pct_pos: number | null; ndays: number };
type Row = { weight: number | null; overall: Agg; by_regime: Record<string, Agg> };
type FwdBlk = { table: Record<string, Row>; composite_series: [string, number][]; regime_days: Record<string, number> };
type Narrative = { verdict: string; bullets: [string, string][]; guidance: string; confidence: string; ndays: number };
type Report = { start: string; weights: Record<string, number>; fwds: Record<string, FwdBlk>; narrative?: Narrative; error?: string };

function icColor(v: number | null | undefined): string {
  if (v == null) return dim;
  if (v > 0.02) return green;
  if (v < -0.02) return red;
  return amber;
}
function fmt(v: number | null | undefined, d = 3): string {
  return v == null ? "-" : (v >= 0 ? "+" : "") + v.toFixed(d);
}

function Sparkline({ series }: { series: [string, number][] }) {
  if (!series || series.length < 2) return null;
  const vals = series.map((s) => s[1]);
  const lo = Math.min(...vals, 0), hi = Math.max(...vals, 0);
  const W = 520, H = 90, PAD = 6;
  const X = (i: number) => PAD + (W - 2 * PAD) * (i / (series.length - 1));
  const Y = (v: number) => PAD + (H - 2 * PAD) * (1 - (v - lo) / (hi - lo || 1));
  const pts = series.map((s, i) => `${X(i).toFixed(1)},${Y(s[1]).toFixed(1)}`).join(" ");
  const zeroY = Y(0);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: W, height: "auto" }}>
      <line x1={PAD} y1={zeroY} x2={W - PAD} y2={zeroY} stroke="#334155" strokeWidth="1" strokeDasharray="3 3" />
      <polyline points={pts} fill="none" stroke="#93b4ff" strokeWidth="1.5" />
    </svg>
  );
}

export default function FactorICPage() {
  const [rep, setRep] = useState<Report | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetch("/api/admin/factor-ic", { cache: "no-store" })
      .then((r) => { if (r.status === 403) throw new Error("Admin only."); if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
      .then((d) => { if (d.error) throw new Error("No data yet: " + JSON.stringify(d)); setRep(d); })
      .catch((e) => setErr(String(e.message || e)))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ fontFamily: MONO, color: text, maxWidth: 940, margin: "0 auto", padding: "32px 20px" }}>
      <a href="/screener" style={{ display: "inline-block", marginBottom: 18, fontFamily: MONO, fontSize: 12.5, color: "#9fabc0", textDecoration: "none" }}>← Back to app</a>
      <h1 style={{ color: "#d4a843", fontSize: 20, letterSpacing: ".1em" }}>FACTOR IC — DIAGNOSTIC</h1>
      <p style={{ fontSize: 13, color: dim, lineHeight: 1.7 }}>
        Daily cross-sectional Spearman correlation between each factor sub-score and forward excess return vs SPY,
        recomputed live from signal_log. Vol regime = SPY trailing 10-day realized-vol median split (a proxy, not the macro regime).
      </p>
      <div style={{ background: "rgba(212,168,67,.07)", border: "1px solid rgba(212,168,67,.3)", borderRadius: 8, padding: "12px 16px", fontSize: 12.5, lineHeight: 1.6, margin: "12px 0 24px" }}>
        <b style={{ color: "#d4a843" }}>Directional only.</b> Short sample; per-regime buckets have very few days (see n).
        This page accumulates signal across regimes over time — it does not justify re-weighting the model.
        Durable factor ICs run ~0.02–0.05; larger values are regime artifacts.
      </div>
      {loading && <p style={{ color: dim }}>Loading…</p>}
      {err && <p style={{ color: red }}>{err}</p>}
      {rep?.narrative && (
        <div style={{ background: "rgba(147,180,255,.05)", border: "1px solid rgba(147,180,255,.2)", borderRadius: 8, padding: "16px 20px", marginBottom: 28 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#fff", marginBottom: 4 }}>{rep.narrative.verdict}</div>
          <div style={{ fontSize: 11, color: dim, marginBottom: 12 }}>
            confidence: {rep.narrative.confidence} · {rep.narrative.ndays} sessions measured
          </div>
          {rep.narrative.bullets.map(([lvl, text], i) => (
            <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6, fontSize: 13, lineHeight: 1.6 }}>
              <span style={{ color: lvl === "good" ? green : lvl === "bad" ? red : lvl === "warn" ? amber : dim, flexShrink: 0 }}>
                {lvl === "good" ? "\u2191" : lvl === "bad" ? "\u2193" : lvl === "warn" ? "\u26a0" : "\u2013"}
              </span>
              <span style={{ color: text }}>{text}</span>
            </div>
          ))}
          <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid rgba(255,255,255,.08)", fontSize: 13, lineHeight: 1.7, color: "#cbd5e1" }}>
            {rep.narrative.guidance}
          </div>
        </div>
      )}
      {rep && Object.entries(rep.fwds).map(([fwd, blk]) => (
        <div key={fwd} style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 15, color: text }}>
            fwd = {fwd} sessions{" "}
            <span style={{ color: dim, fontSize: 12 }}>
              · Elevated Vol {blk.regime_days["Elevated Vol"] || 0}d / Normal Vol {blk.regime_days["Normal Vol"] || 0}d · since {rep.start}
            </span>
          </h2>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
            <thead>
              <tr style={{ color: dim, textAlign: "right" }}>
                <th style={{ textAlign: "left", padding: "6px 8px" }}>factor</th>
                <th style={{ padding: "6px 8px" }}>weight</th>
                <th style={{ padding: "6px 8px" }}>IC</th>
                <th style={{ padding: "6px 8px" }}>%days+</th>
                <th style={{ padding: "6px 8px" }}>t-stat</th>
                <th style={{ padding: "6px 8px" }}>Elev IC (n)</th>
                <th style={{ padding: "6px 8px" }}>Normal IC (n)</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(blk.table).map(([f, row]) => {
                const e = row.by_regime["Elevated Vol"], nv = row.by_regime["Normal Vol"];
                return (
                  <tr key={f} style={{ borderTop: "1px solid rgba(255,255,255,.06)", textAlign: "right" }}>
                    <td style={{ textAlign: "left", padding: "6px 8px", color: f === "adj_composite" ? "#d4a843" : text }}>{f}</td>
                    <td style={{ padding: "6px 8px", color: dim }}>{row.weight == null ? "" : row.weight.toFixed(2)}</td>
                    <td style={{ padding: "6px 8px", color: icColor(row.overall.mean), fontWeight: 700 }}>{fmt(row.overall.mean)}</td>
                    <td style={{ padding: "6px 8px", color: dim }}>{row.overall.pct_pos == null ? "-" : row.overall.pct_pos + "%"}</td>
                    <td style={{ padding: "6px 8px", color: dim }}>{fmt(row.overall.tstat, 2)}</td>
                    <td style={{ padding: "6px 8px", color: icColor(e && e.mean) }}>{!e || e.mean == null ? "-" : `${fmt(e.mean)} (${e.ndays})`}</td>
                    <td style={{ padding: "6px 8px", color: icColor(nv && nv.mean) }}>{!nv || nv.mean == null ? "-" : `${fmt(nv.mean)} (${nv.ndays})`}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 11, color: dim, marginBottom: 4 }}>composite IC over time</div>
            <Sparkline series={blk.composite_series} />
          </div>
        </div>
      ))}
    </div>
  );
}
