"use client";

import { useState } from "react";

const FONT_DISPLAY = "var(--font-syne,'Syne'),sans-serif";
const FONT_MONO = "var(--font-dm-mono,'DM Mono'),monospace";

export default function Register() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    if (password.length < 8) { setErr("Password must be at least 8 characters."); return; }
    setBusy(true);
    try {
      const r = await fetch("/api/auth/register", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, full_name: fullName }),
      });
      const d = await r.json();
      if (!d.ok) { setErr(d.error || "Registration failed."); return; }
      window.location.replace("/screener");
    } catch { setErr("Something went wrong. Try again."); }
    finally { setBusy(false); }
  }

  const input: React.CSSProperties = {
    width: "100%", padding: "12px 14px", borderRadius: 8, border: "1px solid rgba(255,255,255,.14)",
    background: "rgba(255,255,255,.03)", color: "#e2e8f0", fontFamily: FONT_MONO, fontSize: 14, boxSizing: "border-box",
  };

  return (
    <div style={{ minHeight: "100vh", background: "#060709", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 380 }}>
        <a href="/" style={{ display: "block", textAlign: "center", marginBottom: 24 }}>
          <img src="/qntm-wordmark.png" alt="QNTM" style={{ height: 30, width: "auto" }} />
        </a>
        <div style={{ border: "1px solid rgba(255,255,255,.08)", borderRadius: 14, padding: 28, background: "rgba(255,255,255,.015)" }}>
          <form onSubmit={submit}>
            <h1 style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 22, color: "#fff", margin: "0 0 18px" }}>Create your account</h1>
            <label style={{ fontFamily: FONT_MONO, fontSize: 12, color: "#9fabc0", display: "block", marginBottom: 6 }}>Name</label>
            <input style={input} value={fullName} onChange={(e) => setFullName(e.target.value)} autoComplete="name" />
            <label style={{ fontFamily: FONT_MONO, fontSize: 12, color: "#9fabc0", display: "block", margin: "14px 0 6px" }}>Email</label>
            <input style={input} type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
            <label style={{ fontFamily: FONT_MONO, fontSize: 12, color: "#9fabc0", display: "block", margin: "14px 0 6px" }}>Password</label>
            <input style={input} type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" required />
            <p style={{ fontFamily: FONT_MONO, fontSize: 11, color: "#64748b", margin: "8px 0 0" }}>At least 8 characters.</p>
            {err && <div style={{ fontFamily: FONT_MONO, fontSize: 12.5, color: "#f87171", marginTop: 12 }}>{err}</div>}
            <div style={{ marginTop: 20 }}>
              <button style={{ width: "100%", padding: "13px", borderRadius: 8, border: "none", cursor: busy ? "default" : "pointer", background: busy ? "#1f6f52" : "linear-gradient(135deg,#34d399,#059669)", color: "#04120c", fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 15, opacity: busy ? 0.7 : 1 }} disabled={busy}>
                {busy ? "Creating…" : "Create account — it's free"}
              </button>
            </div>
          </form>
        </div>
        <p style={{ fontFamily: FONT_MONO, fontSize: 12.5, color: "#9fabc0", textAlign: "center", marginTop: 18 }}>
          Already have an account? <a href="/login" style={{ color: "#34d399", textDecoration: "none" }}>Sign in</a>
        </p>
      </div>
    </div>
  );
}
