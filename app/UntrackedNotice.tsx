"use client";

import { useState } from "react";

type Item = { ticker: string; tracked?: boolean };

/**
 * Banner for watchlist / portfolio pages: lists any holdings whose ticker left
 * the scored universe after the Russell reconstitution (tracked === false), with
 * a one-tap remove. Renders nothing if everything is still tracked.
 *
 * Usage:
 *   <UntrackedNotice items={items} kind="watchlist" onRemoved={(tk) => refetch()} />
 *   <UntrackedNotice items={holdings} kind="portfolio" onRemoved={(tk) => refetch()} />
 */
export default function UntrackedNotice({
  items, kind, onRemoved,
}: {
  items: Item[];
  kind: "watchlist" | "portfolio";
  onRemoved?: (ticker: string) => void;
}) {
  const [busy, setBusy] = useState<string | null>(null);
  const [gone, setGone] = useState<Set<string>>(new Set());
  const [dismissed, setDismissed] = useState(false);

  const untracked = (items || [])
    .filter((i) => i.tracked === false && !gone.has(i.ticker))
    .map((i) => i.ticker);

  if (dismissed || untracked.length === 0) return null;

  const noun = kind === "watchlist" ? "watched stock" : "holding";
  const mono = "var(--font-dm-mono,monospace)";

  async function remove(tk: string) {
    setBusy(tk);
    try {
      const r = await fetch(`/api/${kind}/${encodeURIComponent(tk)}`, { method: "DELETE" });
      if (r.ok) {
        setGone((g) => new Set(g).add(tk));
        onRemoved?.(tk);
      }
    } catch { /* leave it; user can retry */ }
    finally { setBusy(null); }
  }

  return (
    <div style={{
      border: "1px solid rgba(248,113,113,.3)", borderRadius: 12,
      background: "rgba(248,113,113,.06)", padding: "16px 18px", margin: "0 0 18px",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
        <div style={{ fontFamily: "var(--font-syne,sans-serif)", fontWeight: 800, fontSize: 15, color: "#fca5a5" }}>
          {untracked.length} {noun}{untracked.length === 1 ? "" : "s"} no longer tracked
        </div>
        <button onClick={() => setDismissed(true)} aria-label="Dismiss"
          style={{ background: "none", border: "none", color: "#9fabc0", cursor: "pointer", fontSize: 16, lineHeight: 1 }}>×</button>
      </div>
      <div style={{ fontFamily: mono, fontSize: 12.5, color: "#cbd5e1", lineHeight: 1.6, margin: "6px 0 12px" }}>
        These left the Russell index at the June reconstitution, so QNTM no longer scores or updates them. Remove the ones you don&apos;t want to keep:
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {untracked.map((tk) => (
          <button key={tk} onClick={() => remove(tk)} disabled={busy === tk}
            style={{
              fontFamily: mono, fontSize: 12.5, color: "#e2e8f0",
              background: "rgba(13,14,22,.6)", border: "1px solid rgba(255,255,255,.14)",
              borderRadius: 8, padding: "6px 11px", cursor: busy === tk ? "default" : "pointer",
              opacity: busy === tk ? 0.5 : 1,
            }}>
            {tk} <span style={{ color: "#f87171", marginLeft: 4 }}>✕ remove</span>
          </button>
        ))}
      </div>
    </div>
  );
}
