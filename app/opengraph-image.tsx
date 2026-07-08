// app/opengraph-image.tsx
// Dynamic Open Graph card for the QNTM homepage. Next.js auto-wires this file as
// the homepage's og:image + twitter:image. Renders TODAY's live regime + top
// conviction names via next/og, regenerating on the same 30-min cadence as the
// hero. Falls back to a clean branded card if the live read fails (never a broken
// image). Uses a system font stack so it always renders without font fetches.
import { ImageResponse } from "next/og";
import { getHeroData } from "./lib/qntm-data";

export const runtime = "nodejs";
export const revalidate = 1800; // 30 min — matches the macro cron / hero ISR
export const alt = "QNTM — live quantitative stock conviction";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const GREEN = "#34d399";
const GOLD = "#d4a843";
const RED = "#f87171";
const BG = "#08090c";
const PANEL = "#0f1116";
const MUTED = "#9fabc0";

export default async function Image() {
  let hero: any = null;
  try {
    hero = await getHeroData();
  } catch {
    hero = null;
  }

  const ok = !!hero?.ok;
  const regimeLabel: string = (hero?.regime?.label || "Neutral").toString();
  const tone: string = hero?.regime?.tone || "neutral";
  const vix = hero?.regime?.vix ?? null;
  const total: number = hero?.total ?? 1402;
  const signals: { ticker: string; score: number }[] = Array.isArray(hero?.signals)
    ? hero.signals.slice(0, 5)
    : [];

  const toneColor = tone === "up" ? GREEN : tone === "down" ? RED : GOLD;

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          flexDirection: "column",
          background: `linear-gradient(135deg, ${BG} 0%, #0b0e14 100%)`,
          padding: "64px 72px",
          fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
          color: "#ffffff",
        }}
      >
        {/* wordmark */}
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <span style={{ fontSize: 64, fontWeight: 800, color: "#ffffff", letterSpacing: "-2px" }}>Q</span>
          <span style={{ fontSize: 64, fontWeight: 800, color: GREEN, letterSpacing: "-2px" }}>NTM</span>
          <span style={{ fontSize: 20, color: MUTED, marginLeft: 20, letterSpacing: "3px", paddingTop: 22 }}>
            DAILY SIGNAL
          </span>
        </div>

        {/* regime headline */}
        <div style={{ display: "flex", flexDirection: "column", marginTop: 48 }}>
          <span style={{ fontSize: 22, color: MUTED, letterSpacing: "4px" }}>MARKET REGIME</span>
          <span style={{ fontSize: 92, fontWeight: 800, color: toneColor, letterSpacing: "-2px", marginTop: 4 }}>
            {regimeLabel.toUpperCase()}
          </span>
          {vix != null ? (
            <span style={{ fontSize: 26, color: MUTED, marginTop: 4 }}>VIX {Number(vix).toFixed(1)}</span>
          ) : null}
        </div>

        {/* top conviction row */}
        <div style={{ display: "flex", flexDirection: "column", marginTop: 40 }}>
          <span style={{ fontSize: 20, color: MUTED, letterSpacing: "3px", marginBottom: 14 }}>
            TOP CONVICTION TODAY
          </span>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            {signals.length
              ? signals.map((s) => (
                  <div
                    key={s.ticker}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      background: PANEL,
                      border: "1px solid rgba(255,255,255,0.10)",
                      borderRadius: 12,
                      padding: "12px 18px",
                    }}
                  >
                    <span style={{ fontSize: 30, fontWeight: 700, color: "#ffffff" }}>{s.ticker}</span>
                    <span style={{ fontSize: 30, fontWeight: 800, color: GREEN }}>{s.score}</span>
                  </div>
                ))
              : (
                <span style={{ fontSize: 28, color: "#ffffff" }}>
                  {total.toLocaleString()} US stocks scored daily
                </span>
              )}
          </div>
        </div>

        {/* footer */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: "auto",
            borderTop: "1px solid rgba(255,255,255,0.10)",
            paddingTop: 24,
          }}
        >
          <span style={{ fontSize: 30, fontWeight: 700, color: GREEN }}>qntm.live</span>
          <span style={{ fontSize: 22, color: MUTED }}>
            {total.toLocaleString()}+ US stocks · five-factor model · {ok ? "live" : "research"}
          </span>
        </div>
      </div>
    ),
    { ...size }
  );
}
