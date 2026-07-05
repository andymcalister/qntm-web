"use client";

import { useEffect, useState } from "react";

type Holding = { ticker: string; score?: number | null; pnl_pct?: number | null };
type Summary = {
  count: number; hi: number; mo: number; lo: number;
  avg_score: number | null; total_pnl_pct: number | null;
};
type Data = { regime?: string | null; summary?: Summary; holdings?: Holding[] };

const mono = "var(--font-dm-mono,monospace)";
const syne = "var(--font-syne,sans-serif)";

const shell: React.CSSProperties = {
  border: "1px solid rgba(52,211,153,.22)", borderRadius: 14, padding: "20px 24px",
  background: "rgba(52,211,153,.04)", margin: "8px 0 20px",
};
const h: React.CSSProperties = { fontFamily: syne, fontWeight: 800, fontSize: 18, color: "#fff", marginBottom: 4 };
const sub: React.CSSProperties = { fontFamily: mono, fontSize: 12.5, color: "#9fabc0" };

function Pill({ label, n, color }: { label: string; n: number; color: string }) {
  return (
    <span style={{ fontFamily: mono, fontSize: 12.5, color: "#cbd5e1" }}>
      <strong style={{ color, fontSize: 15 }}>{n}</strong> {label}
    </span>
  );
}

export default function PortfolioBrief() {
  const [state, setState] = useState<"loading" | "anon" | "empty" | "ready" | "hide">("loading");
  const [data, setData] = useState<Data | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/portfolio", { cache: "no-store" });
        if (r.status === 401) { setState("anon"); return; }
        if (!r.ok) { setState("hide"); return; }
        const d: Data = await r.json();
        if (!d.summary || d.summary.count === 0) { setState("empty"); return; }
        setData(d); setState("ready");
      } catch { setState("hide"); }
    })();
  }, []);

  if (state === "loading" || state === "hide") return null;

  if (state === "anon") {
    return (
      <div style={shell}>
        <div style={h}>Your holdings × QNTM</div>
        <div style={sub}>See how the model rates the stocks you own — conviction, regime fit, and which positions it flags. <a href="/login" style={{ color: "#34d399", textDecoration: "none", fontWeight: 700 }}>Sign in</a> or <a href="/register" style={{ color: "#d4a843", textDecoration: "none", fontWeight: 700 }}>join free</a>.</div>
      </div>
    );
  }

  if (state === "empty") {
    return (
      <div style={shell}>
        <div style={h}>Your holdings × QNTM</div>
        <div style={sub}>Add positions to your <a href="/portfolio" style={{ color: "#34d399", textDecoration: "none", fontWeight: 700 }}>portfolio</a> and this shows how the model rates each one, every day.</div>
      </div>
    );
  }

  const s = data!.summary!;
  const lows = (data!.holdings || []).filter((x) => (x.score ?? 100) < 45).map((x) => x.ticker).slice(0, 8);
  const pnl = s.total_pnl_pct;
  const pnlCol = pnl == null ? "#94a3b8" : pnl >= 0 ? "#34d399" : "#f87171";

  return (
    <div style={shell}>
      <div style={h}>Your holdings × QNTM</div>
      <div style={{ ...sub, marginBottom: 14 }}>
        How the model rates your {s.count} position{s.count === 1 ? "" : "s"} right now
        {data!.regime ? <> · regime <strong style={{ color: "#e2e8f0" }}>{data!.regime}</strong></> : null}
      </div>

      <div style={{ display: "flex", gap: 20, flexWrap: "wrap", alignItems: "baseline", marginBottom: 12 }}>
        <Pill label="HIGH" n={s.hi} color="#34d399" />
        <Pill label="MODERATE" n={s.mo} color="#d4a843" />
        <Pill label="LOW" n={s.lo} color="#f87171" />
        {s.avg_score != null && (
          <span style={{ fontFamily: mono, fontSize: 12.5, color: "#9fabc0" }}>
            avg conviction <strong style={{ color: "#e2e8f0", fontSize: 15 }}>{s.avg_score}</strong>/100
          </span>
        )}
        {pnl != null && (
          <span style={{ fontFamily: mono, fontSize: 12.5, color: "#9fabc0" }}>
            unrealized <strong style={{ color: pnlCol, fontSize: 15 }}>{pnl >= 0 ? "+" : ""}{pnl.toFixed(2)}%</strong>
          </span>
        )}
      </div>

      {lows.length > 0 ? (
        <div style={{ fontFamily: mono, fontSize: 12.5, color: "#cbd5e1", lineHeight: 1.6 }}>
          Model rates <strong style={{ color: "#f87171" }}>LOW</strong> — worth a review:{" "}
          <span style={{ color: "#e2e8f0" }}>{lows.join(", ")}</span>
        </div>
      ) : (
        <div style={{ fontFamily: mono, fontSize: 12.5, color: "#34d399" }}>
          No holdings in the model's LOW-conviction band right now.
        </div>
      )}

      <div style={{ fontFamily: mono, fontSize: 11, color: "#64748b", marginTop: 12 }}>
        Research/education, not advice. <a href="/portfolio" style={{ color: "#9fabc0" }}>Open your portfolio →</a>
      </div>
    </div>
  );
}
