// app/wrap/[date]/opengraph-image.tsx
// Per-day Day Wrap OG card. Hardened for Satori: EVERY element that contains
// children has explicit display:flex. Fetch fully guarded. params awaited.
import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const revalidate = 3600;
export const alt = "QNTM Day Wrap";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const API = process.env.API_BASE || process.env.NEXT_PUBLIC_API_BASE || "https://qntm-api.onrender.com";
const GREEN = "#34d399", RED = "#f87171", MUTED = "#9fabc0";

function pct(n: number | null): string {
  if (n == null || Number.isNaN(n)) return "—";
  return `${n >= 0 ? "+" : ""}${Number(n).toFixed(2)}%`;
}
function prettyDate(d: string): string {
  try { return new Date(d + "T12:00:00Z").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }); }
  catch { return d; }
}

export default async function Image({ params }: { params: Promise<{ date: string }> }) {
  let date = "";
  try { date = (await params).date || ""; } catch { date = ""; }

  let model: number | null = null;
  let spy: number | null = null;
  let regime = "";
  try {
    const r = await fetch(`${API}/api/outlook/by-date/${date}?kind=wrap`, { next: { revalidate } });
    if (r.ok) {
      const w = await r.json();
      model = typeof w?.model_return === "number" ? w.model_return : null;
      spy = typeof w?.spy_return === "number" ? w.spy_return : null;
      regime = typeof w?.regime === "string" ? w.regime : "";
    }
  } catch { /* fall through to branded card */ }

  const has = model != null && spy != null;
  const beat = has ? (model as number) - (spy as number) : 0;
  const beatColor = beat >= 0 ? GREEN : RED;

  const col = (label: string, value: string, color: string) => (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", fontSize: 22, color: MUTED, letterSpacing: "2px" }}>{label}</div>
      <div style={{ display: "flex", fontSize: 78, fontWeight: 800, color }}>{value}</div>
    </div>
  );

  return new ImageResponse(
    (
      <div style={{ display: "flex", flexDirection: "column", width: "1200px", height: "630px", background: "#08090c", padding: "64px 72px", fontFamily: "system-ui, sans-serif", color: "#ffffff" }}>
        {/* wordmark */}
        <div style={{ display: "flex", alignItems: "center" }}>
          <div style={{ display: "flex", fontSize: 54, fontWeight: 800, color: "#ffffff" }}>Q</div>
          <div style={{ display: "flex", fontSize: 54, fontWeight: 800, color: GREEN }}>NTM</div>
          <div style={{ display: "flex", fontSize: 20, color: MUTED, marginLeft: 18, letterSpacing: "3px", paddingTop: 18 }}>DAY WRAP</div>
        </div>

        {/* date */}
        <div style={{ display: "flex", fontSize: 26, color: MUTED, marginTop: 18 }}>
          {prettyDate(date)}{regime ? ` · ${regime}` : ""}
        </div>

        {/* stats or fallback */}
        {has ? (
          <div style={{ display: "flex", marginTop: 56, gap: 40 }}>
            {col("MODEL", pct(model), (model as number) >= 0 ? GREEN : RED)}
            {col("SPY", pct(spy), (spy as number) >= 0 ? GREEN : RED)}
            {col(beat >= 0 ? "BEAT BY" : "LAGGED BY", `${Math.abs(beat).toFixed(2)}%`, beatColor)}
          </div>
        ) : (
          <div style={{ display: "flex", marginTop: 56, fontSize: 44, fontWeight: 800, color: "#ffffff" }}>
            50-name model portfolio · marked daily vs SPY
          </div>
        )}

        {/* footer */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "auto", borderTop: "1px solid rgba(255,255,255,0.10)", paddingTop: 24 }}>
          <div style={{ display: "flex", fontSize: 30, fontWeight: 700, color: GREEN }}>qntm.live</div>
          <div style={{ display: "flex", fontSize: 22, color: MUTED }}>Quantitative research · not advice</div>
        </div>
      </div>
    ),
    { ...size }
  );
}
