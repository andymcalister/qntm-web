"use client";

import { useEffect, useState, useCallback } from "react";
import { FONT_DISPLAY, FONT_MONO } from "../../screener/lib";

type Item = {
  id: string; tweet_id?: string; author?: string; post_text?: string; post_url?: string;
  engagement?: number; topic?: string; drafts?: string[];
  author_followers?: number; tier?: string; reply_count?: number; posted_at_x?: string;
};

const ago = (iso?: string) => {
  if (!iso) return "";
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 60) return `${mins}m old`;
  const h = Math.floor(mins / 60);
  return h < 24 ? `${h}h ${mins % 60}m old` : `${Math.floor(h / 24)}d old`;
};
const kf = (n?: number) => (n == null ? "?" : n >= 1000 ? `${(n / 1000).toFixed(1)}k` : `${n}`);
type Queue = { posted_today: number; items: Item[] };

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

  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(""), 2200); };

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

  const record = async (id: string, text: string) => {
    await fetch(`/api/copilot/${id}/approve`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    }).catch(() => {});
    setQ((prev) => (prev ? { ...prev, items: prev.items.filter((i) => i.id !== id) } : prev));
  };

  const postOnX = async (id: string) => {
    const item = q?.items.find((i) => i.id === id);
    const text = (drafts[id] || "").trim();
    if (!text) return flash("Pick or write a reply first");
    if (text.length > 280) return flash("Too long");
    if (!item?.tweet_id) return flash("Missing post id");
    try { await navigator.clipboard.writeText(text); } catch { /* ignore */ }
    const url = `https://x.com/intent/tweet?in_reply_to=${item.tweet_id}&text=${encodeURIComponent(text)}`;
    window.open(url, "_blank", "noopener");
    await record(id, text);
    flash("Opened on X (reply also copied)");
  };

  const copyOnly = async (id: string) => {
    const text = (drafts[id] || "").trim();
    if (!text) return flash("Pick or write a reply first");
    try { await navigator.clipboard.writeText(text); flash("Copied"); }
    catch { flash("Copy failed"); }
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
          {q && <span style={mono(12.5, "#64748b")}>{q.posted_today} posted today</span>}
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
                <span style={{ color: "#34d399" }}>&middot; {ago(it.posted_at_x)}</span>
                <span>&middot; {kf(it.author_followers)} followers</span>
                <span>&middot; {it.engagement} eng</span>
                <span>&middot; {it.reply_count ?? 0} replies</span>
                <span>&middot; {it.tier}</span>
                {it.post_url && <a href={it.post_url} target="_blank" rel="noopener noreferrer" style={{ color: "#64748b", textDecoration: "none" }}>view post</a>}
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
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 8, flexWrap: "wrap" }}>
                <button style={{ ...btn, color: "#c9f5dd", background: "rgba(52,211,153,.1)", border: "1px solid rgba(52,211,153,.4)" }} onClick={() => postOnX(it.id)}>Post on X &#8599;</button>
                <button style={btn} onClick={() => copyOnly(it.id)}>Copy</button>
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
