"use client";

import { useState } from "react";
import { FONT_DISPLAY, FONT_MONO } from "./lib";

const LOGIN_BASE = process.env.NEXT_PUBLIC_LOGIN_URL || "https://app.qntm.live";

// Mirrors the Streamlit nav set. As each page migrates, flip its href from the
// Streamlit URL (NEXT_ROUTES below) to the new Next route.
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

const NEXT_ROUTES: Record<string, string> = { screener: "/screener", watchlist: "/watchlist", portfolio: "/portfolio", model_portfolio: "/model-portfolio", gems: "/hidden-gems", simulator: "/simulator", alerts: "/alerts" };

export default function NavBar({
  uid, plan, active = "screener", onSignOut,
}: {
  uid: string; plan: string; active?: string; onSignOut: () => void;
}) {
  const [open, setOpen] = useState(false);

  const streamlitHref = (key: string) => {
    const p = encodeURIComponent(plan || "free");
    const u = uid ? `&uid=${encodeURIComponent(uid)}` : "";
    return `${LOGIN_BASE}/?qnav=${key}${u}&plan=${p}&ck=1`;
  };
  const hrefFor = (key: string) => NEXT_ROUTES[key] || streamlitHref(key);
  const activeItem = ITEMS.find((i) => i.key === active);

  return (
    <div style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(8,9,12,.9)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", borderBottom: "1px solid rgba(255,255,255,.07)" }}>
      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "10px 24px", display: "flex", alignItems: "center", gap: 16 }}>
        <a href="/screener" style={{ textDecoration: "none", flexShrink: 0 }}>
          <span style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 18, color: "#d4a843", letterSpacing: ".02em" }}>QNTM</span>
        </a>

        {/* desktop: inline nav */}
        <nav className="qntm-nav-desktop" style={{ gap: 3, flex: 1, flexWrap: "wrap" }}>
          {ITEMS.map((it) => {
            const isActive = it.key === active;
            return (
              <a key={it.key} href={hrefFor(it.key)} style={{ textDecoration: "none" }}>
                <span style={{
                  display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 11px", borderRadius: 8, whiteSpace: "nowrap",
                  fontFamily: FONT_MONO, fontSize: 12.5, letterSpacing: ".02em",
                  color: isActive ? "#34d399" : "#9fabc0",
                  background: isActive ? "linear-gradient(135deg,rgba(52,211,153,.14),rgba(52,211,153,.04))" : "transparent",
                  border: isActive ? "1px solid rgba(52,211,153,.5)" : "1px solid transparent",
                }}>
                  <span style={{ fontSize: 13 }}>{it.icon}</span>{it.label}
                </span>
              </a>
            );
          })}
        </nav>

        {/* mobile: menu button */}
        <div className="qntm-nav-mobile" style={{ flex: 1, alignItems: "center" }}>
          <button onClick={() => setOpen((o) => !o)} aria-expanded={open} style={{
            display: "inline-flex", alignItems: "center", gap: 8, fontFamily: FONT_MONO, fontSize: 13, letterSpacing: ".03em",
            color: "#cbd5e1", background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.12)", borderRadius: 8, padding: "8px 14px", cursor: "pointer",
          }}>
            <span style={{ fontSize: 14 }}>☰</span>
            <span>{activeItem?.label || "Menu"}</span>
            <span style={{ fontSize: 10, color: "#8896ac", transform: open ? "rotate(180deg)" : "none", transition: "transform .15s" }}>▾</span>
          </button>
        </div>

        <button onClick={onSignOut} style={{ flexShrink: 0, fontFamily: FONT_MONO, fontSize: 11, letterSpacing: ".12em", color: "#94a3b8", border: "1px solid rgba(255,255,255,.1)", borderRadius: 8, padding: "7px 11px", background: "transparent", cursor: "pointer", whiteSpace: "nowrap" }}>
          SIGN OUT
        </button>
      </div>

      {/* mobile dropdown panel */}
      {open && (
        <div className="qntm-nav-mobile">
          <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, top: 56, zIndex: 40, background: "rgba(0,0,0,.4)" }} />
          <div style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 45, background: "#0c0e14", borderBottom: "1px solid rgba(255,255,255,.1)", boxShadow: "0 12px 28px rgba(0,0,0,.5)", padding: "6px", maxHeight: "70vh", overflowY: "auto" }}>
            {ITEMS.map((it) => {
              const isActive = it.key === active;
              return (
                <a key={it.key} href={hrefFor(it.key)} onClick={() => setOpen(false)} style={{ textDecoration: "none", display: "block" }}>
                  <div style={{
                    display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderRadius: 8,
                    fontFamily: FONT_MONO, fontSize: 14, letterSpacing: ".02em",
                    color: isActive ? "#34d399" : "#cbd5e1",
                    background: isActive ? "rgba(52,211,153,.1)" : "transparent",
                    border: isActive ? "1px solid rgba(52,211,153,.4)" : "1px solid transparent",
                  }}>
                    <span style={{ fontSize: 16, width: 20, textAlign: "center" }}>{it.icon}</span>{it.label}
                  </div>
                </a>
              );
            })}
          </div>
        </div>
      )}

      <style>{`
        .qntm-nav-desktop{display:flex}
        .qntm-nav-mobile{display:none}
        @media (max-width:820px){
          .qntm-nav-desktop{display:none!important}
          .qntm-nav-mobile{display:flex!important}
        }
      `}</style>
    </div>
  );
}
