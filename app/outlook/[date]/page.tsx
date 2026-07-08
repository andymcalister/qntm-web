// app/outlook/[date]/page.tsx
// Public dated Market Outlook page. Reads one stored outlook by date, renders
// regime + conviction + themes/watching + narrative. Preamble-stripped on render.
import type { Metadata } from "next";
import { notFound } from "next/navigation";

const API = process.env.API_BASE || process.env.NEXT_PUBLIC_API_BASE || "https://qntm-api.onrender.com";
export const revalidate = 3600;

const FONT_DISPLAY = "var(--font-syne, system-ui, sans-serif)";
const FONT_MONO = "var(--font-dm-mono, ui-monospace, monospace)";

type Outlook = {
  outlook_date: string; kind: string; regime: string | null;
  conviction: number | null; regime_score: number | null;
  themes: string | null; whats_changed: string | null; watching: string | null;
  narrative: string | null; created_at: string | null;
};

async function getOutlook(date: string): Promise<Outlook | null> {
  try {
    const r = await fetch(`${API}/api/outlook/by-date/${date}?kind=outlook`, { next: { revalidate } });
    if (!r.ok) return null;
    const d = await r.json();
    return d && d.outlook_date ? d : null;
  } catch { return null; }
}

function cleanNarrative(text: string | null): string {
  if (!text) return "";
  const markers = ["## QNTM", "**QNTM Market", "QNTM Market Outlook", "## Market"];
  let lo = text.length + 1;
  for (const m of markers) { const i = text.indexOf(m); if (i !== -1) lo = Math.min(lo, i); }
  return (lo <= text.length ? text.slice(lo) : text).trim();
}
function parseList(raw: string | null): string[] {
  if (!raw) return [];
  try { const a = JSON.parse(raw); return Array.isArray(a) ? a.map(String) : []; } catch { return []; }
}
function prettyDate(d: string): string {
  try { return new Date(d + "T12:00:00Z").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" }); }
  catch { return d; }
}
function renderMarkdown(md: string): string {
  const esc = (t: string) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return md.split(/\n\n+/).map((b) => {
    const t = b.trim(); if (!t) return "";
    if (t.startsWith("## ")) return `<h2 style="font-family:${FONT_DISPLAY};font-size:22px;font-weight:800;color:#fff;margin:24px 0 8px">${esc(t.slice(3))}</h2>`;
    if (t.startsWith("# ")) return `<h1 style="font-family:${FONT_DISPLAY};font-size:28px;font-weight:800;color:#fff;margin:24px 0 8px">${esc(t.slice(2))}</h1>`;
    const html = esc(t).replace(/\*\*(.+?)\*\*/g, '<strong style="color:#e2e8f0">$1</strong>').replace(/\*(.+?)\*/g, '<em style="color:#9fabc0">$1</em>');
    return `<p style="margin:12px 0;line-height:1.7;color:#cbd5e1">${html.replace(/\n/g, " ")}</p>`;
  }).join("");
}

export async function generateMetadata({ params }: { params: Promise<{ date: string }> }): Promise<Metadata> {
  const { date } = await params;
  const o = await getOutlook(date);
  if (!o) return { title: "Market Outlook · QNTM" };
  const title = `QNTM Market Outlook — ${prettyDate(date)}`;
  const description = `${o.regime || "Neutral"} regime${o.regime_score != null ? `, conviction ${o.regime_score}` : ""}. QNTM's daily quantitative read on 1,400+ US stocks. Research, not advice.`;
  return {
    title, description,
    alternates: { canonical: `https://qntm.live/outlook/${date}` },
    openGraph: { title, description, url: `https://qntm.live/outlook/${date}`, type: "article" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function OutlookPage({ params }: { params: Promise<{ date: string }> }) {
  const { date } = await params;
  const o = await getOutlook(date);
  if (!o) notFound();

  const themes = parseList(o.themes);
  const watching = parseList(o.watching);
  const narrative = cleanNarrative(o.narrative);
  const regimeColor = /bull/i.test(o.regime || "") ? "#34d399" : /bear|risk_off/i.test(o.regime || "") ? "#f87171" : "#d4a843";

  return (
    <main style={{ maxWidth: 820, margin: "0 auto", padding: "48px 24px 80px", color: "#e2e8f0" }}>
      <a href="/market-outlook" style={{ fontFamily: FONT_MONO, fontSize: 13, color: "#64748b", textDecoration: "none" }}>← All outlooks &amp; wraps</a>

      <div style={{ fontFamily: FONT_MONO, fontSize: 12, letterSpacing: ".18em", color: "#93b4ff", marginTop: 28 }}>QNTM MARKET OUTLOOK</div>
      <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: 34, fontWeight: 800, color: "#fff", margin: "6px 0 4px", letterSpacing: "-.01em" }}>{prettyDate(date)}</h1>

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", margin: "22px 0 8px" }}>
        <div style={{ flex: "1 1 200px", background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.10)", borderRadius: 12, padding: "18px 20px" }}>
          <div style={{ fontFamily: FONT_MONO, fontSize: 12, color: "#9fabc0", letterSpacing: ".08em" }}>MARKET REGIME</div>
          <div style={{ fontFamily: FONT_DISPLAY, fontSize: 32, fontWeight: 800, color: regimeColor }}>{o.regime || "—"}</div>
        </div>
        {o.regime_score != null && (
          <div style={{ flex: "1 1 200px", background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.10)", borderRadius: 12, padding: "18px 20px" }}>
            <div style={{ fontFamily: FONT_MONO, fontSize: 12, color: "#9fabc0", letterSpacing: ".08em" }}>CONVICTION</div>
            <div style={{ fontFamily: FONT_DISPLAY, fontSize: 32, fontWeight: 800, color: "#e2e8f0" }}>{o.regime_score}<span style={{ fontSize: 18, color: "#64748b" }}>/100</span></div>
          </div>
        )}
      </div>

      {themes.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <div style={{ fontFamily: FONT_MONO, fontSize: 12, color: "#9fabc0", letterSpacing: ".08em", marginBottom: 8 }}>THEMES</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {themes.map((t, i) => <span key={i} style={{ fontFamily: FONT_MONO, fontSize: 13, color: "#cbd5e1", background: "rgba(13,14,22,.6)", border: "1px solid rgba(255,255,255,.12)", borderRadius: 8, padding: "6px 12px" }}>{t}</span>)}
          </div>
        </div>
      )}

      {narrative ? (
        <div style={{ marginTop: 24, fontSize: 16 }} dangerouslySetInnerHTML={{ __html: renderMarkdown(narrative) }} />
      ) : (
        <p style={{ color: "#64748b", marginTop: 24 }}>No narrative recorded for this date.</p>
      )}

      {watching.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <div style={{ fontFamily: FONT_MONO, fontSize: 12, color: "#9fabc0", letterSpacing: ".08em", marginBottom: 8 }}>WATCHING</div>
          <ul style={{ margin: 0, paddingLeft: 18, color: "#cbd5e1", lineHeight: 1.7 }}>
            {watching.map((w, i) => <li key={i}>{w}</li>)}
          </ul>
        </div>
      )}

      <p style={{ fontFamily: FONT_MONO, fontSize: 12, color: "#4b5568", marginTop: 40 }}>
        Educational research only — not investment advice.
      </p>
    </main>
  );
}
