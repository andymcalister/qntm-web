"use client";

import { useState } from "react";

const FONT_DISPLAY = "var(--font-syne,'Syne'),sans-serif";
const FONT_MONO = "var(--font-dm-mono,'DM Mono'),monospace";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [challenge, setChallenge] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function submitLogin(e: React.FormEvent) {
    e.preventDefault();
    setErr(""); setBusy(true);
    try {
      const r = await fetch("/api/auth/login", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const d = await r.json();
      if (!d.ok) { setErr(d.error || "Sign-in failed."); return; }
      if (d.mfa_required) { setChallenge(d.challenge); return; }
      window.location.replace("/screener");
    } catch { setErr("Something went wrong. Try again."); }
    finally { setBusy(false); }
  }

  async function submitMfa(e: React.FormEvent) {
    e.preventDefault();
    setErr(""); setBusy(true);
    try {
      const r = await fetch("/api/auth/mfa", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challenge, code }),
      });
      const d = await r.json();
      if (!d.ok) { setErr(d.error || "Invalid code."); return; }
      window.location.replace("/screener");
    } catch { setErr("Something went wrong. Try again."); }
    finally { setBusy(false); }
  }

  const input: React.CSSProperties = {
    width: "100%", padding: "12px 14px", borderRadius: 8, border: "1px solid rgba(255,255,255,.14)",
    background: "rgba(255,255,255,.03)", color: "#e2e8f0", fontFamily: FONT_MONO, fontSize: 14, boxSizing: "border-box",
  };
  const btn: React.CSSProperties = {
    width: "100%", padding: "13px", borderRadius: 8, border: "none", cursor: busy ? "default" : "pointer",
    background: busy ? "#1f6f52" : "linear-gradient(135deg,#34d399,#059669)", color: "#04120c",
    fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 15, opacity: busy ? 0.7 : 1,
  };

  return (
    <div style={{ minHeight: "100vh", background: "#060709", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 380 }}>
        <a href="/" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: FONT_MONO, fontSize: 12.5, color: "#9fabc0", textDecoration: "none", marginBottom: 18 }}>← Home</a>
        <a href="/" style={{ display: "block", textAlign: "center", marginBottom: 24 }}>
          <img src="/qntm-wordmark.png" alt="QNTM" style={{ height: 30, width: "auto" }} />
        </a>
        <div style={{ border: "1px solid rgba(255,255,255,.08)", borderRadius: 14, padding: 28, background: "rgba(255,255,255,.015)" }}>
          {!challenge ? (
            <form onSubmit={submitLogin}>
              <h1 style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 22, color: "#fff", margin: "0 0 18px" }}>Sign in</h1>
              <label style={{ fontFamily: FONT_MONO, fontSize: 12, color: "#9fabc0", display: "block", marginBottom: 6 }}>Email</label>
              <input style={input} type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
              <label style={{ fontFamily: FONT_MONO, fontSize: 12, color: "#9fabc0", display: "block", margin: "14px 0 6px" }}>Password</label>
              <input style={input} type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
              {err && <div style={{ fontFamily: FONT_MONO, fontSize: 12.5, color: "#f87171", marginTop: 12 }}>{err}</div>}
              <div style={{ marginTop: 20 }}><button style={btn} disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button></div>
            </form>
          ) : (
            <form onSubmit={submitMfa}>
              <h1 style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 22, color: "#fff", margin: "0 0 6px" }}>Two-factor code</h1>
              <p style={{ fontFamily: FONT_MONO, fontSize: 12.5, color: "#9fabc0", margin: "0 0 18px", lineHeight: 1.5 }}>Enter the 6-digit code from your authenticator app.</p>
              <input style={{ ...input, letterSpacing: ".3em", textAlign: "center", fontSize: 20 }} inputMode="numeric" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} autoFocus maxLength={6} />
              {err && <div style={{ fontFamily: FONT_MONO, fontSize: 12.5, color: "#f87171", marginTop: 12 }}>{err}</div>}
              <div style={{ marginTop: 20 }}><button style={btn} disabled={busy}>{busy ? "Verifying…" : "Verify"}</button></div>
            </form>
          )}
        </div>
        <p style={{ fontFamily: FONT_MONO, fontSize: 12.5, color: "#9fabc0", textAlign: "center", marginTop: 18 }}>
          New here? <a href="/register" style={{ color: "#34d399", textDecoration: "none" }}>Create an account</a>
        </p>
      </div>
    </div>
  );
}
