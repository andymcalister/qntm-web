"use client";

import { useEffect, useState } from "react";
import { FONT_DISPLAY, FONT_MONO } from "../screener/lib";

type Stats = {
  total_users?: number; founding_members?: number; founding_spots_remaining?: number;
  founding_limit?: number; pro_users?: number; paying_subscribers?: number;
  email_verified?: number; mrr_estimate?: number; signups_7d?: number;
};

const wrap: React.CSSProperties = { minHeight: "100vh", background: "#060709", padding: "40px 24px" };
const inner: React.CSSProperties = { maxWidth: 820, margin: "0 auto" };
const grid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14, marginTop: 24 };
const card: React.CSSProperties = { background: "rgba(255,255,255,.02)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 12, padding: "18px 20px" };
const label: React.CSSProperties = { fontFamily: FONT_MONO, fontSize: 11.5, letterSpacing: ".08em", color: "#9fabc0", textTransform: "uppercase" };
const value: React.CSSProperties = { fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 30, color: "#fff", marginTop: 8 };
const sub: React.CSSProperties = { fontFamily: FONT_MONO, fontSize: 12, color: "#64748b", marginTop: 4 };

function Card({ label: l, value: v, sub: s, accent }: { label: string; value: React.ReactNode; sub?: string; accent?: string }) {
  return (
    <div style={card}>
      <div style={label}>{l}</div>
      <div style={{ ...value, color: accent || "#fff" }}>{v}</div>
      {s && <div style={sub}>{s}</div>}
    </div>
  );
}

export default function Admin() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/admin/stats", { cache: "no-store" });
        if (r.status === 401) { window.location.href = "/login"; return; }
        if (r.status === 403) { setError("Not authorized."); return; }
        setStats(await r.json());
      } catch { setError("Couldn't load stats."); }
      finally { setLoading(false); }
    })();
  }, []);

  return (
    <div style={wrap}>
      <div style={inner}>
        <a href="/screener" style={{ fontFamily: FONT_MONO, fontSize: 12.5, color: "#9fabc0", textDecoration: "none" }}>← Back to app</a>
        <h1 style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 26, color: "#fff", margin: "14px 0 0" }}>Admin · QNTM</h1>
        <div style={{ fontFamily: FONT_MONO, fontSize: 12.5, color: "#64748b", marginTop: 6 }}>Business metrics. Traffic &amp; funnel live in PostHog.</div>

        {loading && <div style={{ ...sub, marginTop: 24 }}>Loading…</div>}
        {error && <div style={{ fontFamily: FONT_MONO, fontSize: 14, color: "#f87171", marginTop: 24 }}>{error}</div>}

        {stats && (
          <div style={grid}>
            <Card label="Total users" value={stats.total_users ?? "—"} />
            <Card label="Founding members" value={`${stats.founding_members ?? 0} / ${stats.founding_limit ?? 50}`} sub={`${stats.founding_spots_remaining ?? 0} spots left`} accent="#d4a843" />
            <Card label="Pro accounts" value={stats.pro_users ?? "—"} />
            <Card label="Paying subscribers" value={stats.paying_subscribers ?? "—"} accent="#34d399" />
            <Card label="Est. MRR" value={`$${(stats.mrr_estimate ?? 0).toLocaleString()}`} sub="paying × $29" accent="#34d399" />
            <Card label="Email verified" value={stats.email_verified ?? "—"} />
            {typeof stats.signups_7d === "number" && <Card label="Signups (7d)" value={stats.signups_7d} />}
          </div>
        )}
      </div>
    </div>
  );
}
