// Shared types + logic for the screener, ported faithfully from the Streamlit
// app (factor_panel_html, _build_why_html, _blend_buy_score/_sell_score,
// _val_pos, get_company_info KNOWN map). Pure functions — no "use client".

export type Row = {
  ticker: string;
  sector: string;
  conviction: "HIGH" | "MODERATE" | "LOW";
  action: "BUY" | "HOLD" | "SELL";
  score: number;        // adj_composite (headline)
  composite: number;    // raw quant (pre-overlay)
  momentum: number;
  quality: number;
  volume: number;
  value: number;
  sentiment: number;
  macro_overlay: number | null;
  price: number | null;
  value_position: number | null;
  is_hidden_gem: boolean;
  mktcap: string | null;       // "large" | "mid" | "small"
  val_low: number | null;
  val_high: number | null;
  val_basis: string | null;    // "valuation" | "technical" | "na"
  signal_date: string | null;
};

export type Regime = {
  label: string;
  vix: number | null;
  event: string | null;
  summary: string | null;
};

// ── Colors (exact Streamlit values) ──────────────────────────────────────────
// .c = the "signal" color used for the score, conviction label, arrows and card
// edge — brightened a touch from the base #34d399/#f87171 so heavy colored text
// reads as vivid as the Streamlit cards regardless of font-weight rendering.
// .bg / .brd keep the subtle Streamlit values (badge fills stay understated).
export const ACT = {
  BUY: { c: "#2fe3a0", bg: "rgba(52,211,153,.08)", brd: "rgba(52,211,153,.22)" },
  HOLD: { c: "#fbbf24", bg: "rgba(251,191,36,.06)", brd: "rgba(251,191,36,.2)" },
  SELL: { c: "#ff6363", bg: "rgba(248,113,113,.08)", brd: "rgba(248,113,113,.2)" },
} as const;

export const ACTION_LABEL = { BUY: "High Conviction", HOLD: "Moderate", SELL: "Low Conviction" } as const;
export const ACTION_ARROW = { BUY: "▲", HOLD: "→", SELL: "▼" } as const;

export const FONT_DISPLAY = "var(--font-syne, 'Syne'), sans-serif";
export const FONT_MONO = "var(--font-dm-mono, 'DM Mono'), monospace";

// ── Valuation position (0-100, low = cheap) ──────────────────────────────────
export function valPos(r: Row): number | null {
  if ((r.val_basis || "na") === "na") return null;
  const { val_low: lo, val_high: hi, price: pr } = r;
  if (lo != null && hi != null && pr != null && hi > lo) {
    return Math.max(0, Math.min(100, ((pr - lo) / (hi - lo)) * 100));
  }
  if (r.value_position != null) return Math.max(0, Math.min(100, r.value_position));
  return null;
}

// ── Top-10 blend ranking ─────────────────────────────────────────────────────
const CONV_W = 0.65, VALUE_W = 0.35;
export function blendBuy(r: Row): number {
  const conv = r.score ?? 50;
  const vp = valPos(r);
  const cheap = vp != null ? 100 - vp : 50;
  return CONV_W * conv + VALUE_W * cheap;
}
export function blendSell(r: Row): number {
  const conv = r.score ?? 50;
  const vp = valPos(r);
  const rich = vp != null ? vp : 50;
  return CONV_W * conv - VALUE_W * rich;
}

// ◆ CHEAP / ◆ RICH callout (Top-10 only)
export function valueCallout(r: Row): "cheap" | "rich" | null {
  const vp = valPos(r);
  if (vp == null) return null;
  if (r.action === "BUY" && r.score >= 60 && vp <= 25) return "cheap";
  if (r.action === "SELL" && r.score < 45 && vp >= 75) return "rich";
  return null;
}

// ── Pillars / driver line ────────────────────────────────────────────────────
export const PILLARS: { key: keyof Row; short: string; full: string }[] = [
  { key: "momentum", short: "MOM", full: "Momentum" },
  { key: "quality", short: "QUAL", full: "Quality" },
  { key: "volume", short: "VOL", full: "Volume" },
  { key: "value", short: "VAL", full: "Value" },
  { key: "sentiment", short: "SENT", full: "Sentiment" },
];

export function pillarColor(v: number): string {
  return v >= 65 ? "#34d399" : v >= 50 ? "#fbbf24" : "#f87171";
}

export function driverLine(r: Row): string {
  const sorted = PILLARS.map((p) => ({ s: p.short, v: r[p.key] as number })).sort((a, b) => b.v - a.v);
  const top2 = sorted.slice(0, 2).map((p) => p.s);
  const weak = sorted.filter((p) => p.v < 45).map((p) => p.s);
  let d = `Driven by ${top2[0]} + ${top2[1]}`;
  if (weak.length) d += ` — watch ${weak[0]}`;
  return d;
}

// ── "Why this score" (port of _build_why_html) ───────────────────────────────
const WHY_EXPLAIN: Record<string, [string, string]> = {
  MOM: ["price trend and relative strength are strong", "price trend is weakening"],
  QUAL: ["earnings quality and balance sheet are solid", "earnings quality is a concern"],
  VOL: ["volume confirms institutional interest", "volume signal is weak"],
  VAL: ["stock looks undervalued vs sector peers", "stock looks stretched on valuation"],
  SENT: ["analyst sentiment is improving", "analyst sentiment is negative"],
};

export type WhySeg = { text: string; color: string };
export function buildWhy(r: Row): WhySeg[] {
  const sorted = PILLARS.map((p) => ({ s: p.short, v: r[p.key] as number })).sort((a, b) => b.v - a.v);
  const drivers: string[] = [];
  const watches: string[] = [];
  for (const p of sorted) {
    const [pos, neg] = WHY_EXPLAIN[p.s];
    if (p.v >= 65) drivers.push(pos);
    else if (p.v < 45) watches.push(neg);
  }
  const delta = r.score - r.composite;
  const segs: WhySeg[] = [];
  if (drivers.length) {
    const t = drivers.slice(0, 2).join("; ");
    segs.push({ text: t.charAt(0).toUpperCase() + t.slice(1) + ".", color: "#b3bed0" });
  }
  if (watches.length) segs.push({ text: `Watch: ${watches[0]}.`, color: "#f87171" });
  if (Math.abs(delta) >= 2) {
    segs.push({
      text: delta > 0 ? "Macro regime is adding a tailwind." : "Macro regime is dampening the score.",
      color: delta > 0 ? "#34d399" : "#f97316",
    });
  }
  return segs;
}

// ── Macro delta cell (port of the ≈0 / — logic) ──────────────────────────────
export function macroDelta(r: Row): { str: string; color: string } {
  const delta = r.score - r.composite;
  const ov = r.macro_overlay ?? 0;
  if (Math.abs(delta) < 0.005) {
    return Math.abs(ov) > 1e-9 ? { str: "≈0", color: "#8896ac" } : { str: "—", color: "#8896ac" };
  }
  return { str: delta >= 0 ? `+${delta.toFixed(2)}` : delta.toFixed(2), color: delta >= 0 ? "#34d399" : "#f87171" };
}

// ── Market-cap badge ─────────────────────────────────────────────────────────
const CAP_LABELS: Record<string, string> = { large: "LARGE CAP", mid: "MID CAP", small: "SMALL CAP" };
export function capLabel(mktcap: string | null): string | null {
  return mktcap && CAP_LABELS[mktcap] ? CAP_LABELS[mktcap] : null;
}

// ── Company names (same KNOWN map Streamlit uses for fast lookups) ────────────
export const KNOWN: Record<string, string> = {
  AAPL: "Apple Inc.", MSFT: "Microsoft Corporation", NVDA: "NVIDIA Corporation",
  GOOGL: "Alphabet Inc.", GOOG: "Alphabet Inc.", META: "Meta Platforms Inc.",
  AMZN: "Amazon.com Inc.", TSLA: "Tesla Inc.", NFLX: "Netflix Inc.",
  AMD: "Advanced Micro Devices", INTC: "Intel Corporation", CSCO: "Cisco Systems",
  ORCL: "Oracle Corporation", CRM: "Salesforce Inc.", ADBE: "Adobe Inc.",
  INTU: "Intuit Inc.", QCOM: "Qualcomm Inc.", TXN: "Texas Instruments",
  AVGO: "Broadcom Inc.", MU: "Micron Technology", AMAT: "Applied Materials",
  JPM: "JPMorgan Chase & Co.", BAC: "Bank of America", GS: "Goldman Sachs",
  MS: "Morgan Stanley", V: "Visa Inc.", MA: "Mastercard Inc.",
  BLK: "BlackRock Inc.", AXP: "American Express", PYPL: "PayPal Holdings",
  UNH: "UnitedHealth Group", LLY: "Eli Lilly and Company", JNJ: "Johnson & Johnson",
  ABBV: "AbbVie Inc.", MRK: "Merck & Co.", PFE: "Pfizer Inc.",
  TMO: "Thermo Fisher Scientific", AMGN: "Amgen Inc.", GILD: "Gilead Sciences",
  WMT: "Walmart Inc.", COST: "Costco Wholesale", PG: "Procter & Gamble",
  KO: "The Coca-Cola Company", PEP: "PepsiCo Inc.", HD: "Home Depot",
  MCD: "McDonald's Corporation", NKE: "Nike Inc.", SBUX: "Starbucks Corporation",
  XOM: "Exxon Mobil Corporation", CVX: "Chevron Corporation",
  BRK: "Berkshire Hathaway", PLTR: "Palantir Technologies",
  COIN: "Coinbase Global", HOOD: "Robinhood Markets",
  SNOW: "Snowflake Inc.", DDOG: "Datadog Inc.", NET: "Cloudflare Inc.",
  ZS: "Zscaler Inc.", CRWD: "CrowdStrike Holdings", PANW: "Palo Alto Networks",
  NOW: "ServiceNow Inc.", WDAY: "Workday Inc.", TEAM: "Atlassian Corporation",
  UBER: "Uber Technologies", LYFT: "Lyft Inc.", ABNB: "Airbnb Inc.",
  DASH: "DoorDash Inc.", SPOT: "Spotify Technology",
};
export function companyName(ticker: string): string | null {
  const n = KNOWN[ticker];
  return n && n !== ticker ? n : null;
}

// ── Percentile rank over the universe ────────────────────────────────────────
export function pctRankFn(scores: number[]): (s: number) => number {
  const sorted = [...scores].sort((a, b) => a - b);
  const n = sorted.length || 1;
  return (s: number) => {
    // count of scores <= s
    let lo = 0, hi = sorted.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (sorted[mid] <= s) lo = mid + 1;
      else hi = mid;
    }
    return (lo / n) * 100;
  };
}
