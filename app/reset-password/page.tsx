"use client";

import { useEffect, useState } from "react";

const FONT_DISPLAY = "var(--font-syne,'Syne'),sans-serif";
const FONT_MONO = "var(--font-dm-mono,'DM Mono'),monospace";

export default function ResetPassword() {
  const [token, setToken] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);
  const [valid, setValid] = useState(false);
  const [p1, setP1] = useState("");
  const [p2, setP2] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get("token") || "";
    setToken(t);
    if (!t) { setChecking(false); setValid(false); return; }
    (async () => {
      try {
        const r = await fetch("/api/auth/reset-validate", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: t }),
        });
        const d = await r.json();
        setValid(!!d.valid);
      } catch { setValid(false); }
      finally { setChecking(false); }
    })();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    if (p1.length < 8) { setErr("Password must be at least 8 characters."); return; }
    if (p1 !== p2) { setErr("Passwords don't match."); return; }
    setBusy(true);
    try {
      const r = await fetch("/api/auth/reset", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password: p1 }),
      });
      const d = await r.json();
      if (!r.ok || !d.ok) { setErr(d.detail || "This link is invalid or has expired."); return; }
      setDone(true);
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
          {checking ? (
            <p style={{ fontFamily: FONT_MONO, fontSize: 13, color: "#64748b", margin: 0 }}>Checking your link…</p>
          ) : done ? (
            <>
              <h1 style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 22, color: "#fff", margin: "0 0 12px" }}>Password updated</h1>
              <p style={{ fontFamily: FONT_MONO, fontSize: 13, color: "#9fabc0", lineHeight: 1.6, margin: "0 0 18px" }}>You can now sign in with your new password.</p>
              <a href="/login" style={{ display: "block", textAlign: "center", padding: "13px", borderRadius: 8, background: "linear-gradient(135deg,#34d399,#059669)", color: "#04120c", fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 15, textDecoration: "none" }}>Go to sign in</a>
            </>
          ) : !valid ? (
            <>
              <h1 style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 22, color: "#fff", margin: "0 0 12px" }}>Link expired</h1>
              <p style={{ fontFamily: FONT_MONO, fontSize: 13, color: "#9fabc0", lineHeight: 1.6, margin: "0 0 18px" }}>This reset link is invalid or has expired. Request a fresh one.</p>
              <a href="/forgot-password" style={{ display: "block", textAlign: "center", padding: "13px", borderRadius: 8, background: "linear-gradient(135deg,#34d399,#059669)", color: "#04120c", fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 15, textDecoration: "none" }}>Request a new link</a>
            </>
          ) : (
            <form onSubmit={submit}>
              <h1 style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 22, color: "#fff", margin: "0 0 18px" }}>Choose a new password</h1>
              <label style={{ fontFamily: FONT_MONO, fontSize: 12, color: "#9fabc0", display: "block", marginBottom: 6 }}>New password</label>
              <input style={input} type="password" value={p1} onChange={(e) => setP1(e.target.value)} autoComplete="new-password" required autoFocus />
              <label style={{ fontFamily: FONT_MONO, fontSize: 12, color: "#9fabc0", display: "block", margin: "14px 0 6px" }}>Confirm new password</label>
              <input style={input} type="password" value={p2} onChange={(e) => setP2(e.target.value)} autoComplete="new-password" required />
              <p style={{ fontFamily: FONT_MONO, fontSize: 11, color: "#64748b", margin: "8px 0 0" }}>At least 8 characters.</p>
              {err && <div style={{ fontFamily: FONT_MONO, fontSize: 12.5, color: "#f87171", marginTop: 12 }}>{err}</div>}
              <div style={{ marginTop: 20 }}>
                <button style={{ width: "100%", padding: "13px", borderRadius: 8, border: "none", cursor: busy ? "default" : "pointer", background: busy ? "#1f6f52" : "linear-gradient(135deg,#34d399,#059669)", color: "#04120c", fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 15, opacity: busy ? 0.7 : 1 }} disabled={busy}>
                  {busy ? "Updating…" : "Set new password"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
