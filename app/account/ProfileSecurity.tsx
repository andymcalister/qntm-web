"use client";

import { useEffect, useState } from "react";
import { FONT_DISPLAY, FONT_MONO } from "../screener/lib";

type Profile = { full_name: string; email: string; email_verified: boolean };

const card: React.CSSProperties = { background: "rgba(255,255,255,.02)", border: "1px solid rgba(255,255,255,.07)", borderRadius: 12, padding: "20px 22px", marginTop: 16 };
const h2: React.CSSProperties = { fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 16, color: "#fff", margin: 0 };
const label: React.CSSProperties = { fontFamily: FONT_MONO, fontSize: 12, color: "#9fabc0", display: "block", margin: "14px 0 6px" };
const input: React.CSSProperties = { width: "100%", padding: "11px 13px", borderRadius: 8, border: "1px solid rgba(255,255,255,.12)", background: "rgba(13,14,22,.8)", color: "#e2e8f0", fontFamily: FONT_MONO, fontSize: 14, boxSizing: "border-box" };
const btn: React.CSSProperties = { fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 13, letterSpacing: ".03em", color: "#0b0c10", background: "#d4a843", border: "none", borderRadius: 10, padding: "11px 22px", cursor: "pointer" };

export default function ProfileSecurity() {
  const [prof, setProf] = useState<Profile | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState("");
  const [verified, setVerified] = useState(true);

  const [cur, setCur] = useState("");
  const [np1, setNp1] = useState("");
  const [np2, setNp2] = useState("");
  const [savingPw, setSavingPw] = useState(false);
  const [pwMsg, setPwMsg] = useState("");

  async function load() {
    try {
      const d: Profile = await fetch("/api/account/profile", { cache: "no-store" }).then((r) => r.json());
      setProf(d); setName(d.full_name || ""); setEmail(d.email || ""); setVerified(!!d.email_verified);
    } catch { /* leave empty */ }
  }
  useEffect(() => { load(); }, []);

  async function saveProfile() {
    if (!prof) return;
    setSavingProfile(true); setProfileMsg("");
    const body: { full_name?: string; email?: string } = {};
    if (name.trim() !== (prof.full_name || "")) body.full_name = name.trim();
    const em = email.trim().toLowerCase();
    const emailChanged = em !== (prof.email || "").toLowerCase();
    if (emailChanged) body.email = em;
    if (!body.full_name && !body.email) { setSavingProfile(false); setProfileMsg("Nothing to save."); return; }
    try {
      const r = await fetch("/api/account/profile", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.ok) { setProfileMsg(j.detail || "Couldn't save changes."); }
      else { setProfileMsg(emailChanged ? "Saved. Check your new email to confirm it." : "Saved."); await load(); }
    } catch { setProfileMsg("Something went wrong."); }
    finally { setSavingProfile(false); }
  }

  async function resendVerify() {
    setProfileMsg("");
    try { await fetch("/api/auth/request-verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) }); } catch {}
    setProfileMsg("Confirmation email sent.");
  }

  async function changePw() {
    setPwMsg("");
    if (np1.length < 8) { setPwMsg("New password must be at least 8 characters."); return; }
    if (np1 !== np2) { setPwMsg("New passwords don't match."); return; }
    setSavingPw(true);
    try {
      const r = await fetch("/api/account/change-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ current_password: cur, new_password: np1 }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.ok) { setPwMsg(j.detail || "Couldn't change password."); }
      else { setPwMsg("Password updated."); setCur(""); setNp1(""); setNp2(""); }
    } catch { setPwMsg("Something went wrong."); }
    finally { setSavingPw(false); }
  }

  return (
    <>
      <div style={card}>
        <div style={h2}>Profile</div>
        {!prof ? (
          <div style={{ fontFamily: FONT_MONO, fontSize: 13, color: "#64748b", padding: "12px 0" }}>Loading…</div>
        ) : (
          <>
            <label style={label}>Name</label>
            <input style={input} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
            <label style={label}>Email</label>
            <input style={input} type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
            <div style={{ marginTop: 8 }}>
              {verified ? (
                <span style={{ fontFamily: FONT_MONO, fontSize: 12, color: "#34d399" }}>✓ Email verified</span>
              ) : (
                <span style={{ fontFamily: FONT_MONO, fontSize: 12, color: "#fbbf24" }}>
                  Email not verified · <button onClick={resendVerify} style={{ background: "transparent", border: "none", color: "#d4a843", cursor: "pointer", fontFamily: FONT_MONO, fontSize: 12, textDecoration: "underline", padding: 0 }}>Resend confirmation</button>
                </span>
              )}
            </div>
            <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 14 }}>
              <button onClick={saveProfile} disabled={savingProfile} style={{ ...btn, opacity: savingProfile ? 0.6 : 1 }}>{savingProfile ? "Saving…" : "Save profile"}</button>
              {profileMsg && <span style={{ fontFamily: FONT_MONO, fontSize: 13, color: /couldn't|wrong/i.test(profileMsg) ? "#f87171" : "#34d399" }}>{profileMsg}</span>}
            </div>
          </>
        )}
      </div>

      <div style={card}>
        <div style={h2}>Security</div>
        <div style={{ fontFamily: FONT_MONO, fontSize: 12.5, color: "#9fabc0", margin: "6px 0 2px", lineHeight: 1.6 }}>Change your password. You&apos;ll need your current one.</div>
        <label style={label}>Current password</label>
        <input style={input} type="password" value={cur} onChange={(e) => setCur(e.target.value)} autoComplete="current-password" />
        <label style={label}>New password</label>
        <input style={input} type="password" value={np1} onChange={(e) => setNp1(e.target.value)} autoComplete="new-password" />
        <label style={label}>Confirm new password</label>
        <input style={input} type="password" value={np2} onChange={(e) => setNp2(e.target.value)} autoComplete="new-password" />
        <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 14 }}>
          <button onClick={changePw} disabled={savingPw} style={{ ...btn, opacity: savingPw ? 0.6 : 1 }}>{savingPw ? "Updating…" : "Change password"}</button>
          {pwMsg && <span style={{ fontFamily: FONT_MONO, fontSize: 13, color: /updated/i.test(pwMsg) ? "#34d399" : "#f87171" }}>{pwMsg}</span>}
        </div>
      </div>
    </>
  );
}
