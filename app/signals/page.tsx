import type { Metadata } from "next";
//
export const revalidate = 1800;
//
export const metadata: Metadata = {
  title: "Signal Archive | QNTM",
  description:
    "The complete forward-only record of QNTM model signals, delayed 14 days. Winners and losers, measured against SPY.",
};
//
type Row = {
  ticker: string; kind: string; event_date: string; days_ago: number;
  price_then: number; price_now: number; move_pct: number;
  spy_move_pct: number | null; excess_pct: number | null;
  hit: boolean | null; is_call: boolean; group: string;
};
type Payload = {
  scope: string; delay_days: number; withheld_count: number;
  count: number; n_calls: number; n_unrated: number;
  since: string | null; as_of: string | null; benchmark: string;
  kinds: Record<string, number>;
  hit_rates: Record<string, number | string>;
  notes: Record<string, string>;
  signals: Row[];
};
//
const API_BASE =
  process.env.API_BASE || process.env.NEXT_PUBLIC_API_BASE || "https://qntm-api.onrender.com";
//
const KIND_LABEL: Record<string, string> = {
  entered_high: "Entered High", sustained_high: "Sustained High",
  weakened: "Downgraded", sustained_low: "Not rated",
};
//
const C = {
  bg: "#0b0d10", panel: "#12151a", line: "#232830", text: "#e8ecf1",
  dim: "#8b95a5", up: "#4ade80", down: "#f87171", accent: "#60a5fa",
};
const MONO = 'ui-monospace, SFMono-Regular, Menlo, Monaco, "Courier New", monospace';
//
function pct(v: number | null | undefined, d = 1) {
  if (v === null || v === undefined || Number.isNaN(v)) return "—";
  return (v > 0 ? "+" : "") + v.toFixed(d) + "%";
}
function tone(v: number | null | undefined) {
  if (v === null || v === undefined) return C.dim;
  return v > 0 ? C.up : v < 0 ? C.down : C.dim;
}
//
export default async function SignalsPage() {
  let data: Payload | null = null;
  try {
    const r = await fetch(`${API_BASE}/api/signals?scope=public`, { next: { revalidate: 1800 } });
    if (r.ok) data = await r.json();
  } catch {}
  //
  const calls = (data?.signals || []).filter((s) => s.is_call);
  const unrated = (data?.signals || []).filter((s) => s.group === "unrated");
  const hr = data?.hit_rates || {};
  const beat = typeof hr.high_beat_rate === "number" ? hr.high_beat_rate : null;
  const beatN = typeof hr.high_n === "number" ? hr.high_n : null;
  const win = typeof hr.window === "number" ? hr.window : 10;
  //
  return (
    <main style={{ background: C.bg, color: C.text, minHeight: "100vh", fontFamily: MONO }}>
      <header style={{ borderBottom: `1px solid ${C.line}`, padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <a href="/" style={{ color: C.text, textDecoration: "none", fontWeight: 700, letterSpacing: 2 }}>QNTM</a>
        <span style={{ display: "flex", gap: 16, fontSize: 13 }}>
          <a href="/login" style={{ color: C.dim, textDecoration: "none" }}>Sign in</a>
          <a href="/register" style={{ color: C.accent, textDecoration: "none" }}>Join free</a>
        </span>
      </header>
      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "32px 20px 80px" }}>
        <h1 style={{ fontSize: 26, margin: "0 0 6px" }}>Signal Archive</h1>
        <p style={{ color: C.dim, fontSize: 14, lineHeight: 1.6, margin: "0 0 28px", maxWidth: 720 }}>
          Every signal the model has produced, winners and losers, measured against {data?.benchmark || "SPY"}.
          Nothing is removed. Recent signals are withheld for {data?.delay_days ?? 14} days
          — by date only, never by outcome.
        </p>
        {!data ? (
          <p style={{ color: C.down }}>The archive is temporarily unavailable. Please try again shortly.</p>
        ) : (
        <>
        <section style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 10, padding: 20, marginBottom: 28 }}>
          <div style={{ fontSize: 12, color: C.dim, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>
            High-conviction signals vs {hr.benchmark || "SPY"}
          </div>
          <div style={{ fontSize: 40, fontWeight: 700, lineHeight: 1 }}>
            {beat === null ? "—" : beat.toFixed(1) + "%"}
          </div>
          <div style={{ color: C.dim, fontSize: 13, marginTop: 8, lineHeight: 1.6 }}>
            beat {hr.benchmark || "SPY"} over a fixed {win}-session window
            {beatN !== null ? ` · n = ${beatN} signals` : ""}
            {hr.since ? ` · since ${hr.since}` : ""}
          </div>
          <div style={{ color: C.dim, fontSize: 12, marginTop: 14, lineHeight: 1.6, borderTop: `1px solid ${C.line}`, paddingTop: 12 }}>
            That is close to a coin flip, and it is the number measured on every
            qualifying signal — not a selected subset. It is computed on the full
            population including signals still inside the {data.delay_days}-day
            window below.
          </div>
        </section>
        {data.withheld_count > 0 && (
          <section style={{ border: `1px dashed ${C.line}`, borderRadius: 10, padding: 18, marginBottom: 28, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: 15 }}>🔒 {data.withheld_count} signals from the last {data.delay_days} days</div>
              <div style={{ color: C.dim, fontSize: 12, marginTop: 6 }}>
                Held back by date, not by result. They join the public record automatically.
              </div>
            </div>
            <a href="/register" style={{ background: C.accent, color: "#08111f", padding: "10px 18px", borderRadius: 6, textDecoration: "none", fontSize: 13, fontWeight: 700 }}>See them live</a>
          </section>
        )}
        <h2 style={{ fontSize: 15, margin: "0 0 4px" }}>The record · {calls.length} signals</h2>
        <p style={{ color: C.dim, fontSize: 12, margin: "0 0 12px" }}>
          {data.since ? `From ${data.since}. ` : ""}Prices as of {data.as_of || "the latest session"}.
          Excess = the stock&apos;s move minus {data.benchmark}&apos;s over the same dates.
        </p>
        <div style={{ overflowX: "auto", border: `1px solid ${C.line}`, borderRadius: 10 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ color: C.dim, textAlign: "right" }}>
                <th style={{ padding: "10px 12px", textAlign: "left" }}>Date</th>
                <th style={{ padding: "10px 12px", textAlign: "left" }}>Ticker</th>
                <th style={{ padding: "10px 12px", textAlign: "left" }}>Signal</th>
                <th style={{ padding: "10px 12px" }}>Price then</th>
                <th style={{ padding: "10px 12px" }}>Move</th>
                <th style={{ padding: "10px 12px" }}>{data.benchmark}</th>
                <th style={{ padding: "10px 12px" }}>Excess</th>
              </tr>
            </thead>
            <tbody>
              {calls.map((s, i) => (
                <tr key={`${s.ticker}-${s.event_date}-${i}`} style={{ borderTop: `1px solid ${C.line}`, textAlign: "right" }}>
                  <td style={{ padding: "9px 12px", textAlign: "left", color: C.dim }}>{s.event_date}</td>
                  <td style={{ padding: "9px 12px", textAlign: "left", fontWeight: 700 }}>{s.ticker}</td>
                  <td style={{ padding: "9px 12px", textAlign: "left", color: C.dim }}>{KIND_LABEL[s.kind] || s.kind}</td>
                  <td style={{ padding: "9px 12px", color: C.dim }}>${s.price_then?.toFixed(2)}</td>
                  <td style={{ padding: "9px 12px", color: tone(s.move_pct) }}>{pct(s.move_pct)}</td>
                  <td style={{ padding: "9px 12px", color: C.dim }}>{pct(s.spy_move_pct)}</td>
                  <td style={{ padding: "9px 12px", color: tone(s.excess_pct), fontWeight: 700 }}>{pct(s.excess_pct)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <details style={{ marginTop: 28 }}>
          <summary style={{ cursor: "pointer", fontSize: 14 }}>
            Names the model did not rate · {unrated.length}
          </summary>
          <p style={{ color: C.dim, fontSize: 12, lineHeight: 1.6, margin: "10px 0 12px", maxWidth: 720 }}>
            A LOW score means the absence of conviction, not a bearish call. This bucket is
            mostly microcaps and sub-dollar names the model never rated, so it is shown for
            completeness and excluded from the figure above.
          </p>
          <div style={{ overflowX: "auto", border: `1px solid ${C.line}`, borderRadius: 10 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <tbody>
                {unrated.map((s, i) => (
                  <tr key={`${s.ticker}-${s.event_date}-u${i}`} style={{ borderTop: `1px solid ${C.line}`, textAlign: "right" }}>
                    <td style={{ padding: "7px 12px", textAlign: "left", color: C.dim }}>{s.event_date}</td>
                    <td style={{ padding: "7px 12px", textAlign: "left" }}>{s.ticker}</td>
                    <td style={{ padding: "7px 12px", color: C.dim }}>${s.price_then?.toFixed(2)}</td>
                    <td style={{ padding: "7px 12px", color: tone(s.move_pct) }}>{pct(s.move_pct)}</td>
                    <td style={{ padding: "7px 12px", color: tone(s.excess_pct) }}>{pct(s.excess_pct)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
        <section style={{ marginTop: 36, borderTop: `1px solid ${C.line}`, paddingTop: 18, color: C.dim, fontSize: 12, lineHeight: 1.7 }}>
          <div style={{ color: C.text, marginBottom: 8 }}>Method</div>
          <div>{data.notes?.thresholds}</div>
          <div>{data.notes?.universe}</div>
          <div style={{ marginTop: 8 }}>
            Outcomes are reported relative to {data.benchmark}, never as an absolute return.
            The record is forward-only: published entries are never revised or removed.
          </div>
          <div style={{ marginTop: 12 }}>
            Past performance does not predict future results. Nothing here is investment advice.
          </div>
        </section>
        </>
        )}
      </div>
    </main>
  );
}
