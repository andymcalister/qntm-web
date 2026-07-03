"use client";

import { useState } from "react";

const KINDS: { key: string; label: string }[] = [
  { key: "outlook", label: "Market Outlook (pre-market)" },
  { key: "wrap", label: "Day Wrap (post-close)" },
  { key: "week", label: "Week Wrap (weekends)" },
];

export default function SubscribeForm() {
  const [email, setEmail] = useState("");
  const [picked, setPicked] = useState<Record<string, boolean>>({ outlook: false, wrap: true, week: false });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  function toggle(k: string) { setPicked((p) => ({ ...p, [k]: !p[k] })); }

  async function submit() {
    setMsg(null);
    const kinds = KINDS.map((k) => k.key).filter((k) => picked[k]);
    if (!email.trim()) { setMsg({ text: "Enter your email.", ok: false }); return; }
    if (kinds.length === 0) { setMsg({ text: "Pick at least one brief.", ok: false }); return; }
    setBusy(true);
    try {
      const r = await fetch("/api/outlook/subscribe", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), kinds }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok || !d.ok) { setMsg({ text: d.detail || "Couldn't subscribe.", ok: false }); }
      else if (d.status === "updated") { setMsg({ text: "Your preferences are updated.", ok: true }); }
      else { setMsg({ text: "Almost there — check your email to confirm.", ok: true }); setEmail(""); }
    } catch { setMsg({ text: "Something went wrong.", ok: false }); }
    finally { setBusy(false); }
  }

  const mono = "var(--font-dm-mono,monospace)";
  return (
    <div style={{ border: "1px solid rgba(255,255,255,.1)", borderRadius: 14, padding: "22px 24px", background: "rgba(212,168,67,.04)", margin: "8px 0 28px" }}>
      <div style={{ fontFamily: "var(--font-syne,sans-serif)", fontWeight: 800, fontSize: 18, color: "#fff", marginBottom: 4 }}>Get the brief by email</div>
      <div style={{ fontFamily: mono, fontSize: 12.5, color: "#9fabc0", marginBottom: 14 }}>Free. Unsubscribe anytime. Pick what you want:</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
        {KINDS.map((k) => (
          <label key={k.key} style={{ display: "flex", gap: 9, alignItems: "center", cursor: "pointer", fontFamily: mono, fontSize: 13, color: "#cbd5e1" }}>
            <input type="checkbox" checked={!!picked[k.key]} onChange={() => toggle(k.key)} />
            {k.label}
          </label>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" autoComplete="email"
          style={{ flex: 1, minWidth: 200, padding: "11px 13px", borderRadius: 8, border: "1px solid rgba(255,255,255,.14)", background: "rgba(13,14,22,.8)", color: "#e2e8f0", fontFamily: mono, fontSize: 14 }} />
        <button onClick={submit} disabled={busy}
          style={{ fontFamily: "var(--font-syne,sans-serif)", fontWeight: 800, fontSize: 13, color: "#0b0c10", background: "#d4a843", border: "none", borderRadius: 8, padding: "11px 20px", cursor: busy ? "default" : "pointer", opacity: busy ? 0.6 : 1 }}>
          {busy ? "…" : "Subscribe"}
        </button>
      </div>
      {msg && <div style={{ fontFamily: mono, fontSize: 12.5, marginTop: 10, color: msg.ok ? "#34d399" : "#f87171" }}>{msg.text}</div>}
    </div>
  );
}
