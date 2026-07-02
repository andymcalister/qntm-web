"use client";

import { FONT_DISPLAY, FONT_MONO } from "./lib";

const LOGIN_BASE = process.env.NEXT_PUBLIC_LOGIN_URL || "https://app.qntm.live";

// Mirrors the Streamlit nav set. `screener` is the one route that's migrated to
// Next; the rest still live in Streamlit and link there carrying the session
// (uid + plan + ck=1), so a logged-in user hops to those pages without a login
// bounce. As each page migrates, flip its href from the Streamlit URL to the
// new Next route.
const ITEMS: { key: string; icon: string; label: string }[] = [
  { key: "screener", icon: "📊", label: "Screener" },
  { key: "watchlist", icon: "★", label: "Watchlist" },
  { key: "gems", icon: "💎", label: "Hidden Gems" },
  { key: "portfolio", icon: "💼", label: "Portfolio" },
  { key: "simulator", icon: "🧮", label: "Simulator" },
  { key: "model_portfolio", icon: "🏆", label: "Track Record" },
  { key: "alerts", icon: "🔔", label: "Alerts" },
  { key: "account", icon: "⚙️", label: "Account" },
  { key: "methodology", icon: "📖", label: "How It Works" },
];

// Routes already migrated to the Next app (internal links).
const NEXT_ROUTES: Record<string, string> = { screener: "/screener", watchlist: "/watchlist", portfolio: "/portfolio", model_portfolio: "/model-portfolio", gems: "/hidden-gems" };

export default function NavBar({
  uid, plan, active = "screener", onSignOut,
}: {
  uid: string; plan: string; active?: string; onSignOut: () => void;
}) {
  const streamlitHref = (key: string) => {
    const p = encodeURIComponent(plan || "free");
    const u = uid ? `&uid=${encodeURIComponent(uid)}` : "";
    return `${LOGIN_BASE}/?qnav=${key}${u}&plan=${p}&ck=1`;
  };

  return (
    <div style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(8,9,12,.85)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", borderBottom: "1px solid rgba(255,255,255,.07)" }}>
      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "10px 24px", display: "flex", alignItems: "center", gap: 16 }}>
        <a href="/screener" style={{ textDecoration: "none", flexShrink: 0 }}>
          <span style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 18, color: "#d4a843", letterSpacing: ".02em" }}>QNTM</span>
        </a>
        <nav style={{ display: "flex", gap: 3, overflowX: "auto", flex: 1, scrollbarWidth: "none" }} className="qntm-nav-scroll">
          {ITEMS.map((it) => {
            const isActive = it.key === active;
            const inner = (
              <span style={{
                display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 11px", borderRadius: 8, whiteSpace: "nowrap",
                fontFamily: FONT_MONO, fontSize: 12.5, letterSpacing: ".02em",
                color: isActive ? "#34d399" : "#9fabc0",
                background: isActive ? "linear-gradient(135deg,rgba(52,211,153,.14),rgba(52,211,153,.04))" : "transparent",
                border: isActive ? "1px solid rgba(52,211,153,.5)" : "1px solid transparent",
                transition: "background .15s, color .15s",
              }}>
                <span style={{ fontSize: 13 }}>{it.icon}</span>{it.label}
              </span>
            );
            const href = NEXT_ROUTES[it.key] || streamlitHref(it.key);
            return <a key={it.key} href={href} style={{ textDecoration: "none" }}>{inner}</a>;
          })}
        </nav>
        <button onClick={onSignOut} style={{ flexShrink: 0, fontFamily: FONT_MONO, fontSize: 11, letterSpacing: ".12em", color: "#94a3b8", border: "1px solid rgba(255,255,255,.1)", borderRadius: 8, padding: "7px 11px", background: "transparent", cursor: "pointer", whiteSpace: "nowrap" }}>
          SIGN OUT
        </button>
      </div>
      <style>{`.qntm-nav-scroll::-webkit-scrollbar{display:none}`}</style>
    </div>
  );
}
