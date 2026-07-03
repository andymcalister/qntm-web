"use client";

import { useEffect, useState } from "react";

const FONT_DISPLAY = "var(--font-syne,'Syne'),sans-serif";
const FONT_MONO = "var(--font-dm-mono,'DM Mono'),monospace";

export default function Register() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [disclaimer, setDisclaimer] = useState(false);
  const [claim, setClaim] = useState(true);
  const [spots, setSpots] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    fetch("/api/founding-spots", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setSpots(typeof d?.remaining === "number" ? d.remaining : null))
      .catch(() => setSpots(null));
  }, []);

  const spotsOpen = spots === null ? false : spots > 0;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    if (password.length < 8) { setErr("Password must be at least 8 characters."); return; }
    if (!disclaimer) { setErr("Please acknowledge the research-tool disclaimer to continue."); return; }
    setBusy(true);
    try {
      const r = await fetch("/api/auth/register", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, full_name: fullName, disclaimer_ack: true, claim_founding: spotsOpen && claim }),
      });
      const d = await r.json();
      if (!d.ok) { setErr(d.detail || d.error || "Registration failed."); return; }
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
      <div style={{ width: "100%", maxWidth: 400 }}>
        <a href="/" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: FONT_MONO, fontSize: 12.5, color: "#9fabc0", textDecoration: "none", marginBottom: 18 }}>← Home</a>
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

            {/* Founding member claim — only while spots remain */}
            {spotsOpen && (
              <div style={{ marginTop: 18, background: "rgba(212,168,67,.06)", border: "1px solid rgba(212,168,67,.3)", borderRadius: 10, padding: "14px 16px" }}>
                <label style={{ display: "flex", gap: 10, alignItems: "flex-start", cursor: "pointer" }}>
                  <input type="checkbox" checked={claim} onChange={(e) => setClaim(e.target.checked)} style={{ marginTop: 3 }} />
                  <span style={{ fontFamily: FONT_MONO, fontSize: 12.5, color: "#e2e8f0", lineHeight: 1.6 }}>
                    <strong style={{ color: "#d4a843" }}>Claim your founding membership — free Pro, forever.</strong> Full Pro access (Hidden Gems, Simulator, alerts) at $0. {spots} of 50 spots left.
                  </span>
                </label>
              </div>
            )}

            {/* Required research-tool disclaimer */}
            <div style={{ marginTop: 16 }}>
              <label style={{ display: "flex", gap: 10, alignItems: "flex-start", cursor: "pointer" }}>
                <input type="checkbox" checked={disclaimer} onChange={(e) => setDisclaimer(e.target.checked)} style={{ marginTop: 3 }} />
                <span style={{ fontFamily: FONT_MONO, fontSize: 12, color: "#9fabc0", lineHeight: 1.6 }}>
                  I understand QNTM provides quantitative research and educational information only, is <strong style={{ color: "#cbd5e1" }}>not investment advice</strong>, and that QNTM is not a registered investment adviser. I am responsible for my own investment decisions.
                </span>
              </label>
            </div>

            {err && <div style={{ fontFamily: FONT_MONO, fontSize: 12.5, color: "#f87171", marginTop: 14 }}>{err}</div>}

            <div style={{ marginTop: 20 }}>
              <button style={{ width: "100%", padding: "13px", borderRadius: 8, border: "none", cursor: busy || !disclaimer ? "default" : "pointer", background: busy || !disclaimer ? "#1f6f52" : "linear-gradient(135deg,#34d399,#059669)", color: "#04120c", fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 15, opacity: busy || !disclaimer ? 0.6 : 1 }} disabled={busy || !disclaimer}>
                {busy ? "Creating…" : spotsOpen && claim ? "Claim free founding membership" : "Create account"}
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
