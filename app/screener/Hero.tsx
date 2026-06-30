"use client";

import { FONT_DISPLAY, FONT_MONO, companyName, Row } from "./lib";

export type Mover = {
  kind: "mover" | "macro_summary";
  ticker?: string; now?: number; prev?: number; delta?: number;
  quant_delta?: number; macro_only?: boolean;
  now_tier?: string; prev_tier?: string; driver?: string | null; driver_delta?: number;
  count?: number; up?: boolean; lo?: number; hi?: number;
};

const TIER_COL: Record<string, string> = { HIGH: "#34d399", MOD: "#fbbf24", LOW: "#f87171" };

function regimeColor(regime: string): string {
  const ru = (regime || "").toUpperCase();
  if (ru.includes("HIGH VOL")) return "#fb923c";
  if (ru.includes("RISK_OFF") || ru.includes("RISK OFF")) return "#fbbf24";
  if (ru.includes("RISK_ON") || ru.includes("RISK ON") || ru.includes("BULL")) return "#34d399";
  return "#9fabc0";
}

function Chip({ m }: { m: Mover }) {
  if (m.kind === "macro_summary") {
    const up = !!m.up;
    const col = up ? "#34d399" : "#f87171";
    const arr = up ? "▲" : "▼";
    const lo = Math.round(m.lo ?? 0), hi = Math.round(m.hi ?? 0);
    const rng = lo === hi ? `${arr}${Math.abs(lo)}` : `${arr}${Math.abs(lo)}–${Math.abs(hi)}`;
    return (
      <span style={{ display: "inline-flex", flexDirection: "column", gap: 4, padding: "8px 13px", margin: "0 9px 9px 0", background: "rgba(212,168,67,.06)", border: "1px solid rgba(212,168,67,.28)", borderRadius: 10, whiteSpace: "nowrap", verticalAlign: "top" }}>
        <span style={{ fontFamily: FONT_MONO, fontSize: 13, color: "#d4a843", fontWeight: 600 }}>MACRO REGIME SHIFT</span>
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 12, color: "#b3bed0" }}>{m.count} names moved together</span>
          <span style={{ fontFamily: FONT_MONO, fontSize: 12, color: col }}>{rng}</span>
        </span>
      </span>
    );
  }
  const up = (m.delta ?? 0) >= 0;
  const col = up ? "#34d399" : "#f87171";
  const arr = up ? "▲" : "▼";
  const nt = m.now_tier || "MOD", pt = m.prev_tier || nt;
  const ntc = TIER_COL[nt] || "#8896ac";
  const crossed = nt !== pt;
  const name = companyName(m.ticker || "");
  const dd = m.driver_delta ?? 0;
  return (
    <span style={{ display: "inline-flex", flexDirection: "column", gap: 4, padding: "8px 13px", margin: "0 9px 9px 0", background: "rgba(255,255,255,.025)", border: "1px solid rgba(255,255,255,.07)", borderRadius: 10, whiteSpace: "nowrap", verticalAlign: "top" }}>
      <span style={{ display: "flex", alignItems: "center", gap: 7 }}>
        <span style={{ fontFamily: FONT_MONO, fontSize: 13, color: "#e7ecf3", fontWeight: 600 }}>{m.ticker}</span>
        {name && <span style={{ fontSize: 11, color: "#6b7686", maxWidth: 130, overflow: "hidden", textOverflow: "ellipsis" }}>{name}</span>}
      </span>
      <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontFamily: FONT_MONO, fontSize: 12, color: "#8896ac" }}>
          {(m.prev ?? 0).toFixed(0)}→<span style={{ color: ntc, fontWeight: 600 }}>{(m.now ?? 0).toFixed(0)}</span>
        </span>
        <span style={{ fontFamily: FONT_MONO, fontSize: 12, color: col }}>{arr}{Math.abs(m.delta ?? 0).toFixed(0)}</span>
        {crossed ? (
          <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: ntc, fontWeight: 600, border: `1px solid ${ntc}55`, borderRadius: 5, padding: "1px 6px" }}>{arr} {nt}</span>
        ) : (
          <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: ntc, opacity: 0.85 }}>{nt}</span>
        )}
        {m.driver && (
          <span style={{ fontSize: 11, color: "#6b7686" }}>· {m.driver} {dd >= 0 ? "+" : ""}{dd.toFixed(0)}</span>
        )}
      </span>
    </span>
  );
}

export default function Hero({ movers, regime, fallback }: { movers: Mover[]; regime: string; fallback: Row[] }) {
  const rcol = regimeColor(regime);
  const rlab = (regime || "NEUTRAL").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const hasMovers = movers.length > 0;
  const dur = Math.max(24, movers.length * 4);

  return (
    <div style={{ background: "linear-gradient(180deg,rgba(212,168,67,.06),rgba(0,0,0,0))", border: "1px solid rgba(212,168,67,.18)", borderRadius: 12, padding: "16px 18px", marginTop: 14, marginBottom: 14 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
        <span style={{ fontFamily: FONT_DISPLAY, fontSize: 12, letterSpacing: ".14em", color: "#9fabc0", textTransform: "uppercase" }}>Today at a glance</span>
        <span style={{ fontFamily: FONT_MONO, fontSize: 12, color: rcol }}>● Macro regime: {rlab}</span>
      </div>

      {hasMovers ? (
        <>
          <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: "#9fabc0", letterSpacing: ".06em", marginBottom: 8 }}>
            TODAY&apos;S CONVICTION MOVES <span style={{ color: "#6b7686" }}>· since last scored</span>
          </div>
          <div className="qntm-mv-wrap">
            <div className="qntm-mv" style={{ display: "inline-flex", animationDuration: `${dur}s` }}>
              <span style={{ display: "inline-flex" }}>{movers.map((m, i) => <Chip key={i} m={m} />)}</span>
              <span className="qntm-mv-dup" aria-hidden style={{ display: "inline-flex" }}>{movers.map((m, i) => <Chip key={`d${i}`} m={m} />)}</span>
            </div>
          </div>
          <style>{`
            @keyframes qntm-mv-scroll{from{transform:translateX(0)}to{transform:translateX(-50%)}}
            .qntm-mv-wrap{width:100%;margin-bottom:4px;overflow-x:auto;overflow-y:hidden;-webkit-overflow-scrolling:touch;scrollbar-width:none;-webkit-mask-image:linear-gradient(90deg,transparent,#000 4%,#000 96%,transparent);mask-image:linear-gradient(90deg,transparent,#000 4%,#000 96%,transparent);}
            .qntm-mv-wrap::-webkit-scrollbar{display:none;}
            .qntm-mv-dup{display:none;}
            @media (hover:hover) and (pointer:fine){
              .qntm-mv-wrap{overflow:hidden;}
              .qntm-mv-dup{display:inline-flex;}
              .qntm-mv{animation-name:qntm-mv-scroll;animation-timing-function:linear;animation-iteration-count:infinite;}
              .qntm-mv-wrap:hover .qntm-mv{animation-play-state:paused;}
            }
            @media (prefers-reduced-motion:reduce){
              .qntm-mv{animation:none!important;}
              .qntm-mv-wrap{overflow-x:auto;}
              .qntm-mv-dup{display:none;}
            }
          `}</style>
        </>
      ) : (
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {fallback.slice(0, 3).map((r) => {
            const score = r.score;
            const lbl = score >= 60 ? "High" : score >= 45 ? "Moderate" : "Low";
            const lc = score >= 60 ? "#34d399" : score >= 45 ? "#fbbf24" : "#f87171";
            const nm = companyName(r.ticker) || r.ticker;
            return (
              <div key={r.ticker} style={{ flex: 1, minWidth: 118, background: "rgba(255,255,255,.02)", border: "1px solid rgba(255,255,255,.06)", borderRadius: 8, padding: "10px 12px" }}>
                <div style={{ fontFamily: FONT_MONO, fontSize: 14, color: "#e7ecf3", fontWeight: 600 }}>{r.ticker}</div>
                <div style={{ fontSize: 11, color: "#6b7686", margin: "2px 0 6px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{nm}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 11, color: lc, fontWeight: 600 }}>{lbl} conviction</span>
                  <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: "#8896ac" }}>{score.toFixed(0)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10, paddingTop: 12, marginTop: 12, borderTop: "1px solid rgba(255,255,255,.06)" }}>
        <span style={{ fontSize: 12, color: "#b3bed0" }}>⚡ Conviction-change alerts flag the moment a name shifts tier (Pro).</span>
        <span style={{ fontSize: 12, color: "#6b7686" }}>New here? Open any stock for its plain-English rationale and 5-pillar breakdown.</span>
      </div>
    </div>
  );
}
