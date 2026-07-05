"use client";

import { useEffect, useState } from "react";

const mono = "var(--font-dm-mono,monospace)";
const link: React.CSSProperties = { color: "#9fabc0", textDecoration: "none" };

export default function OutlookHeader() {
  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/me", { cache: "no-store" });
        setAuthed(r.ok);
      } catch { setAuthed(false); }
    })();
  }, []);

  return (
    <header style={{ maxWidth: 820, margin: "0 auto", padding: "28px 24px 8px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <a href={authed ? "/screener" : "/"}>
        <img src="/qntm-wordmark.png" alt="QNTM" style={{ height: 24 }} />
      </a>
      <nav style={{ display: "flex", gap: 14, fontFamily: mono, fontSize: 12.5 }}>
        {authed === true && (
          <a href="/screener" style={{ color: "#34d399", textDecoration: "none", fontWeight: 700 }}>← BACK TO APP</a>
        )}
        {authed === false && (
          <>
            <a href="/how-it-works" style={link}>HOW IT WORKS</a>
            <a href="/login" style={link}>SIGN IN</a>
            <a href="/register" style={{ color: "#d4a843", textDecoration: "none" }}>JOIN FREE</a>
          </>
        )}
      </nav>
    </header>
  );
}
