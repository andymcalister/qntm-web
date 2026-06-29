export default function Home() {
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

        {/* Right column — placeholder, we build this next */}
        <div className="hidden lg:flex min-h-[420px] rounded-2xl border border-white/5 items-center justify-center">
          <span className="font-mono text-xs text-slate-600">Live panel — next step</span>
        </div>
      </section>
    </main>
  );
}