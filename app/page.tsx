import { getHeroData } from "./lib/qntm-data";
import SessionBounce from "./SessionBounce";

// ISR: regenerate this page at most every 30 min (matches the macro cron).
// Live numbers get baked into static HTML — great for crawlers, fast for users,
// and no client-side DB calls.
export const revalidate = 1800;

export default async function Home() {
  // ── Live data (server-side; falls back to safe defaults if the DB read fails) ─
  const hero = await getHeroData();

  // ── Single source of truth for outbound links ───────────────────────────
  // At domain cutover, change APP_URL only (→ app.qntm.live). Everything follows.
  const APP_URL = "https://app.qntm.live";
  const SIGNIN_URL = `${APP_URL}/?nav=signin`;          // opens app directly on Sign In
  const JOIN_URL = `${APP_URL}/?nav=register`;          // opens app directly on Join Free
  const JOIN_PRO_URL = `${APP_URL}/?nav=register&plan=pro`; // Join Free + auto-claims Pro/founding

  // Privacy/Terms are static pages on the legal site; rest deep-link via the app's ?legal= param.
  const LEGAL_URL = "https://legal.qntm.live";
  const legalLinks = [
    { label: "Privacy Policy", href: `${LEGAL_URL}/privacy.html` },
    { label: "Terms of Service", href: `${LEGAL_URL}/terms.html` },
    { label: "Billing & Refunds", href: `${APP_URL}/?legal=billing` },
    { label: "Investment Disclaimer", href: `${APP_URL}/?legal=disclaimer` },
    { label: "Cookie Policy", href: `${APP_URL}/?legal=cookies` },
  ];

  // Static fallback used only if the live DB read fails (hero.ok === false).
  const fallbackSignals = [
    { ticker: "MU", score: 77, dir: "up" },
    { ticker: "TIGO", score: 76, dir: "up" },
    { ticker: "VIRT", score: 76, dir: "up" },
    { ticker: "MRX", score: 76, dir: "up" },
    { ticker: "OSCR", score: 75, dir: "up" },
  ];
  const fallbackTickerNames = ["MU", "TIGO", "VIRT", "MRX", "OSCR", "GTX", "VISN", "MSGE", "ENVA", "SNEX"];

  // ── Derived live display values ─────────────────────────────────────────
  const regime = hero.regime;
  const regimeText =
    regime.tone === "up" ? "text-mint" : regime.tone === "down" ? "text-red-400" : "text-gold";

  const panelSignals = hero.signals.length
    ? hero.signals.slice(0, 5).map((s) => ({ ticker: s.ticker, score: s.score, dir: "up" }))
    : fallbackSignals;

  const tickerNames = hero.signals.length ? hero.signals.map((s) => s.ticker) : fallbackTickerNames;

  const gemsCount = hero.gems ?? 12;
  const totalCount = hero.total ?? 1402;

  const whyCards = [
    { title: "1402 stocks", color: "text-mint", body: "Russell 1000 + top Russell 2000 small-caps, rescored daily" },
    { title: "5-factor model", color: "text-mint", body: "Momentum, Quality, Volume, Value, Sentiment" },
    { title: "Plain-English", color: "text-gold", body: "A written rationale behind every conviction score" },
    { title: "Live portfolio", color: "text-mint", body: "Rules-based entries & exits, marked daily vs SPY" },
  ];

  const pillars = [
    { pct: "30%", color: "text-gold", label: "Momentum", body: "Price trend, RSI, MACD, MA crossovers, 52-week proximity" },
    { pct: "25%", color: "text-mint", label: "Quality", body: "ROE, profit margin, revenue growth, EPS beat rate, FCF yield" },
    { pct: "20%", color: "text-mint", label: "Volume", body: "Relative volume, OBV, Chaikin Money Flow, accumulation/dist." },
    { pct: "15%", color: "text-gold", label: "Value", body: "Forward P/E, PEG ratio, EV/EBITDA, Price-to-Sales, FCF yield" },
    { pct: "10%", color: "text-mint", label: "Sentiment", body: "Short interest, insider buy ratio, institutional ownership" },
  ];

  const tiers = [
    {
      label: "▲ HIGH",
      score: "Score ≥ 60",
      text: "text-mint",
      border: "border-mint/30",
      body: "Strongest factor profile in the universe. Historically associated with multi-month relative outperformance. In high-volatility or risk-off regimes the model tightens this threshold to 62 to stay selective. Not a recommendation to buy.",
    },
    {
      label: "— MODERATE",
      score: "Score 45–59",
      text: "text-gold",
      border: "border-gold/30",
      body: "Mixed factor profile — neither strong nor deteriorating on the model's measures. Not a recommendation to hold.",
    },
    {
      label: "▼ LOW",
      score: "Score < 45",
      text: "text-red-400",
      border: "border-red-400/30",
      body: "Weakest factor profile. The model flagged UNH here at month 3, ahead of a −49% full-year drawdown. Not a recommendation to sell.",
    },
  ];

  const beyondCards = [
    { title: "Valuation range", color: "text-mint", badge: "FREE", body: "Every card shows where the price sits in its own value band — cheap or rich at a glance." },
    { title: "Weekly recap", color: "text-mint", badge: "FREE", body: "A Saturday email on your watchlist and the macro backdrop behind the week's moves." },
    { title: "Custom alerts", color: "text-gold", badge: "PRO", body: "Price, valuation and conviction alerts — per stock, or a whole watchlist at once." },
    { title: "Hidden Gems", color: "text-gold", badge: null, body: "Under-followed mid- and small-caps the model rates highly, surfaced fresh each scan." },
  ];

  // Comparison table — "·" = ✓, "x" = ✗, "~" = partial
  const compCols = ["QNTM Free", "QNTM Pro", "Motley Fool", "Seeking Alpha", "Morningstar", "TipRanks", "Bloomberg"];
  const compRows = [
    { feature: "Quant factor model", cells: ["·", "·", "x", "·", "~", "~", "·"] },
    { feature: "Live macro regime overlay", cells: ["·", "·", "x", "x", "x", "x", "·"] },
    { feature: "Multi-factor conviction score", cells: ["·", "·", "x", "·", "~", "~", "·"] },
    { feature: "Plain-English signal rationale", cells: ["·", "·", "x", "~", "~", "~", "x"] },
    { feature: "Valuation range on every card", cells: ["·", "·", "x", "~", "·", "~", "·"] },
    { feature: "Weekly recap email", cells: ["·", "·", "·", "·", "~", "~", "x"] },
    { feature: "Live model portfolio", cells: ["·", "·", "~", "~", "x", "x", "x"] },
    { feature: "Daily signal refresh", cells: ["·", "·", "x", "·", "~", "~", "·"] },
    { feature: "Full-universe screener", cells: ["~", "·", "x", "·", "·", "·", "·"] },
    { feature: "Hidden-gem detection", cells: ["x", "·", "~", "x", "x", "x", "x"] },
    { feature: "Portfolio simulator", cells: ["x", "·", "x", "x", "~", "~", "·"] },
    { feature: "Custom price & conviction alerts", cells: ["x", "·", "x", "·", "~", "·", "·"] },
    { feature: "Mobile optimized", cells: ["·", "·", "·", "·", "·", "·", "~"] },
  ];
  const compPrices = ["$0", "$29", "$17", "$25", "$21", "$30", "$2,665"];

  // Renders one comparison cell based on its mark
  function Cell({ mark }: { mark: string }) {
    if (mark === "·") return <span className="text-mint">✓</span>;
    if (mark === "x") return <span className="text-red-400">✗</span>;
    return <span className="text-gold text-sm">partial</span>;
  }

  const freeFeatures = [
    "Screener — top 50 of 1402",
    "HIGH / MOD / LOW conviction signals",
    "5-pillar breakdown + plain-English why",
    "Valuation range on every card",
    "Live macro regime overlay",
    "Top 10 daily picks",
    "Weekly recap email",
    "Portfolio tracking (10 positions)",
    "Live model portfolio (read only)",
  ];
  const proFeatures = [
    "Everything in Free",
    "Full 1402-stock screener",
    "Unlimited portfolio positions",
    "Hidden Gems detection",
    "Portfolio Simulator (risk profiles)",
    "Custom price, value & conviction alerts",
    "Intraday conviction-drop emails",
    "Founding member badge",
  ];

  return (
    <main className="min-h-screen bg-bg text-slate-200">
      <SessionBounce />
      {/* Top nav */}
      <header className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <span className="font-display text-2xl font-extrabold tracking-tight text-gold">QNTM</span>
        <nav className="flex items-center gap-3">
          <a href="/how-it-works" className="hidden sm:inline-flex items-center justify-center font-mono text-xs tracking-widest text-slate-300 px-5 py-2.5 rounded-md border border-white/10 hover:border-white/25 transition">
            HOW IT WORKS
          </a>
          <a href={SIGNIN_URL} className="inline-flex items-center justify-center font-mono text-xs tracking-widest text-slate-300 px-5 py-2.5 rounded-md border border-white/10 hover:border-white/25 transition">
            SIGN IN
          </a>
          <a href={JOIN_URL} className="inline-flex items-center justify-center font-mono text-xs tracking-widest font-medium text-black px-5 py-2.5 rounded-md bg-gold hover:bg-gold-bright transition">
            JOIN FREE
          </a>
        </nav>
      </header>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 pt-8 pb-12 grid lg:grid-cols-2 gap-12 items-center">
        {/* Left column */}
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-gold/20 bg-gold/5 px-4 py-1.5 mb-4">
            <span className="h-1.5 w-1.5 rounded-full bg-mint" />
            <span className="font-mono text-xs tracking-widest text-gold">MODEL LIVE · UPDATED DAILY</span>
          </div>

          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-mint/20 bg-mint/5 px-4 py-1.5 mb-8">
              <span className="font-mono text-sm tracking-wide text-mint">🎯 40 of 50 founding spots left · FREE TODAY</span>
            </div>
          </div>

          <h1 className="font-display font-extrabold text-5xl sm:text-6xl leading-[1.05] tracking-tight">
            <span className="text-white">Know where conviction is </span>
            <span className="text-gold">strongest.</span>
          </h1>

          <p className="mt-6 text-lg text-slate-400 max-w-md leading-relaxed">
            A multi-factor quantitative model scoring 1,402 stocks daily — blended with a live macro regime overlay.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <a href={JOIN_URL} className="inline-flex items-center justify-center font-display font-bold text-black bg-gold hover:bg-gold-bright px-8 py-4 rounded-lg transition">
              JOIN FREE →
            </a>
            <a href={SIGNIN_URL} className="inline-flex items-center justify-center font-display font-bold text-slate-200 bg-card border border-white/10 hover:border-white/25 px-8 py-4 rounded-lg transition">
              SIGN IN
            </a>
          </div>

          <p className="mt-4 font-mono text-xs text-slate-500">
            No credit card · cancel anytime · free tier always available
          </p>
        </div>

        {/* Right column — live panel */}
        <div className="rounded-2xl border border-white/10 bg-card/60 p-5 space-y-6">
          {/* Market regime card */}
          <div className="rounded-xl border border-mint/20 bg-mint/5 p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-mono text-xs tracking-widest text-slate-400">MARKET REGIME</p>
                <p className={`font-display text-3xl font-extrabold ${regimeText} mt-2`}>{regime.icon} {regime.label}</p>
              </div>
              <div className="text-right">
                <p className="font-mono text-xl text-gold">{regime.vix !== null ? regime.vix.toFixed(1) : "—"}</p>
                <p className="font-mono text-xs text-slate-500">VIX</p>
              </div>
            </div>
            <p className="font-mono text-sm text-slate-400 mt-4">
              {regime.event ? `Event: ${regime.event}` : "Live macro overlay active"}
            </p>
          </div>

          {/* Top signals */}
          <div>
            <p className="font-mono text-xs tracking-widest text-slate-400 mb-3">TOP SIGNALS TODAY</p>
            <div className="divide-y divide-white/5">
              {panelSignals.map((s) => (
                <div key={s.ticker} className="flex items-center justify-between py-3">
                  <span className="font-display font-bold text-lg text-slate-100">{s.ticker}</span>
                  <span className={`font-mono ${s.dir === "up" ? "text-mint" : "text-red-400"}`}>
                    {s.score} {s.dir === "up" ? "▲" : "▼"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* View all CTA */}
          <a href={JOIN_URL} className="inline-flex items-center justify-center w-full font-mono text-xs tracking-widest text-gold border border-gold/30 rounded-lg py-3 hover:bg-gold/5 transition">
            VIEW ALL HIGH CONVICTION SIGNALS →
          </a>

          {/* Stat grid */}
          <div className="grid grid-cols-2 gap-y-5 pt-2">
            <div>
              <p className="font-mono text-xs tracking-widest text-slate-500">UNIVERSE</p>
              <p className="font-display text-2xl font-extrabold text-gold mt-1">{totalCount.toLocaleString()}</p>
            </div>
            <div>
              <p className="font-mono text-xs tracking-widest text-slate-500">FACTORS</p>
              <p className="font-display text-2xl font-extrabold text-slate-100 mt-1">5</p>
            </div>
            <div>
              <p className="font-mono text-xs tracking-widest text-slate-500">REFRESH</p>
              <p className="font-display text-2xl font-extrabold text-mint mt-1">Daily</p>
            </div>
            <div>
              <p className="font-mono text-xs tracking-widest text-slate-500">SIGNALS</p>
              <p className="font-display text-2xl font-extrabold text-slate-100 mt-1">Live</p>
            </div>
          </div>
        </div>
      </section>

      {/* Today-in-QNTM summary bar */}
      <div className="border-y border-white/10 bg-card/40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-wrap items-center gap-x-6 gap-y-2 font-mono text-sm">
          <span className="text-gold tracking-widest">TODAY IN QNTM</span>
          <span className={regime.tone === "up" ? "text-mint" : regime.tone === "down" ? "text-red-400" : "text-gold"}>
            {regime.icon} {regime.label}
          </span>
          <span className="text-slate-500">·</span>
          <span className="text-mint">💎 <span className="font-bold">{gemsCount}</span> hidden gems</span>
          <span className="text-slate-500">·</span>
          <span className="text-slate-400">{totalCount.toLocaleString()} stocks scored</span>
        </div>
      </div>

      {/* Scrolling ticker */}
      <div className="overflow-hidden border-b border-white/10 bg-mint/[0.03] py-3">
        <div className="animate-ticker flex w-max gap-8 font-mono text-sm text-mint whitespace-nowrap">
          {[...tickerNames, ...tickerNames].map((name, i) => (
            <span key={i} className="flex items-center gap-8">
              {name} <span className="text-mint">HIGH</span>
            </span>
          ))}
        </div>
      </div>

      {/* Why QNTM */}
      <section className="max-w-7xl mx-auto px-6 py-24">
        <p className="font-mono text-sm tracking-widest text-gold mb-6">— WHY QNTM</p>
        <h2 className="font-display font-extrabold text-4xl sm:text-5xl leading-tight">
          <span className="text-white">A live model.</span>
          <br />
          <span className="text-gold">Transparent by design.</span>
        </h2>
        <p className="mt-6 text-lg text-slate-400 max-w-3xl leading-relaxed">
          Every score is computed daily and shown with the reasoning behind it — no black box, and no
          cherry-picked history. The track record we show is the live Model Portfolio, reported as it happens.
        </p>

        <div className="mt-12 grid sm:grid-cols-2 gap-5">
          {whyCards.map((c) => (
            <div key={c.title} className="rounded-2xl border border-white/10 bg-card/40 p-8">
              <h3 className={`font-display font-extrabold text-3xl ${c.color}`}>{c.title}</h3>
              <p className="mt-3 text-slate-400">{c.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* The model — five pillars + conviction tiers */}
      <section className="max-w-7xl mx-auto px-6 pt-0 pb-24">
        <p className="font-mono text-sm tracking-widest text-gold mb-6">— THE MODEL</p>
        <h2 className="font-display font-extrabold text-4xl sm:text-5xl leading-tight">
          <span className="text-white">Five pillars.</span>
          <br />
          <span className="text-gold">One conviction score.</span>
        </h2>
        <p className="mt-6 text-lg text-slate-400 max-w-3xl leading-relaxed">
          36 factors scored daily across 5 research-backed pillars — then blended 75% conviction score / 25%
          macro overlay. The model tells you exactly what to enter, maintain, or exit. And why.
        </p>

        <div className="mt-12 grid grid-cols-2 lg:grid-cols-5 gap-5">
          {pillars.map((p) => (
            <div key={p.label} className="rounded-2xl border border-white/10 bg-card/40 p-6">
              <p className={`font-display font-extrabold text-4xl ${p.color}`}>{p.pct}</p>
              <p className="mt-3 font-bold text-slate-100">{p.label}</p>
              <p className="mt-2 text-sm text-slate-400 leading-relaxed">{p.body}</p>
            </div>
          ))}
        </div>

        {/* Conviction tiers */}
        <div className="mt-12 grid md:grid-cols-3 gap-5">
          {tiers.map((t) => (
            <div key={t.label} className={`rounded-2xl border ${t.border} bg-card/40 p-8`}>
              <p className={`font-mono text-sm tracking-widest ${t.text}`}>{t.label}</p>
              <p className={`font-mono text-2xl mt-4 ${t.text}`}>{t.score}</p>
              <p className="mt-5 text-slate-400 leading-relaxed">{t.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Beyond the score */}
      <section className="max-w-7xl mx-auto px-6 pt-0 pb-24">
        <p className="font-mono text-sm tracking-widest text-gold mb-6">— BEYOND THE SCORE</p>
        <h2 className="font-display font-extrabold text-4xl sm:text-5xl leading-tight">
          <span className="text-white">More than a screener.</span>
          <br />
          <span className="text-gold">A research routine.</span>
        </h2>
        <p className="mt-6 text-lg text-slate-400 max-w-3xl leading-relaxed">
          The score is the start. Valuation context, a weekly recap, and alerts keep you on the names that
          matter — much of it free.
        </p>

        <div className="mt-12 grid sm:grid-cols-2 gap-5">
          {beyondCards.map((c) => (
            <div key={c.title} className="rounded-2xl border border-white/10 bg-card/40 p-8">
              <div className="flex items-center justify-between">
                <h3 className={`font-display font-bold text-2xl ${c.color}`}>{c.title}</h3>
                {c.badge && (
                  <span className="font-mono text-xs tracking-widest text-slate-400 border border-white/15 rounded px-2 py-1">
                    {c.badge}
                  </span>
                )}
              </div>
              <p className="mt-3 text-slate-400">{c.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* VS the market — comparison table */}
      <section className="max-w-7xl mx-auto px-6 pt-0 pb-24">
        <p className="font-mono text-sm tracking-widest text-gold mb-6">— VS THE MARKET</p>
        <h2 className="font-display font-extrabold text-4xl sm:text-5xl leading-tight">
          <span className="text-white">Institutional tools.</span>
          <br />
          <span className="text-gold">Retail price.</span>
        </h2>
        <p className="mt-6 text-lg text-slate-400 max-w-3xl leading-relaxed">
          Institutional-grade quant signals — at roughly 1% of a Bloomberg terminal.
        </p>

        <div className="mt-12 overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left font-normal text-slate-500 py-4 pr-4"></th>
                {compCols.map((c, i) => (
                  <th
                    key={c}
                    className={`font-mono tracking-wider py-4 px-3 text-center ${
                      i === 0 || i === 1 ? "text-gold" : "text-slate-300"
                    }`}
                  >
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-white/10">
                <td className="text-slate-400 py-4 pr-4">Price / mo*</td>
                {compPrices.map((p, i) => (
                  <td
                    key={i}
                    className={`font-mono text-center py-4 px-3 ${
                      i === 0 || i === 1 ? "text-gold font-bold" : "text-slate-400"
                    }`}
                  >
                    {p}
                  </td>
                ))}
              </tr>
              {compRows.map((row) => (
                <tr key={row.feature} className="border-b border-white/5">
                  <td className="text-slate-300 py-4 pr-4">{row.feature}</td>
                  {row.cells.map((mark, i) => (
                    <td key={i} className="text-center py-4 px-3">
                      <Cell mark={mark} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-6 text-xs text-slate-500 leading-relaxed">
          *Monthly equivalent — most plans bill annually: Motley Fool $199/yr, Seeking Alpha $299/yr,
          Morningstar $249/yr, TipRanks $360/yr (Premium); Bloomberg ≈$31,980/yr per terminal. Features &
          pricing verified June 2026 from public sources. Partial = limited or higher-tier only.
        </p>
      </section>

      {/* Pricing */}
      <section className="max-w-7xl mx-auto px-6 pt-0 pb-24">
        <p className="font-mono text-sm tracking-widest text-gold mb-6">— PRICING</p>
        <h2 className="font-display font-extrabold text-4xl sm:text-5xl leading-tight">
          <span className="text-white">Two tiers.</span>
          <br />
          <span className="text-gold">Both built for serious investors.</span>
        </h2>
        <p className="mt-6 text-lg text-slate-400 max-w-3xl leading-relaxed">
          First 50 users get Founding Member access free — unlimited everything.
        </p>

        {/* Price cards */}
        <div className="mt-12 grid md:grid-cols-2 gap-5">
          {/* FREE */}
          <div className="rounded-2xl border border-white/10 bg-card/40 p-8">
            <p className="font-mono text-sm tracking-widest text-slate-300">FREE</p>
            <p className="font-display font-extrabold text-5xl text-gold mt-3">$0</p>
            <p className="font-mono text-xs text-slate-500 mt-2">forever · no card needed</p>
            <ul className="mt-8 space-y-3">
              {freeFeatures.map((f) => (
                <li key={f} className="flex items-start gap-3 text-slate-300">
                  <span className="text-slate-500 mt-1">○</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <a href={JOIN_URL} className="inline-flex items-center justify-center mt-8 w-full font-display font-bold text-slate-200 bg-card border border-white/10 hover:border-white/25 py-4 rounded-lg transition">
              START FREE →
            </a>
          </div>

          {/* PRO */}
          <div className="rounded-2xl border border-gold/40 bg-gold/[0.04] p-8 relative">
            <span className="absolute -top-3 left-8 bg-gold text-black font-mono text-xs tracking-widest px-3 py-1 rounded">
              MOST POPULAR
            </span>
            <p className="font-mono text-sm tracking-widest text-slate-300">PRO</p>
            <p className="font-display font-extrabold text-5xl text-gold mt-3">
              $29<span className="text-2xl text-slate-400">/mo</span>
            </p>
            <p className="font-mono text-xs text-slate-500 mt-2">first 50 users get it free</p>
            <ul className="mt-8 space-y-3">
              {proFeatures.map((f) => (
                <li key={f} className="flex items-start gap-3 text-slate-200">
                  <span className="text-mint mt-1">●</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <a href={JOIN_PRO_URL} className="inline-flex items-center justify-center mt-8 w-full font-display font-bold text-black bg-gold hover:bg-gold-bright py-4 rounded-lg transition">
              JOIN FREE — FOUNDING MEMBER →
            </a>
          </div>
        </div>

        <p className="mt-6 text-center font-mono text-sm text-gold">
          ⚡ Founding member pricing — <span className="line-through text-slate-500">$29/mo</span> free while spots last · Limited availability
        </p>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="grid sm:grid-cols-3 gap-10">
            <div>
              <span className="font-display text-2xl font-extrabold tracking-tight text-gold">QNTM</span>
              <p className="mt-4 text-slate-400 max-w-xs leading-relaxed">
                Quantitative conviction factor model platform. Institutional-grade research for retail investors.
              </p>
            </div>
            <div>
              <p className="font-mono text-xs tracking-widest text-slate-500 mb-4">LEGAL</p>
              <ul className="space-y-3 text-slate-400">
                {legalLinks.map((l) => (
                  <li key={l.label}>
                    <a href={l.href} className="hover:text-slate-200 transition">{l.label}</a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-mono text-xs tracking-widest text-slate-500 mb-4">CONTACT</p>
              <p className="font-mono text-slate-400">COMING SOON</p>
            </div>
          </div>

          <div className="mt-12 rounded-2xl border border-gold/20 bg-gold/[0.03] p-8">
            <p className="font-mono text-sm tracking-widest text-gold mb-3">IMPORTANT DISCLAIMER</p>
            <p className="text-sm text-slate-400 leading-relaxed">
              QNTM is a <span className="font-bold text-slate-300">quantitative research and factor analysis tool</span> for
              informational and educational purposes only. It does <span className="font-bold text-slate-300">not</span> constitute
              investment advice, a recommendation to buy or sell any security, or a guarantee of future performance. Past model
              performance does not predict future results. All investments involve risk including possible loss of principal.
              Always consult a qualified financial adviser.
            </p>
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-between gap-4 text-sm text-slate-500">
            <span>© 2026 QNTM. All rights reserved.</span>
            <span className="font-mono">Not investment advice · Quantitative research tool only</span>
          </div>
        </div>
      </footer>

    </main>
  );
}
