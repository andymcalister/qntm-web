"use client";

import { useEffect, useState, useCallback } from "react";
import { FONT_DISPLAY, FONT_MONO } from "../../screener/lib";

type Item = {
  id: string; author?: string; post_text?: string; post_url?: string;
  engagement?: number; topic?: string; drafts?: string[];
};
type Queue = { cap: number; posted_today: number; items: Item[] };

const wrap: React.CSSProperties = { minHeight: "100vh", background: "#060709", padding: "40px 24px" };
const inner: React.CSSProperties = { maxWidth: 760, margin: "0 auto" };
const mono = (size = 12.5, color = "#9fabc0"): React.CSSProperties => ({ fontFamily: FONT_MONO, fontSize: size, color });
const btn: React.CSSProperties = { fontFamily: FONT_MONO, fontSize: 12.5, color: "#cbd5e1", background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.12)", borderRadius: 8, padding: "8px 14px", cursor: "pointer" };
const card: React.CSSProperties = { background: "rgba(255,255,255,.02)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 12, padding: 18, marginTop: 14 };
const draftBtn: React.CSSProperties = { display: "block", width: "100%", textAlign: "left", fontFamily: FONT_MONO, fontSize: 13.5, color: "#dfe6ec", background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.1)", borderRadius: 8, padding: "10px 12px", marginBottom: 8, cursor: "pointer" };
const postBox: React.CSSProperties = { fontFamily: FONT_MONO, fontSize: 14, lineHeight: 1.5, color: "#d6dde4", whiteSpace: "pre-wrap", background: "#0b0e13", border: "1px solid rgba(255,255,255,.07)", borderRadius: 8, padding: 12, margin: "10px 0" };

export default function Copilot() {
  const [q, setQ] = useState<Queue | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [harvesting, setHarvesting] = useState(false);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [toast, setToast] = useState("");

  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(""), 1800); };

  const load = useCallback(async () => {
    try {
      const r = await fetch("/api/copilot/queue", { cache: "no-store" });
      if (r.status === 401) { window.location.href = "/login"; return; }
      if (r.status === 403) { setError("Not authorized."); return; }
      setQ(await r.json());
    } catch { setError("Couldn't load the queue."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const harvest = async () => {
    setHarvesting(true);
    try {
      const r = await fetch("/api/copilot/harvest", { method: "POST", cache: "no-store" });
      const d = await r.json().catch(() => ({}));
      flash(d.queued != null ? `Queued ${d.queued} (${d.gathered} scanned)` : (d.detail || "Harvest error"));
      await load();
    } catch { flash("Harvest error"); }
    finally { setHarvesting(false); }
  };

  const approve = async (id: string) => {
    const text = (drafts[id] || "").trim();
    if (!text) return flash("Pick or write a reply first");
    if (text.length > 280) return flash("Too long");
    const r = await fetch(`/api/copilot/${id}/approve`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text }) });
    if (r.ok) { flash("Posted ✓"); await load(); return; }
    const e = await r.json().catch(() => ({}));
    if (r.status === 409) {
      // Author restricts replies; item was marked blocked server-side. Drop it.
      flash(e.detail || "Reply blocked — cleared");
      setQ((prev) => (prev ? { ...prev, items: prev.items.filter((i) => i.id !== id) } : prev));
      return;
    }
    flash(e.detail || "Failed");
  };

  const skip = async (id: string) => {
    await fetch(`/api/copilot/${id}/skip`, { method: "POST" });
    flash("Skipped");
    setQ((prev) => (prev ? { ...prev, items: prev.items.filter((i) => i.id !== id) } : prev));
  };

  return (
    <div style={wrap}>
      <div style={inner}>
        <a href="/screener" style={{ ...mono(12.5), textDecoration: "none" }}>&larr; Back to app</a>
        <div style={{ display: "flex", alignItems: "baseline", gap: 14, marginTop: 14, flexWrap: "wrap" }}>
          <h1 style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 26, color: "#fff", margin: 0 }}>Copilot &middot; QNTM</h1>
          {q && <span style={mono(12.5, "#64748b")}>{q.posted_today}/{q.cap} posted today</span>}
          <span style={{ flex: 1 }} />
          <button style={btn} onClick={harvest} disabled={harvesting}>{harvesting ? "Harvesting…" : "Harvest now"}</button>
          <button style={btn} onClick={load}>Refresh</button>
        </div>

        {loading && <div style={{ ...mono(13), marginTop: 24 }}>Loading…</div>}
        {error && <div style={{ ...mono(14, "#f87171"), marginTop: 24 }}>{error}</div>}
        {q && !q.items.length && !loading && !error && (
          <div style={{ ...mono(13, "#64748b"), marginTop: 40, textAlign: "center" }}>Queue empty. Hit &ldquo;Harvest now&rdquo;.</div>
        )}

        {q?.items.map((it) => {
          const val = drafts[it.id] ?? "";
          const over = val.length > 280;
          return (
            <div key={it.id} style={card}>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", ...mono(12.5, "#9fabc0") }}>
                <strong style={{ color: "#cbd5e1" }}>@{it.author || "?"}</strong>
                <span>&middot; {it.engagement} eng</span>
                <span>&middot; {it.topic}</span>
                {it.post_url && <a href={it.post_url} target="_blank" rel="noopener noreferrer" style={{ color: "#34d399", textDecoration: "none" }}>open post &#8599;</a>}
              </div>
              <div style={postBox}>{it.post_text}</div>
              {(it.drafts || []).map((d, i) => (
                <button key={i} style={draftBtn} onClick={() => setDrafts((p) => ({ ...p, [it.id]: d }))}>{d}</button>
              ))}
              <textarea
                value={val}
                onChange={(e) => setDrafts((p) => ({ ...p, [it.id]: e.target.value }))}
                placeholder="Pick a draft above, or write your own…"
                style={{ width: "100%", minHeight: 68, marginTop: 4, fontFamily: FONT_MONO, fontSize: 13.5, color: "#e8edf2", background: "#0b0e13", border: "1px solid rgba(255,255,255,.1)", borderRadius: 8, padding: 10, resize: "vertical" }}
              />
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 8 }}>
                <button style={{ ...btn, color: "#c9f5dd", background: "rgba(52,211,153,.1)", border: "1px solid rgba(52,211,153,.4)" }} onClick={() => approve(it.id)}>Approve &middot; Like + Reply</button>
                <button style={{ ...btn, color: "#94a3b8" }} onClick={() => skip(it.id)}>Skip</button>
                <span style={{ flex: 1 }} />
                <span style={mono(12, over ? "#e0a63b" : "#64748b")}>{val.length}/280</span>
              </div>
            </div>
          );
        })}
      </div>
      {toast && <div style={{ position: "fixed", bottom: 18, left: "50%", transform: "translateX(-50%)", ...mono(13, "#e8edf2"), background: "#1b2129", border: "1px solid rgba(255,255,255,.12)", padding: "10px 16px", borderRadius: 8 }}>{toast}</div>}
    </div>
  );
}
