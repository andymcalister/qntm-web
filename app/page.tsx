export default function Home() {
  const topSignals = [
    { ticker: "MU", score: 77, dir: "up" },
    { ticker: "TIGO", score: 76, dir: "up" },
    { ticker: "VIRT", score: 76, dir: "up" },
    { ticker: "MRX", score: 76, dir: "up" },
    { ticker: "OSCR", score: 75, dir: "up" },
  ];

  const tickerNames = ["MU", "TIGO", "VIRT", "MRX", "OSCR", "GTX", "VISN", "MSGE", "ENVA", "SNEX"];

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

  return (
    <main className="min-h-screen bg-bg text-slate-200">
      {/* Top nav */}
      <header className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <span className="font-display text-2xl font-extrabold tracking-tight text-gold">QNTM</span>
        <nav className="flex items-center gap-3">
          <button className="font-mono text-xs tracking-widest text-slate-300 px-5 py-2.5 rounded-md border border-white/10 hover:border-white/25 transition">
            SIGN IN
          </button>
          <button className="font-mono text-xs tracking-widest font-medium text-black px-5 py-2.5 rounded-md bg-gold hover:bg-gold-bright transition">
            JOIN FREE
          </button>
        </nav>
      </header>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 pt-10 pb-24 grid lg:grid-cols-2 gap-12 items-start">
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
            <button className="font-display font-bold text-black bg-gold hover:bg-gold-bright px-8 py-4 rounded-lg transition">
              JOIN FREE →
            </button>
            <button className="font-display font-bold text-slate-200 bg-card border border-white/10 hover:border-white/25 px-8 py-4 rounded-lg transition">
              SIGN IN
            </button>
          </div>

          <p className="mt-4 font-mono text-xs text-slate-500">
            No credit card · cancel anytime · free tier always available
          </p>
        </div>

        {/* Right column — live panel (placeholder data for now) */}
        <div className="rounded-2xl border border-white/10 bg-card/60 p-5 space-y-6">
          {/* Market regime card */}
          <div className="rounded-xl border border-mint/20 bg-mint/5 p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-mono text-xs tracking-widest text-slate-400">MARKET REGIME</p>
                <p className="font-display text-3xl font-extrabold text-mint mt-2">▲ Risk On</p>
              </div>
              <div className="text-right">
                <p className="font-mono text-xl text-gold">75/25</p>
                <p className="font-mono text-xs text-slate-500">quant/macro</p>
              </div>
            </div>
            <p className="font-mono text-sm text-slate-400 mt-4">VIX 18.3 &nbsp; Event: War Deescalation</p>
          </div>

          {/* Top signals */}
          <div>
            <p className="font-mono text-xs tracking-widest text-slate-400 mb-3">TOP SIGNALS TODAY</p>
            <div className="divide-y divide-white/5">
              {topSignals.map((s) => (
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
          <button className="w-full font-mono text-xs tracking-widest text-gold border border-gold/30 rounded-lg py-3 hover:bg-gold/5 transition">
            VIEW ALL HIGH CONVICTION SIGNALS →
          </button>

          {/* Stat grid */}
          <div className="grid grid-cols-2 gap-y-5 pt-2">
            <div>
              <p className="font-mono text-xs tracking-widest text-slate-500">UNIVERSE</p>
              <p className="font-display text-2xl font-extrabold text-gold mt-1">1402</p>
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
          <span className="text-mint">▲ Risk On</span>
          <span className="text-slate-500">·</span>
          <span><span className="text-slate-100 font-bold">100</span> <span className="text-slate-400">high</span></span>
          <span className="text-slate-500">·</span>
          <span><span className="text-red-400 font-bold">430</span> <span className="text-slate-400">low</span></span>
          <span className="text-slate-500">·</span>
          <span className="text-mint">💎 <span className="font-bold">12</span> hidden gems</span>
          <span className="text-slate-500">·</span>
          <span className="text-slate-400">1402 stocks scored</span>
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

      {/* The model — five pillars */}
      <section className="max-w-7xl mx-auto px-6 pt-0 pb-24">
        <p className="font-mono text-sm tracking-widest text-gold mb-6">— THE MODEL</p>
        <h2 className="font-display font-extrabold text-4xl sm:text-5xl leading-tight">
          <span className="text-white">Five pillars.</span>
          <br />
          <span className="text-gold">One conviction score.</span>
        </h2>
        <p className="mt-6 text-lg text-slate-400 max-w-3xl leading-relaxed">
          36 factors scored daily across 5 research-backed pillars — plus a 75/25 macro overlay. The model
          tells you exactly what to enter, maintain, or exit. And why.
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

    </main>
  );
}