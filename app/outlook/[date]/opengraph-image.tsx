// app/outlook/[date]/opengraph-image.tsx
// Per-day Market Outlook OG card: regime + conviction. Hardened for Satori
// (every element display:flex, no spans), params awaited, fetch guarded.
import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const revalidate = 3600;
export const alt = "QNTM Market Outlook";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const API = process.env.API_BASE || process.env.NEXT_PUBLIC_API_BASE || "https://qntm-api.onrender.com";
const GREEN = "#34d399", GOLD = "#d4a843", RED = "#f87171", MUTED = "#9fabc0";

function prettyDate(d: string): string {
  try { return new Date(d + "T12:00:00Z").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }); }
  catch { return d; }
}

export default async function Image({ params }: { params: Promise<{ date: string }> }) {
  let date = "";
  try { date = (await params).date || ""; } catch { date = ""; }

  let regime = "";
  let score: number | null = null;
  try {
    const r = await fetch(`${API}/api/outlook/by-date/${date}?kind=outlook`, { next: { revalidate } });
    if (r.ok) {
      const o = await r.json();
      regime = typeof o?.regime === "string" ? o.regime : "";
      score = typeof o?.regime_score === "number" ? o.regime_score : null;
    }
  } catch { /* branded fallback */ }

  const regimeColor = /bull/i.test(regime) ? GREEN : /bear|risk_off/i.test(regime) ? RED : GOLD;
  const hasRegime = !!regime;

  return new ImageResponse(
    (
      <div style={{ display: "flex", flexDirection: "column", width: "1200px", height: "630px", background: "#08090c", padding: "64px 72px", fontFamily: "system-ui, sans-serif", color: "#ffffff" }}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <div style={{ display: "flex", fontSize: 54, fontWeight: 800, color: "#ffffff" }}>Q</div>
          <div style={{ display: "flex", fontSize: 54, fontWeight: 800, color: GREEN }}>NTM</div>
          <div style={{ display: "flex", fontSize: 20, color: MUTED, marginLeft: 18, letterSpacing: "3px", paddingTop: 18 }}>MARKET OUTLOOK</div>
        </div>

        <div style={{ display: "flex", fontSize: 26, color: MUTED, marginTop: 18 }}>{prettyDate(date)}</div>

        <div style={{ display: "flex", flexDirection: "column", marginTop: 48 }}>
          <div style={{ display: "flex", fontSize: 22, color: MUTED, letterSpacing: "4px" }}>MARKET REGIME</div>
          <div style={{ display: "flex", fontSize: 88, fontWeight: 800, color: regimeColor, marginTop: 4 }}>
            {hasRegime ? regime.toUpperCase() : "DAILY READ"}
          </div>
          {score != null ? (
            <div style={{ display: "flex", fontSize: 30, color: MUTED, marginTop: 8 }}>Conviction {score}/100</div>
          ) : (
            <div style={{ display: "flex", fontSize: 30, color: MUTED, marginTop: 8 }}>1,400+ US stocks scored daily</div>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "auto", borderTop: "1px solid rgba(255,255,255,0.10)", paddingTop: 24 }}>
          <div style={{ display: "flex", fontSize: 30, fontWeight: 700, color: GREEN }}>qntm.live</div>
          <div style={{ display: "flex", fontSize: 22, color: MUTED }}>Five-factor model · live macro overlay</div>
        </div>
      </div>
    ),
    { ...size }
  );
}
