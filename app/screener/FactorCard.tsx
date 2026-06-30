"use client";

import {
  Row, ACT, ACTION_LABEL, ACTION_ARROW, FONT_DISPLAY, FONT_MONO,
  PILLARS, pillarColor, driverLine, buildWhy, macroDelta, capLabel,
  companyName, valPos,
} from "./lib";

export default function FactorCard({
  r, isGem, pctRank, callout,
}: {
  r: Row;
  isGem: boolean;
  pctRank: number;
  callout: "cheap" | "rich" | null;
}) {
  const act = ACT[r.action];
  const actC = act.c;
  const arrow = ACTION_ARROW[r.action];
  const label = ACTION_LABEL[r.action];
  const cap = capLabel(r.mktcap);
  const name = companyName(r.ticker);
  const md = macroDelta(r);
  const why = buildWhy(r);

  const badge = (text: string, color: string, bg: string, brd: string) => (
    <span style={{
      fontFamily: FONT_MONO, fontSize: 11, fontWeight: 700, letterSpacing: ".08em",
      color, background: bg, border: `1px solid ${brd}`, borderRadius: 5,
      padding: "1px 7px", whiteSpace: "nowrap", flexShrink: 0,
    }}>{text}</span>
  );

  return (
    <details name="qntm-cards" style={{
      marginBottom: 6, background: "rgba(255,255,255,.02)",
      border: "1px solid rgba(255,255,255,.06)", borderLeft: `3px solid ${actC}`,
      borderRadius: 8, overflow: "hidden",
    }}>
      {/* ── Collapsed summary ── */}
      <summary style={{
        listStyle: "none", cursor: "pointer", display: "flex",
        justifyContent: "space-between", alignItems: "center", padding: "13px 18px",
      }}>
        <div style={{ minWidth: 0, flex: 1, overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontFamily: FONT_DISPLAY, fontSize: 15, fontWeight: 800, color: "#e2e8f0", whiteSpace: "nowrap" }}>
              {r.ticker}{isGem ? " 💎" : ""}
            </span>
            {cap && badge(cap, "#8896ac", "rgba(136,150,172,.10)", "rgba(136,150,172,.20)")}
            {callout === "cheap" && badge("◆ CHEAP", "#34d399", "rgba(52,211,153,.12)", "rgba(52,211,153,.32)")}
            {callout === "rich" && badge("◆ RICH", "#f87171", "rgba(248,113,113,.12)", "rgba(248,113,113,.32)")}
            {name && (
              <span style={{ fontSize: 13, color: "#94a3b8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {name}
              </span>
            )}
          </div>
          <div style={{ fontFamily: FONT_DISPLAY, fontSize: 13, fontWeight: 700, color: actC, letterSpacing: ".06em", marginTop: 1 }}>
            {arrow} {label}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0, marginLeft: 8 }}>
          <span style={{ fontFamily: FONT_MONO, fontSize: 20, fontWeight: 700, color: actC }}>{r.score.toFixed(0)}</span>
          <span style={{ fontSize: 14, color: actC }}>{arrow}</span>
          <span style={{ fontSize: 13, color: "#94a3b8" }}>›</span>
        </div>
      </summary>

      {/* ── Expanded detail ── */}
      <div style={{ padding: "0 20px 20px", borderTop: "1px solid rgba(255,255,255,.05)" }}>
        {/* price + sector + driver */}
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", padding: "10px 0 12px" }}>
          {r.price != null && (
            <span style={{ fontFamily: FONT_MONO, fontSize: 13, color: "#d4a843" }}>
              ${r.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              {r.signal_date && <span style={{ fontSize: 13, color: "#94a3b8" }}> · {r.signal_date}</span>}
            </span>
          )}
          <span style={{ fontSize: 13, color: "#8896ac" }}>{(r.sector || "").slice(0, 20)}</span>
          <span style={{ fontSize: 13, color: "#8896ac" }}>{driverLine(r)}</span>
        </div>

        {/* pillar bars */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 8, marginBottom: 16 }}>
          {PILLARS.map((p) => {
            const v = r[p.key] as number;
            const pc = pillarColor(v);
            return (
              <div key={p.short} style={{ flex: 1, minWidth: 72 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
                  <span style={{ fontSize: 13, color: "#9fabc0" }}>{p.full}</span>
                  <span style={{ fontFamily: FONT_MONO, fontSize: 13, color: pc, fontWeight: 700 }}>{v.toFixed(0)}</span>
                </div>
                <div style={{ background: "rgba(255,255,255,.05)", borderRadius: 3, height: 4, overflow: "hidden" }}>
                  <div style={{ width: `${v}%`, height: "100%", background: pc, borderRadius: 3 }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* QUANT / MACRO / BLEND / PERCENTILE */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 5, paddingTop: 10, borderTop: "1px solid rgba(255,255,255,.04)" }}>
          {[
            { k: "QUANT", v: r.composite.toFixed(1), c: "#b3bed0" },
            { k: "MACRO", v: md.str, c: md.color },
            { k: "BLEND", v: "75/25", c: "#d4a843" },
            { k: "PERCENTILE", v: `${Math.round(pctRank)}`, c: "#b3bed0", suffix: "/100" },
          ].map((box) => (
            <div key={box.k} style={{ background: "rgba(255,255,255,.03)", borderRadius: 4, padding: "6px 10px" }}>
              <div style={{ fontSize: 13, color: "#8896ac", letterSpacing: ".06em", marginBottom: 2 }}>{box.k}</div>
              <div style={{ fontFamily: FONT_MONO, fontSize: 14, color: box.c }}>
                {box.v}{box.suffix && <span style={{ fontSize: 11, color: "#7e8aa0" }}>{box.suffix}</span>}
              </div>
            </div>
          ))}
        </div>

        {/* value-position bar */}
        <ValueRange r={r} />

        {/* why this score */}
        {why.length > 0 && (
          <div style={{
            fontSize: 13, lineHeight: 1.6, padding: "8px 10px", marginTop: 8,
            background: "rgba(255,255,255,.02)", borderRadius: 4, borderLeft: "2px solid rgba(255,255,255,.08)",
          }}>
            <span style={{ fontFamily: FONT_MONO, fontSize: 13, color: "#8896ac", letterSpacing: ".08em" }}>WHY THIS SCORE · </span>
            {why.map((s, i) => (
              <span key={i} style={{ color: s.color }}>{s.text}{i < why.length - 1 ? " " : ""}</span>
            ))}
          </div>
        )}
      </div>
    </details>
  );
}

// ── Value-position bar (in-band zone + out-of-band states) ───────────────────
function ValueRange({ r }: { r: Row }) {
  if ((r.val_basis || "na") === "na" || r.val_low == null || r.val_high == null) return null;
  const lo = r.val_low, hi = r.val_high, pr = r.price;
  let raw: number | null = null, pos: number | null = null;
  if (pr != null && hi > lo) { raw = ((pr - lo) / (hi - lo)) * 100; pos = Math.max(0, Math.min(100, raw)); }
  else if (r.value_position != null) { pos = Math.max(0, Math.min(100, r.value_position)); raw = pos; }
  if (pos == null) return null;

  const basisNote = r.val_basis === "valuation" ? "" : " · technical range";
  const cur = pr != null ? `$${pr.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "—";
  const outOfBand = raw != null && (raw < -0.5 || raw > 100.5);
  const fmt = (n: number) => `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const wrap = { marginTop: 14, paddingTop: 12, borderTop: "1px solid rgba(255,255,255,.04)" } as const;
  const headRow = { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 7 } as const;

  if (!outOfBand) {
    let zone = "Mid range", zc = "#fbbf24";
    if (pos <= 20) { zone = "Lower range"; zc = "#34d399"; }
    else if (pos <= 40) { zone = "Lower-mid range"; zc = "#86efac"; }
    else if (pos <= 60) { zone = "Mid range"; zc = "#fbbf24"; }
    else if (pos <= 80) { zone = "Upper-mid range"; zc = "#fb923c"; }
    else { zone = "Upper range"; zc = "#f87171"; }
    return (
      <div style={wrap}>
        <div style={headRow}>
          <span style={{ fontSize: 13, color: "#8896ac", letterSpacing: ".06em" }}>VALUE POSITION</span>
          <span style={{ fontFamily: FONT_MONO, fontSize: 13, color: zc, fontWeight: 700 }}>{pos.toFixed(0)}% · {zone}</span>
        </div>
        <div style={{ position: "relative", height: 8, borderRadius: 5, background: "linear-gradient(90deg,#34d399 0%,#fbbf24 50%,#f87171 100%)" }}>
          <div style={{ position: "absolute", top: -3, left: `calc(${pos.toFixed(1)}% - 2px)`, width: 4, height: 14, borderRadius: 2, background: "#e8edf4", boxShadow: "0 0 4px rgba(0,0,0,.6)" }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 5, fontFamily: FONT_MONO, fontSize: 12, color: "#7e8aa0" }}>
          <span>{fmt(lo)}</span>
          <span style={{ color: "#9fabc0" }}>{cur} now{basisNote}</span>
          <span>{fmt(hi)}</span>
        </div>
      </div>
    );
  }

  // out-of-band
  const below = (raw as number) < 0;
  const state = below ? "Below fair-value band" : "Above fair-value band";
  const sc = below ? "#34d399" : "#f87171";
  const mark = below ? 0 : 100;
  const dist = below
    ? (lo ? ((lo - (pr as number)) / lo) * 100 : 0)
    : (hi ? (((pr as number) - hi) / hi) * 100 : 0);
  const distTxt = below ? `price is ${dist.toFixed(0)}% below the band floor` : `price is ${dist.toFixed(0)}% above the band ceiling`;
  return (
    <div style={wrap}>
      <div style={headRow}>
        <span style={{ fontSize: 13, color: "#8896ac", letterSpacing: ".06em" }}>VALUE POSITION</span>
        <span style={{ fontFamily: FONT_MONO, fontSize: 13, color: sc, fontWeight: 700 }}>{state}</span>
      </div>
      <div style={{ position: "relative", height: 8, borderRadius: 5, background: "linear-gradient(90deg,#34d399 0%,#fbbf24 50%,#f87171 100%)", opacity: 0.45 }}>
        <div style={{ position: "absolute", top: -3, left: `calc(${mark}% - 2px)`, width: 4, height: 14, borderRadius: 2, background: "#e8edf4", boxShadow: "0 0 4px rgba(0,0,0,.6)" }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 5, fontFamily: FONT_MONO, fontSize: 12, color: "#7e8aa0" }}>
        <span style={{ color: "#9fabc0" }}>{cur} now{basisNote}</span>
        <span>band {fmt(lo)}–{fmt(hi)}</span>
      </div>
      <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: sc, marginTop: 4 }}>{distTxt}</div>
    </div>
  );
}
