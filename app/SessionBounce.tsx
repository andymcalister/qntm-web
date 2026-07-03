"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const LOGIN_URL = process.env.NEXT_PUBLIC_LOGIN_URL || "/login";
const FONT_MONO = "var(--font-dm-mono,'DM Mono'),monospace";
const FONT_DISPLAY = "var(--font-syne,'Syne'),sans-serif";

export default function SessionBounce() {
  const [phase, setPhase] = useState<"idle" | "working" | "error">("idle");
  const tokenRef = useRef<string | null>(null);

  const exchange = useCallback(async () => {
    const token = tokenRef.current;
    if (!token) return;
    setPhase("working");
    const delays = [0, 1500, 3000, 5000, 8000];
    for (let i = 0; i < delays.length; i++) {
      if (delays[i]) await new Promise((r) => setTimeout(r, delays[i]));
      try {
        const res = await fetch("/api/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        if (res.ok) {
          window.location.replace("/screener");
          return;
        }
        if (res.status === 401) break;
      } catch {
        /* network blip -> retry */
      }
    }
    setPhase("error");
  }, []);

  useEffect(() => {
    const hash = typeof window !== "undefined" ? window.location.hash : "";
    if (!hash || hash.indexOf("bt=") === -1) return;
    const m = hash.match(/bt=([^&]+)/);
    const token = m ? decodeURIComponent(m[1]) : null;
    try {
      history.replaceState(null, "", window.location.pathname + window.location.search);
    } catch { /* no-op */ }
    if (!token) return;
    tokenRef.current = token;
    exchange();
  }, [exchange]);

  if (phase === "idle") return null;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 2147483647, background: "#060709", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, padding: 24, textAlign: "center" }}>
      <img src="/qntm-wordmark.png" alt="QNTM" style={{ height: 26, width: "auto", opacity: 0.92 }} />
      {phase === "working" ? (
        <div style={{ fontFamily: FONT_MONO, fontSize: 13, letterSpacing: ".1em", color: "#9fabc0" }}>
          Entering QNTM… <span style={{ color: "#64748b" }}>(first load can take a few seconds)</span>
        </div>
      ) : (
        <>
          <div style={{ fontFamily: FONT_MONO, fontSize: 13, color: "#cbd5e1", maxWidth: 360, lineHeight: 1.6 }}>
            We couldn&apos;t start your session — the server may still be waking up.
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => exchange()} style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 13, color: "#04120c", background: "#34d399", border: "none", borderRadius: 8, padding: "10px 18px", cursor: "pointer" }}>
              Try again
            </button>
            <a href={LOGIN_URL} style={{ fontFamily: FONT_MONO, fontSize: 12.5, color: "#9fabc0", border: "1px solid rgba(255,255,255,.14)", borderRadius: 8, padding: "10px 16px", textDecoration: "none" }}>
              Back to sign in
            </a>
          </div>
        </>
      )}
    </div>
  );
}
