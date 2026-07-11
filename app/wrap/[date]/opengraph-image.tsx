// app/wrap/[date]/opengraph-image.tsx
// Enriched Day Wrap OG card — reads model/spy/regime/conviction AND that date's
// stored vix/wti from the wrap row (historically accurate, no live macro call).
// Hardened for Satori: all flex, no spans, params awaited, fetch guarded.
import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const revalidate = 3600;
export const alt = "QNTM Day Wrap";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";


const API = process.env.API_BASE || process.env.NEXT_PUBLIC_API_BASE || "https://qntm-api.onrender.com";
const GREEN = "#34d399", RED = "#f87171", GOLD = "#d4a843", MUTED = "#9fabc0", DIM = "#64748b";

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

  let model: number | null = null, spy: number | null = null;
  let regime = "", conviction: number | null = null, vix: number | null = null, wti: number | null = null;
  let isWeek = false;
  try {
    let r = await fetch(`${API}/api/outlook/by-date/${date}?kind=wrap`, { next: { revalidate } });
    let w = r.ok ? await r.json() : null;
    if (!w || !w.outlook_date) {
      r = await fetch(`${API}/api/outlook/by-date/${date}?kind=week`, { next: { revalidate } });
      w = r.ok ? await r.json() : null;
    }
    if (w && w.outlook_date) {
      isWeek = w.kind === "week";
      model = typeof w?.model_return === "number" ? w.model_return : null;
      spy = typeof w?.spy_return === "number" ? w.spy_return : null;
      regime = typeof w?.regime === "string" ? w.regime : "";
      conviction = typeof w?.regime_score === "number" ? w.regime_score : (typeof w?.conviction === "number" ? w.conviction : null);
      vix = typeof w?.vix === "number" ? w.vix : null;
      wti = typeof w?.wti === "number" ? w.wti : null;
    }
  } catch {}

  const has = model != null && spy != null;
  const beat = has ? (model as number) - (spy as number) : 0;
  const beatColor = beat >= 0 ? GREEN : RED;

  const stat = (label: string, value: string, color: string) => (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", fontSize: 22, color: MUTED, letterSpacing: "2px" }}>{label}</div>
      <div style={{ display: "flex", fontSize: 72, fontWeight: 800, color }}>{value}</div>
    </div>
  );
  const chip = (label: string, value: string, color: string) => (
    <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
      <div style={{ display: "flex", fontSize: 22, color: DIM }}>{label}</div>
      <div style={{ display: "flex", fontSize: 26, fontWeight: 700, color }}>{value}</div>
    </div>
  );

  const chips: any[] = [];
  if (regime) chips.push(chip("Regime", regime, regime.match(/bull/i) ? GREEN : regime.match(/bear|risk_off/i) ? RED : GOLD));
  if (conviction != null) chips.push(chip("Conviction", `${conviction}/100`, "#e2e8f0"));
  if (vix != null) chips.push(chip("VIX", vix.toFixed(1), "#e2e8f0"));
  if (wti != null) chips.push(chip("WTI", `$${wti.toFixed(0)}`, "#e2e8f0"));

  return new ImageResponse(
    (
      <div style={{ display: "flex", flexDirection: "column", width: "1200px", height: "630px", background: "#08090c", padding: "56px 72px", fontFamily: "system-ui, sans-serif", color: "#ffffff" }}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <div style={{ display: "flex", fontSize: 54, fontWeight: 800, color: "#ffffff", letterSpacing: "-1px" }}>Q</div>
          <div style={{ display: "flex", fontSize: 54, fontWeight: 800, color: GREEN, letterSpacing: "-1px" }}>NTM</div>
          <div style={{ display: "flex", fontSize: 20, color: MUTED, marginLeft: 20, letterSpacing: "3px", paddingTop: 16 }}>{isWeek ? "WEEK WRAP" : "DAY WRAP"}</div>
        </div>
        <div style={{ display: "flex", fontSize: 24, color: MUTED, marginTop: 12 }}>{prettyDate(date)}</div>

        {has ? (
          <div style={{ display: "flex", marginTop: 40, gap: 44 }}>
            {stat("MODEL", pct(model), (model as number) >= 0 ? GREEN : RED)}
            {stat("SPY", pct(spy), (spy as number) >= 0 ? GREEN : RED)}
            {stat(beat >= 0 ? "BEAT BY" : "LAGGED BY", `${Math.abs(beat).toFixed(2)}%`, beatColor)}
          </div>
        ) : (
          <div style={{ display: "flex", marginTop: 40, fontSize: 44, fontWeight: 800 }}>Model vs SPY · daily</div>
        )}

        {chips.length > 0 && (
          <div style={{ display: "flex", gap: 34, marginTop: 36, flexWrap: "wrap" }}>{chips}</div>
        )}

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "auto", borderTop: "1px solid rgba(255,255,255,0.10)", paddingTop: 22 }}>
          <div style={{ display: "flex", fontSize: 28, fontWeight: 700, color: GREEN }}>qntm.live</div>
          <div style={{ display: "flex", fontSize: 20, color: MUTED }}>Quantitative research · not advice</div>
        </div>
      </div>
    ),
    { ...size }
  );
}
