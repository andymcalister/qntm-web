"use client";

import { useEffect, useState } from "react";

// Shared watchlist membership + optimistic toggle, so the ☆/★ add/remove control
// works on every card view in the app (screener, portfolio, model portfolio…).
// Backed by the same /api/watchlist proxy routes (Bearer attached server-side).
export function useWatchlist() {
  const [watched, setWatched] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch("/api/watchlist")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d?.items) setWatched(new Set(d.items.map((i: { ticker: string }) => i.ticker))); })
      .catch(() => {});
  }, []);

  async function toggleWatch(ticker: string) {
    const has = watched.has(ticker);
    setWatched((prev) => { const n = new Set(prev); if (has) n.delete(ticker); else n.add(ticker); return n; });
    try {
      if (has) await fetch(`/api/watchlist/${encodeURIComponent(ticker)}`, { method: "DELETE" });
      else await fetch("/api/watchlist", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ticker }) });
    } catch {
      setWatched((prev) => { const n = new Set(prev); if (has) n.add(ticker); else n.delete(ticker); return n; });
    }
  }

  return { watched, toggleWatch };
}
