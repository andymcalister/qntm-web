"use client";

import { FONT_DISPLAY, FONT_MONO } from "./lib";

export type MacroDriver = { label: string; contribution: number; signals: number; event: string | null };
export type Macro = {
  regime: string;
  vix: number | null;
  oil_price: number | null;
  active_events: string[];
  source: string | null;
  live: boolean;
  headlines_scanned: number;
  narrative: string | null;
  summary: string | null;
  regime_score: number | null;
  drivers: MacroDriver[];
  event_headlines: Record<string, string[]>;
};

const REGIME_CFG: Record<string, { color: string; bg: string; border: string; icon: string; desc: string }> = {
  RISK_ON: { color: "#1D9E75", bg: "rgba(29,158,117,.08)", border: "rgba(29,158,117,.25)", icon: "●", desc: "Macro overlay amplifying high-conviction signals" },
  "MILDLY BULLISH": { color: "#4ade80", bg: "rgba(74,222,128,.06)", border: "rgba(74,222,128,.2)", icon: "◕", desc: "Mildly bullish environment — quant signals favoured" },
  NEUTRAL: { color: "#d4a843", bg: "rgba(212,168,67,.07)", border: "rgba(212,168,67,.2)", icon: "◐", desc: "Macro overlay at baseline — minimal sector adjustment" },
  RISK_OFF: { color: "#f87171", bg: "rgba(248,113,113,.07)", border: "rgba(248,113,113,.2)", icon: "●", desc: "Macro dampening active — high-beta exposure reduced" },
  "HIGH VOLATILITY": { color: "#f97316", bg: "rgba(249,115,22,.07)", border: "rgba(249,115,22,.2)", icon: "⚡", desc: "High volatility — macro overlay at maximum dampening" },
};
const MACRO_W: Record<string, number> = { RISK_OFF: 25, "HIGH VOLATILITY": 25, RISK_ON: 15, "MILDLY BULLISH": 15, NEUTRAL: 10 };
const NICE_EVENT: Record<string, string> = {
  tariff_broad: "Tariff Headwinds", tariff_relief: "Tariff Relief", fed_hawkish: "Fed Hawkish",
  fed_dovish: "Fed Dovish", recession_signal: "Recession Signal", war_escalation: "War Escalation",
  chip_export_ban: "Chip Export Ban", oil_spike: "Oil Spike",
};

const niceEvent = (e: string) => NICE_EVENT[e] || e.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
const vixColor = (v: number) => (v >= 30 ? "#f87171" : v >= 20 ? "#fbbf24" : "#1D9E75");
const oilColor = (v: number) => (v >= 90 ? "#f87171" : v >= 75 ? "#fbbf24" : "#1D9E75");

export default function MacroBanner({ m }: { m: Macro }) {
  const cfg = REGIME_CFG[m.regime] || REGIME_CFG.NEUTRAL;
  const macroW = MACRO_W[m.regime] ?? 25;
  const quantW = 100 - macroW;
  const summaryTxt = (m.narrative || m.summary || "").trim();

  const stat = (value: React.ReactNode, label: string, valColor = "#e2e8f0", title?: string) => (
    <div style={{ textAlign: "center", cursor: title ? "help" : "default" }} title={title}>
      <div style={{ fontFamily: FONT_MONO, fontSize: 20, fontWeight: 700, color: valColor }}>{value}</div>
      <div style={{ fontSize: 14, color: "#b3bed0", marginTop: 3, letterSpacing: ".04em" }}>{label}</div>
    </div>
  );

  return (
    <div style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: 8, padding: "14px 20px", marginTop: 14, marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        {/* left: regime block */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
          <span style={{ color: cfg.color, fontSize: 13 }}>{cfg.icon}</span>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
              <span style={{ fontFamily: FONT_DISPLAY, fontSize: 13, fontWeight: 700, color: cfg.color, letterSpacing: ".1em" }}>
                MACRO REGIME: {m.regime}
              </span>
              {m.live ? (
                <span style={{ fontSize: 13, color: "#1D9E75", marginLeft: 8 }}>
                  ⚡ Live{m.headlines_scanned ? ` · ${m.headlines_scanned} headlines` : ""}
                </span>
              ) : (
                <span style={{ fontSize: 13, color: "#b3bed0", marginLeft: 8 }}>Est. · no live feeds</span>
              )}
            </div>
            <div style={{ fontSize: 14, color: "#b3bed0", marginTop: 2 }}>{cfg.desc}</div>
            {summaryTxt && (
              <div style={{ fontSize: 13, color: "#cbd5e1", marginTop: 6, lineHeight: 1.5 }}>
                <span style={{ color: "#9fabc0" }}>News read:</span> {summaryTxt}
              </div>
            )}

            {/* drivers breakdown OR event chips */}
            {m.drivers.length > 0 ? (
              <div style={{ marginTop: 8, background: "rgba(0,0,0,.15)", borderRadius: 6, padding: "8px 11px" }}>
                <div style={{ fontSize: 12, color: "#9fabc0", letterSpacing: ".06em", marginBottom: 4 }}>WHAT&apos;S MOVING THE REGIME</div>
                {m.drivers.slice(0, 6).map((d, i) => {
                  const c = d.contribution || 0;
                  const cc = c < 0 ? "#f87171" : c > 0 ? "#34d399" : "#9fabc0";
                  const arr = c < 0 ? "▼" : c > 0 ? "▲" : "–";
                  const hls = (d.event && m.event_headlines[d.event]) || [];
                  return (
                    <div key={i}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "3px 0", borderBottom: "1px solid rgba(255,255,255,.04)" }}>
                        <span style={{ color: "#cbd5e1", fontSize: 13 }}>
                          {d.label}
                          <span style={{ color: "#6b7686", fontSize: 12 }}> · {d.signals} signal{d.signals !== 1 ? "s" : ""}</span>
                        </span>
                        <span style={{ fontFamily: FONT_MONO, fontSize: 13, color: cc }}>{arr} {c >= 0 ? "+" : ""}{c.toFixed(2)}</span>
                      </div>
                      {hls.slice(0, 2).map((h, j) => (
                        <div key={j} style={{ color: "#8b97aa", fontSize: 11.5, lineHeight: 1.5, padding: "1px 0 1px 11px", marginLeft: 2, borderLeft: "1px solid rgba(255,255,255,.07)" }}>·&nbsp;{h}</div>
                      ))}
                    </div>
                  );
                })}
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 5, paddingTop: 5, borderTop: "1px solid rgba(255,255,255,.08)" }}>
                  <span style={{ color: "#b3bed0", fontSize: 13 }}>Net regime score</span>
                  <span style={{ fontFamily: FONT_MONO, fontSize: 13, color: cfg.color }}>
                    {(m.regime_score ?? 0) >= 0 ? "+" : ""}{(m.regime_score ?? 0).toFixed(2)} → {macroW}% macro weight
                  </span>
                </div>
              </div>
            ) : (
              m.active_events.length > 0 && (
                <div style={{ marginTop: 6 }}>
                  {m.active_events.slice(0, 4).map((e) => (
                    <span key={e} style={{ background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.1)", borderRadius: 3, padding: "2px 8px", fontSize: 13, color: "#b3bed0", marginRight: 6 }}>
                      {niceEvent(e)}
                    </span>
                  ))}
                </div>
              )
            )}

            {/* collapsible: every active-event headline */}
            <HeadlinesDropdown m={m} />
          </div>
        </div>

        {/* right: stats */}
        <div style={{ display: "flex", gap: 20, flexWrap: "wrap", alignItems: "flex-start" }}>
          {stat(`${quantW}%`, "Quant Weight", "#e2e8f0", "Share of each score driven by the 5-pillar factor model (momentum, quality, volume, value, sentiment).")}
          {stat(`${macroW}%`, "Macro Weight", cfg.color, "Share of each score adjusted by the current macro regime — rises in RISK_OFF, drops in NEUTRAL.")}
          {stat(m.active_events.length, "Active Events", "#e2e8f0", "Macro events currently detected — tariffs, Fed stance, geopolitical risk, oil shocks.")}
          {m.vix != null && stat(m.vix.toFixed(1), "VIX", vixColor(m.vix), "CBOE Volatility Index. <15 calm, 15-25 elevated, >30 fear (forces RISK_OFF).")}
          {m.oil_price != null && stat(`$${m.oil_price.toFixed(0)}`, "WTI Crude", oilColor(m.oil_price), "WTI crude per barrel. >$90 triggers an oil_spike event; <$65 signals weak demand.")}
        </div>
      </div>
    </div>
  );
}

// Collapsed-by-default disclosure listing every active-event headline (matches
// the Streamlit banner's headlines expander). The inline preview above shows two
// per driver; this reveals the full set.
function HeadlinesDropdown({ m }: { m: Macro }) {
  const groups = Object.entries(m.event_headlines).filter(([, hs]) => hs.length > 0);
  const total = groups.reduce((n, [, hs]) => n + hs.length, 0);
  if (total === 0) return null;
  return (
    <details style={{ marginTop: 10 }}>
      <summary style={{ cursor: "pointer", listStyle: "none", fontFamily: FONT_MONO, fontSize: 12, color: "#9fabc0", letterSpacing: ".06em" }}>
        ▸ Show all headlines ({total})
      </summary>
      <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 10 }}>
        {groups.map(([ev, hs]) => (
          <div key={ev}>
            <div style={{ fontSize: 11, color: "#6b7686", letterSpacing: ".05em", marginBottom: 3, textTransform: "uppercase" }}>{niceEvent(ev)}</div>
            {hs.map((h, i) => (
              <div key={i} style={{ color: "#8b97aa", fontSize: 12, lineHeight: 1.55, padding: "2px 0 2px 11px", marginLeft: 2, borderLeft: "1px solid rgba(255,255,255,.07)" }}>·&nbsp;{h}</div>
            ))}
          </div>
        ))}
      </div>
    </details>
  );
}
