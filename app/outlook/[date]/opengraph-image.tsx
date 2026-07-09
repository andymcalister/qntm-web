// app/outlook/[date]/opengraph-image.tsx
// Enriched Market Outlook OG card — regime + conviction + VIX + WTI, read from
// that date's stored outlook row (historically accurate). Hardened for Satori:
// all flex, no spans, params awaited, fetch guarded.
import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const revalidate = 3600;
export const alt = "QNTM Market Outlook";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const API = process.env.API_BASE || process.env.NEXT_PUBLIC_API_BASE || "https://qntm-api.onrender.com";
const GREEN = "#34d399", RED = "#f87171", GOLD = "#d4a843", MUTED = "#9fabc0", DIM = "#64748b";

function prettyDate(d: string): string {
  try { return new Date(d + "T12:00:00Z").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }); }
  catch { return d; }
}

export default async function Image({ params }: { params: Promise<{ date: string }> }) {
  let date = "";
  try { date = (await params).date || ""; } catch { date = ""; }

  let regime = "", conviction: number | null = null, vix: number | null = null, wti: number | null = null;
  try {
    const r = await fetch(`${API}/api/outlook/by-date/${date}?kind=outlook`, { next: { revalidate } });
    if (r.ok) {
      const o = await r.json();
      regime = typeof o?.regime === "string" ? o.regime : "";
      conviction = typeof o?.regime_score === "number" ? o.regime_score : (typeof o?.conviction === "number" ? o.conviction : null);
      vix = typeof o?.vix === "number" ? o.vix : null;
      wti = typeof o?.wti === "number" ? o.wti : null;
    }
  } catch {}

  const regimeColor = /bull/i.test(regime) ? GREEN : /bear|risk_off/i.test(regime) ? RED : GOLD;
  const hasRegime = !!regime;

  const chip = (label: string, value: string, color: string) => (
    <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
      <div style={{ display: "flex", fontSize: 24, color: DIM }}>{label}</div>
      <div style={{ display: "flex", fontSize: 30, fontWeight: 700, color }}>{value}</div>
    </div>
  );

  const chips: any[] = [];
  if (conviction != null) chips.push(chip("Conviction", `${conviction}/100`, "#e2e8f0"));
  if (vix != null) chips.push(chip("VIX", vix.toFixed(1), "#e2e8f0"));
  if (wti != null) chips.push(chip("WTI", `$${wti.toFixed(0)}`, "#e2e8f0"));

  return new ImageResponse(
    (
      <div style={{ display: "flex", flexDirection: "column", width: "1200px", height: "630px", background: "#08090c", padding: "56px 72px", fontFamily: "system-ui, sans-serif", color: "#ffffff" }}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <div style={{ display: "flex", fontSize: 52, fontWeight: 800, color: "#ffffff" }}>Q</div>
          <div style={{ display: "flex", fontSize: 52, fontWeight: 800, color: GREEN }}>NTM</div>
          <div style={{ display: "flex", fontSize: 20, color: MUTED, marginLeft: 18, letterSpacing: "3px", paddingTop: 16 }}>MARKET OUTLOOK</div>
        </div>
        <div style={{ display: "flex", fontSize: 24, color: MUTED, marginTop: 12 }}>{prettyDate(date)}</div>

        <div style={{ display: "flex", flexDirection: "column", marginTop: 44 }}>
          <div style={{ display: "flex", fontSize: 22, color: MUTED, letterSpacing: "4px" }}>MARKET REGIME</div>
          <div style={{ display: "flex", fontSize: 84, fontWeight: 800, color: regimeColor, marginTop: 4 }}>
            {hasRegime ? regime.toUpperCase() : "DAILY READ"}
          </div>
        </div>

        {chips.length > 0 ? (
          <div style={{ display: "flex", gap: 36, marginTop: 32, flexWrap: "wrap" }}>{chips}</div>
        ) : (
          <div style={{ display: "flex", fontSize: 28, color: MUTED, marginTop: 32 }}>1,400+ US stocks scored daily</div>
        )}

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "auto", borderTop: "1px solid rgba(255,255,255,0.10)", paddingTop: 22 }}>
          <div style={{ display: "flex", fontSize: 28, fontWeight: 700, color: GREEN }}>qntm.live</div>
          <div style={{ display: "flex", fontSize: 20, color: MUTED }}>Five-factor model · live macro overlay</div>
        </div>
      </div>
    ),
    { ...size }
  );
}
