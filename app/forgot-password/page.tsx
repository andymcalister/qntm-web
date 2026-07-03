"use client";

import { useState } from "react";

const FONT_DISPLAY = "var(--font-syne,'Syne'),sans-serif";
const FONT_MONO = "var(--font-dm-mono,'DM Mono'),monospace";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await fetch("/api/auth/request-reset", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
    } catch {}
    setSent(true);
    setBusy(false);
  }

  const input: React.CSSProperties = {
    width: "100%", padding: "12px 14px", borderRadius: 8, border: "1px solid rgba(255,255,255,.14)",
    background: "rgba(255,255,255,.03)", color: "#e2e8f0", fontFamily: FONT_MONO, fontSize: 14, boxSizing: "border-box",
  };

  return (
    <div style={{ minHeight: "100vh", background: "#060709", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 380 }}>
        <a href="/login" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: FONT_MONO, fontSize: 12.5, color: "#9fabc0", textDecoration: "none", marginBottom: 18 }}>← Back to sign in</a>
        <a href="/" style={{ display: "block", textAlign: "center", marginBottom: 24 }}>
          <img src="/qntm-wordmark.png" alt="QNTM" style={{ height: 30, width: "auto" }} />
        </a>
        <div style={{ border: "1px solid rgba(255,255,255,.08)", borderRadius: 14, padding: 28, background: "rgba(255,255,255,.015)" }}>
          {sent ? (
            <>
              <h1 style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 22, color: "#fff", margin: "0 0 12px" }}>Check your email</h1>
              <p style={{ fontFamily: FONT_MONO, fontSize: 13, color: "#9fabc0", lineHeight: 1.6, margin: 0 }}>
                If an account exists for <span style={{ color: "#e2e8f0" }}>{email}</span>, we've sent a link to reset your password. It expires in 30 minutes.
              </p>
            </>
          ) : (
            <form onSubmit={submit}>
              <h1 style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 22, color: "#fff", margin: "0 0 6px" }}>Reset your password</h1>
              <p style={{ fontFamily: FONT_MONO, fontSize: 12.5, color: "#9fabc0", margin: "0 0 18px", lineHeight: 1.5 }}>Enter your email and we'll send you a reset link.</p>
              <label style={{ fontFamily: FONT_MONO, fontSize: 12, color: "#9fabc0", display: "block", marginBottom: 6 }}>Email</label>
              <input style={input} type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required autoFocus />
              <div style={{ marginTop: 20 }}>
                <button style={{ width: "100%", padding: "13px", borderRadius: 8, border: "none", cursor: busy ? "default" : "pointer", background: busy ? "#1f6f52" : "linear-gradient(135deg,#34d399,#059669)", color: "#04120c", fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 15, opacity: busy ? 0.7 : 1 }} disabled={busy}>
                  {busy ? "Sending…" : "Send reset link"}
                </button>
              </div>
            </form>
          )}
        </div>
        <p style={{ fontFamily: FONT_MONO, fontSize: 12.5, color: "#9fabc0", textAlign: "center", marginTop: 18 }}>
          Remembered it? <a href="/login" style={{ color: "#34d399", textDecoration: "none" }}>Sign in</a>
        </p>
      </div>
    </div>
  );
}
