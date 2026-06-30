// app/lib/qntm-data.ts
// ─────────────────────────────────────────────────────────────────────────────
// Server-side live data for the marketing hero.
// Reads QNTM's Supabase via the ANON key (read-only). Runs on the server only —
// the key is never shipped to the browser. Results are cached via ISR (see the
// `revalidate` export in page.tsx), so these queries run ~every 30 min at
// regeneration time, NOT on every visitor request. Crawlers get real numbers
// baked into static HTML.
//
// Single source of truth: these are the same tables app.py reads, so the hero
// shows the same scores users see inside the app.
// ─────────────────────────────────────────────────────────────────────────────

const SUPABASE_URL = process.env.SUPABASE_URL ?? "";
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY ?? "";

const REVALIDATE = 1800; // 30 min — matches the macro cron cadence

export type Signal = { ticker: string; score: number };

export type Regime = {
  label: string;                       // "Mildly Bullish"
  icon: string;                        // ▲ / ● / ▼
  tone: "up" | "neutral" | "down";
  vix: number | null;
  event: string | null;               // "Ceasefire / De-escalation"
};

export type HeroData = {
  regime: Regime;
  signals: Signal[];                   // top 10 by adj_composite (panel uses 5, ticker uses all)
  gems: number | null;
  total: number | null;
  ok: boolean;                         // false if the DB read failed → page uses safe fallbacks
};

async function sb(path: string): Promise<any | null> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null;
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      next: { revalidate: REVALIDATE },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

// Map a stored regime string → display label + icon + tone.
// Handles both "MILDLY BULLISH" and "RISK_ON"-style values.
function mapRegime(raw: string | null, vix: number | null, event: string | null): Regime {
  const r = (raw ?? "NEUTRAL").toUpperCase().replace(/_/g, " ").trim();
  const label = r
    .split(" ")
    .map((w) => (w ? w[0] + w.slice(1).toLowerCase() : w))
    .join(" ");
  let icon = "●";
  let tone: "up" | "neutral" | "down" = "neutral";
  if (r.includes("RISK ON") || r.includes("BULLISH")) {
    icon = "▲";
    tone = "up";
  } else if (r.includes("RISK OFF") || r.includes("VOLATIL") || r.includes("BEARISH")) {
    icon = "▼";
    tone = "down";
  }
  return { label, icon, tone, vix, event };
}

const FALLBACK: HeroData = {
  regime: { label: "Live", icon: "●", tone: "neutral", vix: null, event: null },
  signals: [],
  gems: null,
  total: null,
  ok: false,
};

export async function getHeroData(): Promise<HeroData> {
  const [macroRows, sigRows, statRows] = await Promise.all([
    // 1) Macro regime — single-row overlay JSONB
    sb("macro_state?select=overlay&limit=1"),
    // 2) Top signals — newest signal_date first, then highest adj_composite
    sb("signal_log?select=ticker,adj_composite,signal_date&order=signal_date.desc,adj_composite.desc&limit=10"),
    // 3) Summary counts — gems + total are stable; we intentionally skip n_high/n_low
    //    (those track the stale platform_stats.stat_date until that cron is fixed).
    sb("platform_stats?select=n_gems,n_total&stat_key=eq.daily_summary&limit=1"),
  ]);

  if (!macroRows && !sigRows && !statRows) return FALLBACK;

  // Regime (parse overlay; it may arrive as a JSON string or an object)
  let regime = FALLBACK.regime;
  try {
    const ov = macroRows?.[0]?.overlay;
    const o = typeof ov === "string" ? JSON.parse(ov) : ov;
    if (o) {
      const vix = typeof o.vix === "number" ? Math.round(o.vix * 10) / 10 : null;
      const event =
        Array.isArray(o.event_labels) && o.event_labels.length
          ? String(o.event_labels[0])
          : null;
      regime = mapRegime(o.regime ?? null, vix, event);
    }
  } catch {
    /* keep fallback regime */
  }

  // Top signals (rounded the way app.py renders them: :.0f)
  const signals: Signal[] = Array.isArray(sigRows)
    ? sigRows.map((r: any) => ({
        ticker: String(r.ticker),
        score: Math.round(Number(r.adj_composite) || 0),
      }))
    : [];

  const gems = statRows?.[0]?.n_gems ?? null;
  const total = statRows?.[0]?.n_total ?? null;

  return { regime, signals, gems, total, ok: signals.length > 0 };
}
