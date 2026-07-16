// Single source of truth for the methodology copy. Rendered by BOTH the public
// /how-it-works page (marketing header, crawlable) and the in-app /methodology
// page (app NavBar, session preserved). No "use client" and no server-only
// imports, so it drops cleanly into either a server or a client wrapper.

const FONT_DISPLAY = "var(--font-syne, 'Syne'), sans-serif";
const FONT_MONO = "var(--font-dm-mono, 'DM Mono'), monospace";

type Section = { title: string; color: string; body: string };

export const SECTIONS: Section[] = [
  { title: "Getting Started — Where to Begin", color: "#34d399", body:
    "New here? This is the path most users follow:\n\n" +
    "1. Screener — your home base. Every stock in the universe, ranked by conviction. Start at the top (High Conviction) and work down.\n" +
    "2. Open a stock — tap any row to see its plain-English rationale and the five pillar scores behind the signal.\n" +
    "3. Watchlist — star the names you want to follow; they get a tracked view marked against the S&P 500.\n" +
    "4. Hidden Gems — strong-scoring names that fly under Wall Street's radar.\n" +
    "5. Portfolio Simulator — test a hypothetical allocation and see how the model scores it.\n" +
    "6. Portfolio & Track Record — the model's live, rules-based portfolio and its performance since inception.\n" +
    "7. Alerts — get notified when a stock's conviction changes (Pro).\n\n" +
    "Throughout, the macro overlay at the top of the Screener tells you what regime the market is in and how it's shaping the scores. Everything below explains how those scores are built." },
  { title: "The Universe", color: "#34d399", body:
    "QNTM covers 1,400+ US stocks: the Russell 1000 (large- and mid-cap) plus a layer of the largest Russell 2000 small-caps, cleaned of delisted and illiquid tickers. The Russell 1000 core anchors the Screener and the model portfolio; the small-cap layer feeds the Hidden Gems screen with genuinely under-followed names. Scores refresh nightly, with live price updates and hourly full re-scores during market hours.\n\n" +
    "Universe expansion (June 21, 2026): the investable universe was widened from ~830 names to the current ~1,400. This is a forward methodology change — the model portfolio and its track record are not restated retroactively. The wider opportunity set applies from the expansion date forward, and the portfolio migrates into it as positions turn over." },
  { title: "The Factor Model", color: "#34d399", body:
    "Each stock receives a composite score (0–100) built from five weighted pillars:\n\n" +
    "• Momentum (30%) — price trend, RSI, MACD, 52-week proximity, rate of change\n" +
    "• Quality (25%) — ROE, profit margin, revenue growth, EPS beat rate, FCF yield\n" +
    "• Volume (20%) — relative volume, OBV, Chaikin Money Flow, accumulation/distribution\n" +
    "• Value (15%) — forward P/E, PEG ratio, EV/EBITDA, Price-to-Sales\n" +
    "• Sentiment (10%) — short interest, insider buy ratio, institutional ownership\n\n" +
    "Scores are cross-sectional — a score of 75 means the stock ranks stronger than 75% of the universe." },
  { title: "Conviction Signals", color: "#34d399", body:
    "• High Conviction (score ≥ 65) — model sees strong multi-factor alignment.\n" +
    "• Moderate Conviction (56–64) — mixed factor signals, neither strong nor deteriorating.\n" +
    "• Low Conviction (score ≤ 55) — weakest factor profile in the universe. Elevated model risk.\n\n" +
    "Signals are quantitative rankings, not buy/sell/hold recommendations. Signals update nightly. In HIGH VOLATILITY regimes, the portfolio entry bar tightens to ≥ 70 (the High Conviction label stays ≥ 65)." },
  { title: "Macro Overlay", color: "#d4a843", body:
    "A live macro regime overlay adjusts composite scores based on current market conditions:\n\n" +
    "• VIX level — real-time fear gauge (updates every 15 minutes)\n" +
    "• WTI crude price — oil spike detection via CL=F futures\n" +
    "• News sentiment — 70+ headlines scanned from Yahoo Finance RSS and FRED\n" +
    "• Active events — war escalation, tariff regimes, Fed policy, oil spikes\n\n" +
    "Weighting: 75% quant model / 25% macro overlay. In RISK OFF / HIGH VOLATILITY regimes, macro dampening reduces adjusted composite scores to reflect elevated systemic risk. Regime updates every 15 minutes during your session." },
  { title: "Hidden Gems", color: "#34d399", body:
    "Hidden Gems are mid- and small-cap stocks scoring above conviction threshold that fly under Wall Street's radar. Detection criteria:\n\n" +
    "• Not a mega-cap (excludes NVDA, AAPL, MSFT, etc.)\n" +
    "• Adjusted composite ≥ 65 (67+ in Risk-Off regimes)\n" +
    "• Momentum ≥ 58, Quality ≥ 55\n" +
    "• At least one fundamental reason: revenue acceleration, earnings beats, low short interest, insider buying\n\n" +
    "Gems are identified fresh each scan — the list changes as fundamentals and scores shift." },
  { title: "Performance & Track Record", color: "#d4a843", body:
    "QNTM does not currently publish a historical backtest. A backtest is only credible when every score is computed from data that was actually available at the time — point-in-time fundamentals, the universe as it existed then, and macro conditions as they were known. We're building that properly rather than publishing numbers that can't withstand scrutiny.\n\n" +
    "The track record we show is the live Model Portfolio: rules-based entries and exits on the model's signals, tracked daily from inception forward. A live record is short by nature. Past model performance does not guarantee future results." },
  { title: "Scores & Alerts", color: "#d4a843", body:
    "• Nightly refresh — full universe rescored each night via automated cron\n" +
    "• Daily signals — conviction scores are close-to-close; the macro overlay is the only intraday-moving input\n" +
    "• Signal alerts — Pro users receive notifications when watchlist stocks change conviction tier\n" +
    "• Macro regime — refreshed every 15 minutes from live VIX, WTI, and news feeds\n" +
    "• Platform stats — gem count, high/low conviction counts updated after each refresh" },
  { title: "What QNTM Does NOT Do", color: "#f87171", body:
    "• QNTM does not provide personalized investment advice\n" +
    "• QNTM does not account for your individual tax situation, risk tolerance, or financial goals\n" +
    "• QNTM does not predict short-term price movements or guarantee future results\n" +
    "• QNTM is not a registered investment adviser under the Investment Advisers Act of 1940\n" +
    "• Conviction scores are quantitative model outputs — not buy or sell recommendations\n" +
    "• Prices shown are indicative snapshots — not real-time execution prices\n\n" +
    "Always consult a qualified financial adviser before making investment decisions." },
  { title: "Billing & Cancellation", color: "#d4a843", body:
    "• Pro includes a 7-day free trial — you are not charged during the trial.\n" +
    "• After the trial, QNTM Pro automatically renews at $29.00/month until you cancel.\n" +
    "• You are charged $29.00 on the same date each month.\n" +
    "• Cancel anytime in Account Settings → Subscription with a single click. Cancelling stops your next charge immediately; you keep Pro access until the end of your current paid period, then your account converts to Free.\n" +
    "• Founding Members pay $0 and have no auto-renewal.\n\n" +
    "Full terms are in the Billing & Refund Policy and Terms of Service." },
];

// The intro + section list. No header/footer — each wrapper supplies its own
// chrome (marketing header for public, app NavBar for in-app).
export default function HowItWorksBody() {
  return (
    <>
      <p style={{ fontFamily: FONT_MONO, fontSize: 13, letterSpacing: ".2em", color: "#d4a843", margin: 0 }}>📖 METHODOLOGY</p>
      <h1 style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 34, color: "#fff", margin: "10px 0 0", lineHeight: 1.15 }}>How QNTM Works</h1>
      <p style={{ fontFamily: FONT_MONO, fontSize: 14, color: "#9fabc0", margin: "10px 0 0", lineHeight: 1.6, maxWidth: 640 }}>
        Transparent methodology — what the model does, how it scores stocks, and what it doesn&apos;t do.
      </p>

      <div style={{ marginTop: 28 }}>
        {SECTIONS.map((s) => (
          <section key={s.title} style={{ borderLeft: `3px solid ${s.color}`, padding: "16px 20px", marginBottom: 16, background: "rgba(255,255,255,.02)", borderRadius: "0 8px 8px 0" }}>
            <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 15, fontWeight: 700, color: s.color, letterSpacing: ".04em", margin: "0 0 8px" }}>{s.title}</h2>
            <div style={{ fontFamily: FONT_MONO, fontSize: 13, color: "#b3bed0", lineHeight: 1.85, whiteSpace: "pre-line" }}>{s.body}</div>
          </section>
        ))}
      </div>
    </>
  );
}
