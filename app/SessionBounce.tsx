"use client";

import { useEffect, useState } from "react";

// Cutover hand-off catcher. Classic redirects here to qntm.live/#bt=<jwt> after
// login; this reads the token from the fragment (fragments never hit the server
// or logs), exchanges it for an httpOnly session via /api/session, and lands the
// user on the screener. While it works, it covers the page with a dark overlay
// so the marketing home never flashes mid-hand-off.
const LOGIN_URL = process.env.NEXT_PUBLIC_LOGIN_URL || "https://app.qntm.live";
const FONT_MONO = "var(--font-dm-mono,'DM Mono'),monospace";

export default function SessionBounce() {
  const [bouncing, setBouncing] = useState(false);

  useEffect(() => {
    const hash = typeof window !== "undefined" ? window.location.hash : "";
    if (!hash || hash.indexOf("bt=") === -1) return;

    const m = hash.match(/bt=([^&]+)/);
    const token = m ? decodeURIComponent(m[1]) : null;
    try {
      history.replaceState(null, "", window.location.pathname + window.location.search);
    } catch { /* no-op */ }
    if (!token) return;

    setBouncing(true);
    (async () => {
      try {
        const res = await fetch("/api/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        window.location.replace(res.ok ? "/screener" : LOGIN_URL);
      } catch {
        window.location.replace(LOGIN_URL);
      }
    })();
  }, []);

  if (!bouncing) return null;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 2147483647, background: "#060709", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
      <img src="/qntm-wordmark.png" alt="QNTM" style={{ height: 26, width: "auto", opacity: 0.92 }} />
      <div style={{ fontFamily: FONT_MONO, fontSize: 13, letterSpacing: ".1em", color: "#9fabc0" }}>Entering QNTM…</div>
    </div>
  );
}
