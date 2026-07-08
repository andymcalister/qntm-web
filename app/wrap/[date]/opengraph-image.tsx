// app/wrap/[date]/opengraph-image.tsx
// Per-day OG card for a Day Wrap: Model vs SPY vs Beat, that date's real numbers.
// Fresh URL per day = X can't serve a cached card, so daily shares always render
// current data. Falls back to a branded card if the read fails.
import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const revalidate = 3600;
export const alt = "QNTM Day Wrap";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const API = process.env.API_BASE || process.env.NEXT_PUBLIC_API_BASE || "https://qntm-api.onrender.com";
const GREEN = "#34d399", RED = "#f87171", BG = "#08090c", MUTED = "#9fabc0";

function pct(n: number | null | undefined): string {
  if (n == null) return "—";
  return `${n >= 0 ? "+" : ""}${Number(n).toFixed(2)}%`;
}
function prettyDate(d: string): string {
  try { return new Date(d + "T12:00:00Z").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }); }
  catch { return d; }
}

export default async function Image({ params }: { params: { date: string } }) {
  const date = params?.date || "";
  let w: any = null;
  try {
    const r = await fetch(`${API}/api/outlook/by-date/${date}?kind=wrap`, { next: { revalidate } });
    if (r.ok) w = await r.json();
  } catch { w = null; }

  const model = w?.model_return ?? null;
  const spy = w?.spy_return ?? null;
  const has = model != null && spy != null;
  const beat = has ? model - spy : 0;
  const beatColor = beat >= 0 ? GREEN : RED;

  return new ImageResponse(
    (
      <div style={{ width: "1200px", height: "630px", display: "flex", flexDirection: "column", background: `linear-gradient(135deg, ${BG} 0%, #0b0e14 100%)`, padding: "64px 72px", fontFamily: "system-ui, sans-serif", color: "#fff" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <span style={{ fontSize: 56, fontWeight: 800, letterSpacing: "-2px" }}>Q</span>
          <span style={{ fontSize: 56, fontWeight: 800, color: GREEN, letterSpacing: "-2px" }}>NTM</span>
          <span style={{ fontSize: 20, color: MUTED, marginLeft: 18, letterSpacing: "3px", paddingTop: 18 }}>DAY WRAP</span>
        </div>
        <div style={{ fontSize: 26, color: MUTED, marginTop: 18 }}>{prettyDate(date)}{w?.regime ? ` · ${w.regime}` : ""}</div>

        {has ? (
          <div style={{ display: "flex", gap: 28, marginTop: 56 }}>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: 22, color: MUTED, letterSpacing: "2px" }}>MODEL</span>
              <span style={{ fontSize: 80, fontWeight: 800, color: model >= 0 ? GREEN : RED }}>{pct(model)}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: 22, color: MUTED, letterSpacing: "2px" }}>SPY</span>
              <span style={{ fontSize: 80, fontWeight: 800, color: spy >= 0 ? GREEN : RED }}>{pct(spy)}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: 22, color: MUTED, letterSpacing: "2px" }}>{beat >= 0 ? "BEAT BY" : "LAGGED BY"}</span>
              <span style={{ fontSize: 80, fontWeight: 800, color: beatColor }}>{Math.abs(beat).toFixed(2)}%</span>
            </div>
          </div>
        ) : (
          <div style={{ marginTop: 56, fontSize: 44, fontWeight: 800, color: "#fff" }}>Model vs SPY · daily</div>
        )}

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "auto", borderTop: "1px solid rgba(255,255,255,.10)", paddingTop: 24 }}>
          <span style={{ fontSize: 30, fontWeight: 700, color: GREEN }}>qntm.live</span>
          <span style={{ fontSize: 22, color: MUTED }}>50-name model portfolio · marked daily vs SPY</span>
        </div>
      </div>
    ),
    { ...size }
  );
}
