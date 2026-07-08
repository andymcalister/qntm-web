import type { Metadata } from "next";
import OutlookHeader from "./OutlookHeader";
import PortfolioBrief from "./PortfolioBrief";
import SubscribeForm from "./SubscribeForm";

export const revalidate = 600;

export const metadata: Metadata = {
  title: { absolute: "Market Outlook & Daily Wrap — QNTM" },
  description: "QNTM's daily market brief: regime, conviction, the model portfolio vs SPY, and what drove the session — grounded in the day's real market news. Research, not investment advice.",
  alternates: { canonical: "https://qntm.live/market-outlook" },
  robots: { index: true, follow: true },
};

const API = process.env.API_BASE || process.env.NEXT_PUBLIC_API_BASE || "https://qntm-api.onrender.com";

type Item = {
  outlook_date: string; kind: string; regime: string | null;
  conviction: number | null; model_return: number | null; spy_return: number | null;
  narrative: string | null;
};

async function getItems(): Promise<Item[]> {
  try {
    const r = await fetch(`${API}/api/outlook?limit=90`, { next: { revalidate: 600 } });
    const d = await r.json();
    return (d.items || []) as Item[];
  } catch { return []; }
}

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function renderNarrative(text: string) {
  // minimal, safe markdown: escape first, then bold + paragraphs
  const html = esc(text)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .split(/\n{2,}/)
    .map((para) => {
      // web-search citations inject mid-sentence newlines — flow them into prose,
      // don't turn them into line breaks; then tidy stray spaces before punctuation.
      const t = para.replace(/\n+/g, " ").replace(/\s+/g, " ").replace(/\s+([.,;:!?])/g, "$1").trim();
      return t ? `<p style="margin:0 0 14px">${t}</p>` : "";
    })
    .join("");
  return { __html: html };
}

const KIND_LABEL: Record<string, string> = { outlook: "Market Outlook", wrap: "Day Wrap", week: "Week Wrap" };
const fmtPct = (n: number | null) => (n === null || n === undefined ? "—" : `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`);
const col = (n: number | null) => (n === null || n === undefined ? "#94a3b8" : n >= 0 ? "#34d399" : "#f87171");

export default async function MarketOutlook() {
  const items = await getItems();

  return (
    <main style={{ minHeight: "100vh", background: "#060709", color: "#e2e8f0", padding: "0 0 60px" }}>
      <OutlookHeader />

      <div style={{ maxWidth: 820, margin: "0 auto", padding: "20px 24px" }}>
        <h1 style={{ fontFamily: "var(--font-syne,sans-serif)", fontWeight: 800, fontSize: 32, color: "#fff", margin: "8px 0 4px" }}>Market Outlook</h1>
        <p style={{ fontFamily: "var(--font-dm-mono,monospace)", fontSize: 13, color: "#9fabc0", margin: "0 0 8px" }}>
          QNTM&apos;s daily read: regime, conviction, the model portfolio vs SPY, and what drove the session.
        </p>
        <p style={{ fontFamily: "var(--font-dm-mono,monospace)", fontSize: 11, color: "#64748b", margin: "0 0 24px" }}>
          Quantitative research and education — not investment advice.
        </p>

        <PortfolioBrief />

        <SubscribeForm />

        {items.length === 0 && (
          <div style={{ fontFamily: "var(--font-dm-mono,monospace)", fontSize: 14, color: "#64748b", padding: "40px 0" }}>
            The first brief posts soon.
          </div>
        )}

        {items.map((it, i) => (
          <a key={`${it.outlook_date}-${it.kind}-${i}`} href={`/${it.kind === "outlook" ? "outlook" : "wrap"}/${it.outlook_date}`} style={{ textDecoration: "none", display: "block" }}>
          <article style={{ border: "1px solid rgba(255,255,255,.08)", borderRadius: 14, padding: "22px 24px", marginBottom: 18, background: "rgba(255,255,255,.015)", transition: "border-color .15s", cursor: "pointer" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 6 }}>
              <span style={{ fontFamily: "var(--font-dm-mono,monospace)", fontSize: 11, letterSpacing: ".1em", color: "#0b0c10", background: "#d4a843", borderRadius: 999, padding: "4px 10px", fontWeight: 700 }}>
                {(KIND_LABEL[it.kind] || it.kind).toUpperCase()}
              </span>
              <span style={{ fontFamily: "var(--font-dm-mono,monospace)", fontSize: 13, color: "#cbd5e1" }}>{it.outlook_date}</span>
            </div>
            <div style={{ display: "flex", gap: 18, flexWrap: "wrap", fontFamily: "var(--font-dm-mono,monospace)", fontSize: 12.5, color: "#9fabc0", margin: "8px 0 14px" }}>
              {it.regime && <span>Regime: <strong style={{ color: "#e2e8f0" }}>{it.regime}</strong></span>}
              {it.conviction !== null && <span>Conviction: <strong style={{ color: "#e2e8f0" }}>{it.conviction}/100</strong></span>}
              {it.kind !== "outlook" && <span>Model: <strong style={{ color: col(it.model_return) }}>{fmtPct(it.model_return)}</strong></span>}
              {it.kind !== "outlook" && <span>SPY: <strong style={{ color: col(it.spy_return) }}>{fmtPct(it.spy_return)}</strong></span>}
            </div>
            {it.narrative && (
              <div style={{ fontFamily: "var(--font-inter,sans-serif)", fontSize: 15, lineHeight: 1.7, color: "#cbd5e1" }} dangerouslySetInnerHTML={renderNarrative(it.narrative)} />
            )}
            <div style={{ fontFamily: "var(--font-dm-mono,monospace)", fontSize: 12.5, color: "#93b4ff", marginTop: 14 }}>Read the full {it.kind === "outlook" ? "outlook" : "wrap"} →</div>
          </article>
          </a>
        ))}
      </div>
    </main>
  );
}
