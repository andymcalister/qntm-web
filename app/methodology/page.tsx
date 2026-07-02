"use client";

import { useEffect, useState } from "react";
import NavBar from "../screener/NavBar";
import HowItWorksBody from "../how-it-works/HowItWorksContent";

// In-app methodology view. Same copy as the public /how-it-works page, but
// wrapped in the app shell (NavBar, session intact) so a logged-in user reading
// it never leaves the product or looks signed out. Guarded by middleware.

const LOGIN_URL = process.env.NEXT_PUBLIC_LOGIN_URL || "https://app.qntm.live";
const FONT_MONO = "var(--font-dm-mono, 'DM Mono'), monospace";

export default function Methodology() {
  const [uid, setUid] = useState("");
  const [plan, setPlan] = useState("free");

  useEffect(() => {
    (async () => {
      try {
        const me = await fetch("/api/me").then((r) => r.json()).catch(() => ({ plan: "free" }));
        setUid(me?.user_id || "");
        setPlan(me?.plan || "free");
      } catch {
        /* NavBar still renders with defaults */
      }
    })();
  }, []);

  async function signOut() {
    try { await fetch("/api/session", { method: "DELETE" }); } catch {}
    window.location.href = LOGIN_URL;
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-bg,#060709)", color: "#cbd5e1" }}>
      <NavBar uid={uid} plan={plan} active="methodology" onSignOut={signOut} />
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "28px 24px 72px" }}>
        <HowItWorksBody />
        <div style={{ marginTop: 28, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <a href="/screener" style={{ fontFamily: "var(--font-syne,'Syne'),sans-serif", fontWeight: 800, fontSize: 14, color: "#04120c", background: "#34d399", borderRadius: 10, padding: "12px 24px", textDecoration: "none" }}>Back to the screener →</a>
        </div>
        <p style={{ fontFamily: FONT_MONO, fontSize: 11, color: "#4b5568", marginTop: 32, lineHeight: 1.7 }}>
          QNTM provides quantitative model outputs for informational and educational purposes only. It is not investment advice and QNTM is not a registered investment adviser. Consult a qualified financial adviser before investing.
        </p>
      </div>
    </div>
  );
}
