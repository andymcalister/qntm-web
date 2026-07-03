"use client";

import { useEffect, useState } from "react";

const FONT_DISPLAY = "var(--font-syne,'Syne'),sans-serif";
const FONT_MONO = "var(--font-dm-mono,'DM Mono'),monospace";

type State = "checking" | "ok" | "bad";

export default function VerifyEmail() {
  const [state, setState] = useState<State>("checking");

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("token") || "";
    if (!token) { setState("bad"); return; }
    (async () => {
      try {
        const r = await fetch("/api/auth/verify-email", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const d = await r.json().catch(() => ({}));
        setState(r.ok && d.ok ? "ok" : "bad");
      } catch { setState("bad"); }
    })();
  }, []);

  const btn: React.CSSProperties = {
    display: "block", textAlign: "center", padding: "13px", borderRadius: 8,
    background: "linear-gradient(135deg,#34d399,#059669)", color: "#04120c",
    fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 15, textDecoration: "none",
  };

  return (
    <div style={{ minHeight: "100vh", background: "#060709", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 380 }}>
        <a href="/" style={{ display: "block", textAlign: "center", marginBottom: 24 }}>
          <img src="/qntm-wordmark.png" alt="QNTM" style={{ height: 30, width: "auto" }} />
        </a>
        <div style={{ border: "1px solid rgba(255,255,255,.08)", borderRadius: 14, padding: 28, background: "rgba(255,255,255,.015)" }}>
          {state === "checking" ? (
            <p style={{ fontFamily: FONT_MONO, fontSize: 13, color: "#64748b", margin: 0 }}>Confirming your email…</p>
          ) : state === "ok" ? (
            <>
              <h1 style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 22, color: "#fff", margin: "0 0 12px" }}>Email confirmed ✓</h1>
              <p style={{ fontFamily: FONT_MONO, fontSize: 13, color: "#9fabc0", lineHeight: 1.6, margin: "0 0 18px" }}>Your email is verified — you're all set for alerts and account emails.</p>
              <a href="/screener" style={btn}>Go to the screener</a>
            </>
          ) : (
            <>
              <h1 style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 22, color: "#fff", margin: "0 0 12px" }}>Link expired</h1>
              <p style={{ fontFamily: FONT_MONO, fontSize: 13, color: "#9fabc0", lineHeight: 1.6, margin: "0 0 18px" }}>This confirmation link is invalid or has expired. You can request a fresh one from Account settings.</p>
              <a href="/screener" style={btn}>Go to the screener</a>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
