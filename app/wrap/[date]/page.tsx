// app/wrap/[date]/page.tsx
// Public dated Day Wrap page. Reads one stored wrap by date, renders it with a
// clean model-vs-SPY headline + narrative. Preamble-stripped on render so older
// rows (generated before the narrate() fix) still display cleanly. ISR-cached.
import type { Metadata } from "next";
import { notFound } from "next/navigation";

const API = process.env.API_BASE || process.env.NEXT_PUBLIC_API_BASE || "https://qntm-api.onrender.com";
export const revalidate = 3600;

const FONT_DISPLAY = "var(--font-syne, system-ui, sans-serif)";
const FONT_MONO = "var(--font-dm-mono, ui-monospace, monospace)";

type Wrap = {
  outlook_date: string; kind: string; regime: string | null;
  conviction: number | null; regime_score: number | null;
  model_return: number | null; spy_return: number | null;
  narrative: string | null; created_at: string | null;
};

async function getWrap(date: string): Promise<Wrap | null> {
  try {
    let r = await fetch(`${API}/api/outlook/by-date/${date}?kind=wrap`, { next: { revalidate } });
    let d = r.ok ? await r.json() : null;
    if (!d || !d.outlook_date) {
      r = await fetch(`${API}/api/outlook/by-date/${date}?kind=week`, { next: { revalidate } });
      d = r.ok ? await r.json() : null;
    }
    return d && d.outlook_date ? d : null;
  } catch {
    return null;
  }
}

// Strip any model preamble before the first heading (belt-and-suspenders for old rows).
function cleanNarrative(text: string | null): string {
  if (!text) return "";
  const markers = ["## QNTM", "**QNTM Day Wrap", "QNTM Day Wrap"];
  let lo = text.length + 1;
  for (const m of markers) { const i = text.indexOf(m); if (i !== -1) lo = Math.min(lo, i); }
  return (lo <= text.length ? text.slice(lo) : text).trim();
}

function fmtPct(n: number | null): string {
  if (n == null) return "—";
  return `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`;
}
function prettyDate(d: string): string {
  try { return new Date(d + "T12:00:00Z").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" }); }
  catch { return d; }
}

// Minimal markdown → HTML (bold, ## headings, paragraphs). No external dep.
function renderMarkdown(md: string): string {
  const esc = (t: string) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const blocks = md.split(/\n\n+/);
  return blocks.map((b) => {
    const t = b.trim();
    if (!t) return "";
    if (t.startsWith("## ")) return `<h2 style="font-family:${FONT_DISPLAY};font-size:22px;font-weight:800;color:#fff;margin:24px 0 8px">${esc(t.slice(3))}</h2>`;
    if (t.startsWith("# ")) return `<h1 style="font-family:${FONT_DISPLAY};font-size:28px;font-weight:800;color:#fff;margin:24px 0 8px">${esc(t.slice(2))}</h1>`;
    let html = esc(t).replace(/\*\*(.+?)\*\*/g, '<strong style="color:#e2e8f0">$1</strong>').replace(/\*(.+?)\*/g, '<em style="color:#9fabc0">$1</em>');
    return `<p style="margin:12px 0;line-height:1.7;color:#cbd5e1">${html.replace(/\n/g, " ")}</p>`;
  }).join("");
}

export async function generateMetadata({ params }: { params: Promise<{ date: string }> }): Promise<Metadata> {
  const { date } = await params;
  const w = await getWrap(date);
  if (!w) return { title: "Day Wrap · QNTM" };
  const beat = (w.model_return ?? 0) - (w.spy_return ?? 0);
  const title = `QNTM Day Wrap — ${prettyDate(date)}`;
  const description = `Model ${fmtPct(w.model_return)} vs SPY ${fmtPct(w.spy_return)} (${beat >= 0 ? "beat" : "lagged"} by ${Math.abs(beat).toFixed(2)}%). ${w.regime || ""} regime. Quantitative research, not advice.`;
  return {
    title, description,
    alternates: { canonical: `https://qntm.live/wrap/${date}` },
    openGraph: { title, description, url: `https://qntm.live/wrap/${date}`, type: "article" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function WrapPage({ params }: { params: Promise<{ date: string }> }) {
  const { date } = await params;
  const w = await getWrap(date);
  if (!w) notFound();

  const model = w.model_return ?? null;
  const spy = w.spy_return ?? null;
  const beat = (model ?? 0) - (spy ?? 0);
  const beatColor = beat >= 0 ? "#34d399" : "#f87171";
  const narrative = cleanNarrative(w.narrative);

  return (
    <main style={{ maxWidth: 820, margin: "0 auto", padding: "48px 24px 80px", color: "#e2e8f0" }}>
      <a href="/market-outlook" style={{ fontFamily: FONT_MONO, fontSize: 13, color: "#64748b", textDecoration: "none" }}>← All outlooks &amp; wraps</a>

      <div style={{ fontFamily: FONT_MONO, fontSize: 12, letterSpacing: ".18em", color: "#93b4ff", marginTop: 28 }}>QNTM DAY WRAP</div>
      <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: 34, fontWeight: 800, color: "#fff", margin: "6px 0 4px", letterSpacing: "-.01em" }}>{prettyDate(date)}</h1>
      <div style={{ fontFamily: FONT_MONO, fontSize: 13, color: "#64748b" }}>{w.regime || "—"} regime{w.regime_score != null ? ` · conviction ${w.regime_score}` : ""}</div>

      {/* model vs SPY headline */}
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", margin: "28px 0 8px" }}>
        <div style={{ flex: "1 1 180px", background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.10)", borderRadius: 12, padding: "18px 20px" }}>
          <div style={{ fontFamily: FONT_MONO, fontSize: 12, color: "#9fabc0", letterSpacing: ".08em" }}>MODEL</div>
          <div style={{ fontFamily: FONT_DISPLAY, fontSize: 38, fontWeight: 800, color: (model ?? 0) >= 0 ? "#34d399" : "#f87171" }}>{fmtPct(model)}</div>
        </div>
        <div style={{ flex: "1 1 180px", background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.10)", borderRadius: 12, padding: "18px 20px" }}>
          <div style={{ fontFamily: FONT_MONO, fontSize: 12, color: "#9fabc0", letterSpacing: ".08em" }}>SPY</div>
          <div style={{ fontFamily: FONT_DISPLAY, fontSize: 38, fontWeight: 800, color: (spy ?? 0) >= 0 ? "#34d399" : "#f87171" }}>{fmtPct(spy)}</div>
        </div>
        <div style={{ flex: "1 1 180px", background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.10)", borderRadius: 12, padding: "18px 20px" }}>
          <div style={{ fontFamily: FONT_MONO, fontSize: 12, color: "#9fabc0", letterSpacing: ".08em" }}>{beat >= 0 ? "BEAT BY" : "LAGGED BY"}</div>
          <div style={{ fontFamily: FONT_DISPLAY, fontSize: 38, fontWeight: 800, color: beatColor }}>{Math.abs(beat).toFixed(2)}%</div>
        </div>
      </div>

      {/* narrative */}
      {narrative ? (
        <div style={{ marginTop: 24, fontSize: 16 }} dangerouslySetInnerHTML={{ __html: renderMarkdown(narrative) }} />
      ) : (
        <p style={{ color: "#64748b", marginTop: 24 }}>No narrative recorded for this date.</p>
      )}

      <p style={{ fontFamily: FONT_MONO, fontSize: 12, color: "#4b5568", marginTop: 40 }}>
        Educational research only — not investment advice. Past performance does not guarantee future results.
      </p>
    </main>
  );
}
