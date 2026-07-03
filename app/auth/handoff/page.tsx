"use client";

import { useEffect, useState } from "react";

const LOGIN_URL = process.env.NEXT_PUBLIC_LOGIN_URL || "/login";

// /auth/handoff#token=<jwt>
// Streamlit drops a logged-in user here with a short-lived token in the URL
// fragment (fragments are never sent to servers or written to logs). We hand it
// to our own /api/session route, which verifies it with the API and sets the
// httpOnly session cookie, then we replace the URL and continue to the screener.
export default function Handoff() {
  const [msg, setMsg] = useState("Signing you in…");

  useEffect(() => {
    const hash = typeof window !== "undefined" ? window.location.hash : "";
    const match = hash.match(/token=([^&]+)/);
    const token = match ? decodeURIComponent(match[1]) : null;

    if (!token) {
      setMsg("No sign-in token found. Redirecting to login…");
      window.location.replace(LOGIN_URL);
      return;
    }

    (async () => {
      try {
        const res = await fetch("/api/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        if (!res.ok) throw new Error("verify_failed");
        // Strip the token from the address bar, then enter the app.
        window.location.replace("/screener");
      } catch {
        setMsg("Sign-in link expired or invalid. Redirecting to login…");
        setTimeout(() => window.location.replace(LOGIN_URL), 1200);
      }
    })();
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--color-bg, #060709)",
        color: "#cbd5e1",
        fontFamily: "var(--font-dm-mono, monospace)",
        fontSize: 14,
        letterSpacing: "0.04em",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span
          style={{
            width: 10,
            height: 10,
            borderRadius: 9999,
            background: "var(--color-gold, #d9b450)",
            animation: "qntmPulse 1.1s ease-in-out infinite",
          }}
        />
        {msg}
      </div>
      <style>{`@keyframes qntmPulse{0%,100%{opacity:.3}50%{opacity:1}}`}</style>
    </div>
  );
}
