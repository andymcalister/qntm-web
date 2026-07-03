"use client";

import { useEffect, useState } from "react";
import { FONT_DISPLAY, FONT_MONO } from "../screener/lib";

type Billing = {
  configured: boolean; plan: string; founding_member: boolean; is_paying: boolean;
  billing_active: boolean; status: string | null; cancel_at: string | null;
  subscription_id: string | null; current_period_end: string | null; trial_end: string | null; is_test_mode: boolean;
};

const card: React.CSSProperties = { background: "rgba(255,255,255,.02)", border: "1px solid rgba(255,255,255,.07)", borderRadius: 12, padding: "20px 22px", marginTop: 16 };
const h2: React.CSSProperties = { fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 16, color: "#fff", margin: 0 };
const gold: React.CSSProperties = { fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 13, letterSpacing: ".03em", color: "#0b0c10", background: "#d4a843", border: "none", borderRadius: 10, padding: "11px 22px", cursor: "pointer" };
const ghost: React.CSSProperties = { fontFamily: FONT_MONO, fontSize: 12.5, color: "#9fabc0", background: "transparent", border: "1px solid rgba(255,255,255,.14)", borderRadius: 8, padding: "9px 16px", cursor: "pointer" };
const mono = (c: string, sz = 13): React.CSSProperties => ({ fontFamily: FONT_MONO, fontSize: sz, color: c, lineHeight: 1.6 });

export default function BillingCard() {
  const [b, setB] = useState<Billing | null>(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const [noticeHtml, setNoticeHtml] = useState("");
  const [checkbox, setCheckbox] = useState("");
  const [showNotice, setShowNotice] = useState(false);
  const [consent, setConsent] = useState(false);
  const [confirmRevert, setConfirmRevert] = useState(false);

  async function loadBilling() {
    try {
      const d: Billing = await fetch("/api/account/billing", { cache: "no-store" }).then((r) => r.json());
      setB(d);
    } catch { /* leave null */ }
    setLoading(false);
  }

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const co = q.get("checkout");
    if (co === "success") {
      (async () => {
        setMsg("Confirming your subscription…");
        for (let i = 0; i < 3; i++) {
          const r = await fetch("/api/account/checkout/finalize", { method: "POST" }).then((r) => r.json()).catch(() => ({}));
          if (r.ok) break;
          await new Promise((res) => setTimeout(res, 2200));
        }
        window.location.replace("/account");
      })();
      return;
    }
    if (co === "cancel") window.history.replaceState({}, "", "/account");
    loadBilling();
  }, []);

  async function startSupport() {
    setMsg(""); setBusy(true);
    try {
      const n = await fetch("/api/account/arl-notice", { cache: "no-store" }).then((r) => r.json());
      setNoticeHtml(n.html || ""); setCheckbox(n.checkbox || ""); setShowNotice(true);
    } catch { setMsg("Couldn't start. Try again."); }
    finally { setBusy(false); }
  }

  async function toCheckout() {
    if (!consent) return;
    setBusy(true); setMsg("");
    try {
      const r = await fetch("/api/account/checkout", { method: "POST" });
      const d = await r.json().catch(() => ({}));
      if (r.ok && d.ok && d.url) { window.location.href = d.url; return; }
      setMsg(d.detail || "Couldn't start checkout.");
    } catch { setMsg("Something went wrong."); }
    finally { setBusy(false); }
  }

  async function doRevert() {
    setBusy(true); setMsg("");
    try {
      const r = await fetch("/api/account/cancel", { method: "POST" });
      const d = await r.json().catch(() => ({}));
      if (!r.ok || !d.ok) setMsg(d.detail || "Couldn't process that.");
      else { setConfirmRevert(false); await loadBilling(); }
    } catch { setMsg("Something went wrong."); }
    finally { setBusy(false); }
  }

  async function doUndo() {
    setBusy(true); setMsg("");
    try {
      const r = await fetch("/api/account/undo-cancel", { method: "POST" });
      const d = await r.json().catch(() => ({}));
      if (!r.ok || !d.ok) setMsg(d.detail || "Couldn't undo.");
      else await loadBilling();
    } catch { setMsg("Something went wrong."); }
    finally { setBusy(false); }
  }

  if (loading) return <div style={card}><div style={h2}>Plan</div><div style={{ ...mono("#64748b"), paddingTop: 10 }}>Loading…</div></div>;

  const founder = !!b?.founding_member;
  const paying = !!b?.is_paying;
  const isPro = (b?.plan === "pro" || b?.plan === "institutional");
  const trialing = b?.status === "trialing";
  const canceling = !!b?.cancel_at;

  // Pill/status line
  const planLabel = founder && !paying ? "Founding Member" : (paying || isPro) ? "Pro" : "Free";
  const planColor = founder && !paying ? "#d4a843" : (paying || isPro) ? "#34d399" : "#cbd5e1";

  return (
    <div style={card}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <div style={h2}>Plan</div>
          <div style={{ ...mono("#9fabc0"), marginTop: 6 }}>
            You&apos;re a <span style={{ color: planColor, fontWeight: 700 }}>{planLabel}</span>.
            {founder && !paying && " Full Pro access, free — Hidden Gems, Simulator, and alerts."}
            {founder && paying && " Supporting QNTM with a paid subscription. Thank you."}
            {!founder && !isPro && " Upgrade for Hidden Gems, the Simulator, and alerts."}
            {b?.is_test_mode && <span style={{ color: "#fbbf24" }}> · billing test mode</span>}
          </div>
        </div>
        {/* Founder, not paying → optional Support */}
        {founder && !paying && !showNotice && <button onClick={startSupport} disabled={busy} style={{ ...ghost, flexShrink: 0 }}>Support QNTM ($29/mo)</button>}
        {/* Non-founder free → Upgrade */}
        {!founder && !isPro && !showNotice && <button onClick={startSupport} disabled={busy} style={{ ...gold, opacity: busy ? 0.6 : 1, flexShrink: 0 }}>Upgrade to Pro</button>}
      </div>

      {/* ARL notice + consent → checkout (both Support and Upgrade route here) */}
      {showNotice && (
        <div style={{ marginTop: 14 }}>
          {founder && <div style={{ ...mono("#b3bed0", 12.5), marginBottom: 6 }}>Supporting QNTM is optional — your founding membership and Pro access continue free whether or not you subscribe.</div>}
          <div dangerouslySetInnerHTML={{ __html: noticeHtml }} />
          <label style={{ display: "flex", gap: 10, alignItems: "flex-start", margin: "12px 0 4px", cursor: "pointer" }}>
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} style={{ marginTop: 3 }} />
            <span style={mono("#cbd5e1", 12.5)}>{checkbox}</span>
          </label>
          <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 14, flexWrap: "wrap" }}>
            <button onClick={toCheckout} disabled={!consent || busy} style={{ ...gold, opacity: !consent || busy ? 0.5 : 1, cursor: !consent || busy ? "default" : "pointer" }}>
              {busy ? "Starting…" : "Continue to secure checkout →"}
            </button>
            <button onClick={() => { setShowNotice(false); setConsent(false); }} style={ghost}>Cancel</button>
          </div>
          <div style={{ ...mono("#64748b", 11), marginTop: 8 }}>Opens Stripe&apos;s secure checkout. Card required; not charged during the 7-day trial.</div>
        </div>
      )}

      {/* Paying → manage: revert / undo */}
      {paying && (
        <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid rgba(255,255,255,.08)" }}>
          <div style={mono("#b3bed0")}>
            {trialing ? "Free trial" : "Active"} · {canceling
              ? <>{founder ? <>reverts to free founding Pro on <strong style={{ color: "#e2e8f0" }}>{b?.cancel_at}</strong></> : <>ends <strong style={{ color: "#e2e8f0" }}>{b?.cancel_at}</strong> — Pro until then</>}</>
              : <>renews at $29/mo{b?.current_period_end ? <> on <strong style={{ color: "#e2e8f0" }}>{b?.current_period_end}</strong></> : null}</>}
          </div>
          <div style={{ marginTop: 12 }}>
            {canceling ? (
              <button onClick={doUndo} disabled={busy} style={{ ...gold, opacity: busy ? 0.6 : 1 }}>{busy ? "…" : "Keep my subscription"}</button>
            ) : confirmRevert ? (
              <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                <span style={mono("#fbbf24", 12.5)}>{founder ? "Stop your paid support at period end? You keep Pro free as a Founding Member." : "Cancel at period end? You keep Pro until then."}</span>
                <button onClick={doRevert} disabled={busy} style={{ ...ghost, color: "#f87171", borderColor: "rgba(248,113,113,.4)" }}>{busy ? "…" : "Yes"}</button>
                <button onClick={() => setConfirmRevert(false)} style={ghost}>Keep it</button>
              </div>
            ) : (
              <button onClick={() => setConfirmRevert(true)} style={ghost}>{founder ? "Switch back to free founding Pro" : "Cancel subscription"}</button>
            )}
          </div>
        </div>
      )}

      {msg && <div style={{ ...mono(/couldn't|wrong|error/i.test(msg) ? "#f87171" : "#9fabc0", 12.5), marginTop: 12 }}>{msg}</div>}
    </div>
  );
}
