"use client";

import { useEffect, useState } from "react";
import NavBar from "../screener/NavBar";
import { FONT_DISPLAY, FONT_MONO } from "../screener/lib";

const LOGIN_URL = process.env.NEXT_PUBLIC_LOGIN_URL || "https://app.qntm.live";

type Prefs = { email: boolean; signals: boolean; alerts: boolean; low_alert_email: boolean; alert_email: boolean; alert_sms: boolean };
type PrefsResp = { locked: boolean; prefs: Prefs; phone: string; phone_verified: boolean };

const TOGGLES: { key: keyof Prefs; label: string; caption: string }[] = [
  { key: "email", label: "Email signal summaries (weekly digest)", caption: "One email on Saturday recapping the week across your watchlist and the broader market." },
  { key: "signals", label: "In-app signal change alerts", caption: "A bell when a stock you follow changes conviction tier. In-app only — no email." },
  { key: "alerts", label: "Macro regime change alerts", caption: "A bell when the overall market regime shifts (risk-on ⇄ risk-off). Rare." },
  { key: "low_alert_email", label: "Email me when a holding or watchlist stock drops to LOW conviction", caption: "At most one email per name each time it drops to LOW, during market hours. Off by default." },
];
const ALERT_TOGGLES: { key: keyof Prefs; label: string; caption: string }[] = [
  { key: "alert_email", label: "Email me when one of my price / value alerts fires", caption: "One email each time an alert you created fires — you control the volume by how many you set." },
  { key: "alert_sms", label: "Text me (SMS) when one of my price / value alerts fires", caption: "A text for each alert that fires — requires a verified mobile number below. Standard rates apply; reply STOP anytime." },
];

function Toggle({ on, onClick, label, caption }: { on: boolean; onClick: () => void; label: string; caption: string }) {
  return (
    <div style={{ padding: "12px 0", borderTop: "1px solid rgba(255,255,255,.05)" }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12, justifyContent: "space-between" }}>
        <div style={{ fontFamily: FONT_MONO, fontSize: 13.5, color: "#e2e8f0", lineHeight: 1.5, flex: 1 }}>{label}</div>
        <button onClick={onClick} role="switch" aria-checked={on} style={{
          flexShrink: 0, width: 42, height: 24, borderRadius: 999, border: "none", cursor: "pointer", position: "relative",
          background: on ? "#34d399" : "rgba(255,255,255,.14)", transition: "background .15s",
        }}>
          <span style={{ position: "absolute", top: 3, left: on ? 21 : 3, width: 18, height: 18, borderRadius: "50%", background: "#fff", transition: "left .15s" }} />
        </button>
      </div>
      <div style={{ fontFamily: FONT_MONO, fontSize: 11.5, color: "#64748b", marginTop: 4, lineHeight: 1.5, paddingRight: 54 }}>{caption}</div>
    </div>
  );
}

export default function Account() {
  const [uid, setUid] = useState("");
  const [plan, setPlan] = useState("free");
  const [data, setData] = useState<PrefsResp | null>(null);
  const [prefs, setPrefs] = useState<Prefs | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");

  // phone flow
  const [phoneInput, setPhoneInput] = useState("");
  const [changing, setChanging] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [codeInput, setCodeInput] = useState("");
  const [phoneMsg, setPhoneMsg] = useState("");
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [phoneCur, setPhoneCur] = useState("");

  async function load() {
    const me = await fetch("/api/me").then((r) => r.json()).catch(() => ({ plan: "free" }));
    setUid(me?.user_id || ""); setPlan(me?.plan || "free");
    const d: PrefsResp = await fetch("/api/account/notification-prefs", { cache: "no-store" }).then((r) => r.json()).catch(() => null);
    if (d) {
      setData(d); setPrefs(d.prefs); setPhoneVerified(d.phone_verified);
      setPhoneCur(d.phone || ""); setPhoneInput(d.phone || "");
    }
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function signOut() { try { await fetch("/api/session", { method: "DELETE" }); } catch {} window.location.href = LOGIN_URL; }

  async function savePrefs() {
    if (!prefs) return;
    setSaving(true); setSavedMsg("");
    const res = await fetch("/api/account/notification-prefs", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(prefs) });
    setSaving(false);
    setSavedMsg(res.ok ? "Preferences saved" : "Save failed — try again");
    setTimeout(() => setSavedMsg(""), 3000);
  }

  async function sendCode() {
    setPhoneMsg("");
    const res = await fetch("/api/account/phone/send-code", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phone: phoneInput }) });
    const j = await res.json().catch(() => ({}));
    if (res.ok) { setCodeSent(true); setPhoneMsg(j.message || "Code sent — check your texts."); }
    else setPhoneMsg(j.detail || "Could not send code.");
  }
  async function verifyCode() {
    setPhoneMsg("");
    const res = await fetch("/api/account/phone/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: codeInput }) });
    const j = await res.json().catch(() => ({}));
    if (res.ok) { setPhoneVerified(true); setChanging(false); setCodeSent(false); setPhoneCur(phoneInput); setPhoneMsg("Phone verified."); }
    else setPhoneMsg(j.detail || "Incorrect code.");
  }

  const set = (k: keyof Prefs, v: boolean) => setPrefs((p) => (p ? { ...p, [k]: v } : p));
  const locked = data ? data.locked : false;
  const isPro = plan === "pro" || plan === "institutional";

  const card: React.CSSProperties = { background: "rgba(255,255,255,.02)", border: "1px solid rgba(255,255,255,.07)", borderRadius: 12, padding: "20px 22px", marginTop: 16 };
  const h2: React.CSSProperties = { fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 16, color: "#fff", margin: 0 };
  const linkBtn: React.CSSProperties = { display: "inline-block", fontFamily: FONT_MONO, fontSize: 12.5, color: "#d4a843", border: "1px solid rgba(212,168,67,.4)", borderRadius: 8, padding: "8px 14px", textDecoration: "none", marginTop: 4 };

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-bg,#060709)", color: "#cbd5e1" }}>
      <NavBar uid={uid} plan={plan} active="account" onSignOut={signOut} />
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "28px 24px 60px" }}>
        <p style={{ fontFamily: FONT_MONO, fontSize: 13, letterSpacing: ".2em", color: "#d4a843", margin: 0 }}>⚙️ ACCOUNT</p>
        <h1 style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 30, color: "#fff", margin: "8px 0 0" }}>Account settings</h1>

        {/* Plan summary */}
        <div style={card}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <div>
              <div style={h2}>Plan</div>
              <div style={{ fontFamily: FONT_MONO, fontSize: 13, color: "#9fabc0", marginTop: 6 }}>
                You're on the <span style={{ color: isPro ? "#34d399" : "#cbd5e1", fontWeight: 700 }}>{isPro ? "Pro" : "Free"}</span> plan.
                {isPro ? " Unlimited holdings, Hidden Gems, Simulator, and price/value alerts." : " Upgrade for Hidden Gems, the Simulator, and alerts."}
              </div>
            </div>
            <a href={`${LOGIN_URL}/?qnav=account&uid=${encodeURIComponent(uid)}&plan=${encodeURIComponent(plan)}&ck=1`} style={{ ...linkBtn, flexShrink: 0 }}>
              {isPro ? "Manage billing" : "Upgrade to Pro"}
            </a>
          </div>
        </div>

        {/* Notification preferences */}
        <div style={card}>
          <div style={h2}>Notification preferences</div>
          {loading ? (
            <div style={{ fontFamily: FONT_MONO, fontSize: 13, color: "#64748b", padding: "16px 0" }}>Loading…</div>
          ) : locked || !prefs ? (
            <div style={{ marginTop: 12, background: "rgba(251,191,36,.05)", border: "1px solid rgba(251,191,36,.2)", borderRadius: 8, padding: "14px 16px", fontFamily: FONT_MONO, fontSize: 13, color: "#fbbf24", lineHeight: 1.6 }}>
              Notification preferences require a Pro plan.{" "}
              <a href={`${LOGIN_URL}/?qnav=account&uid=${encodeURIComponent(uid)}&plan=${encodeURIComponent(plan)}&ck=1`} style={{ color: "#d4a843" }}>Upgrade →</a>
            </div>
          ) : (
            <>
              <div style={{ marginTop: 6 }}>
                {TOGGLES.map((t) => <Toggle key={t.key} on={prefs[t.key]} onClick={() => set(t.key, !prefs[t.key])} label={t.label} caption={t.caption} />)}
              </div>

              <div style={{ marginTop: 18, paddingTop: 14, borderTop: "1px solid rgba(255,255,255,.08)" }}>
                <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 14, color: "#e2e8f0" }}>Price &amp; value alerts</div>
                <div style={{ fontFamily: FONT_MONO, fontSize: 12, color: "#9fabc0", margin: "4px 0 2px", lineHeight: 1.6 }}>Delivery channels for the alerts you create on the Alerts page. In-app is always on.</div>
                {ALERT_TOGGLES.map((t) => <Toggle key={t.key} on={prefs[t.key]} onClick={() => set(t.key, !prefs[t.key])} label={t.label} caption={t.caption} />)}
              </div>

              {/* Phone verification (SMS) */}
              <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid rgba(255,255,255,.08)" }}>
                {phoneVerified && !changing ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ fontFamily: FONT_MONO, fontSize: 13, color: "#34d399" }}>✓ Phone verified: {phoneCur}</span>
                    <button onClick={() => { setChanging(true); setCodeSent(false); setPhoneMsg(""); }} style={{ fontFamily: FONT_MONO, fontSize: 12, color: "#9fabc0", background: "transparent", border: "1px solid rgba(255,255,255,.12)", borderRadius: 6, padding: "5px 10px", cursor: "pointer" }}>Change number</button>
                  </div>
                ) : (
                  <>
                    <div style={{ fontFamily: FONT_MONO, fontSize: 12, color: "#9fabc0", marginBottom: 8, lineHeight: 1.6 }}>
                      Add a mobile number to receive alert texts. By verifying, you consent to automated SMS alerts you configure from QNTM at this number. Msg &amp; data rates may apply; reply STOP to cancel, HELP for help.
                    </div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <input value={phoneInput} onChange={(e) => setPhoneInput(e.target.value)} placeholder="(949) 555-1234"
                        style={{ flex: 1, minWidth: 160, background: "rgba(13,14,22,.8)", border: "1px solid rgba(255,255,255,.1)", borderRadius: 8, padding: "9px 12px", color: "#e2e8f0", fontFamily: FONT_MONO, fontSize: 14 }} />
                      <button onClick={sendCode} style={{ fontFamily: FONT_MONO, fontSize: 13, color: "#0b0c10", background: "#d4a843", border: "none", borderRadius: 8, padding: "9px 16px", cursor: "pointer", fontWeight: 700 }}>Send code</button>
                    </div>
                    {codeSent && (
                      <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                        <input value={codeInput} onChange={(e) => setCodeInput(e.target.value)} maxLength={6} placeholder="6-digit code"
                          style={{ flex: 1, minWidth: 160, background: "rgba(13,14,22,.8)", border: "1px solid rgba(255,255,255,.1)", borderRadius: 8, padding: "9px 12px", color: "#e2e8f0", fontFamily: FONT_MONO, fontSize: 14, letterSpacing: ".2em" }} />
                        <button onClick={verifyCode} style={{ fontFamily: FONT_MONO, fontSize: 13, color: "#34d399", background: "rgba(52,211,153,.1)", border: "1px solid rgba(52,211,153,.4)", borderRadius: 8, padding: "9px 16px", cursor: "pointer", fontWeight: 700 }}>Verify</button>
                      </div>
                    )}
                    <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: "#64748b", marginTop: 8, lineHeight: 1.5 }}>SMS sends once your number is verified and carrier registration (A2P 10DLC) is approved. Standard rates apply. Reply STOP to opt out.</div>
                  </>
                )}
                {phoneMsg && <div style={{ fontFamily: FONT_MONO, fontSize: 12, color: phoneMsg.toLowerCase().includes("verified") || phoneMsg.toLowerCase().includes("sent") ? "#34d399" : "#fbbf24", marginTop: 8 }}>{phoneMsg}</div>}
              </div>

              <div style={{ marginTop: 18, display: "flex", alignItems: "center", gap: 14 }}>
                <button onClick={savePrefs} disabled={saving} style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 13, letterSpacing: ".03em", color: "#0b0c10", background: "#d4a843", border: "none", borderRadius: 10, padding: "11px 22px", cursor: saving ? "default" : "pointer", opacity: saving ? 0.6 : 1 }}>
                  {saving ? "Saving…" : "Save notification preferences"}
                </button>
                {savedMsg && <span style={{ fontFamily: FONT_MONO, fontSize: 13, color: savedMsg.includes("failed") ? "#f87171" : "#34d399" }}>{savedMsg}</span>}
              </div>
            </>
          )}
        </div>

        {/* Staged sections — still on the classic account page */}
        <div style={card}>
          <div style={h2}>Profile, security &amp; billing</div>
          <div style={{ fontFamily: FONT_MONO, fontSize: 12.5, color: "#9fabc0", margin: "8px 0 10px", lineHeight: 1.7 }}>
            Editing your name and email, changing your password, two-factor authentication, and subscription management are handled on the classic account page for now.
          </div>
          <a href={`${LOGIN_URL}/?qnav=account&uid=${encodeURIComponent(uid)}&plan=${encodeURIComponent(plan)}&ck=1`} style={linkBtn}>Open classic account →</a>
        </div>
      </div>
    </div>
  );
}
