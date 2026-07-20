const C = {
  bg: "var(--color-bg,#060709)", panel: "#12151a",
  line: "rgba(255,255,255,.07)", text: "#e8ecf1", dim: "#8b95a5",
};
const MONO = 'ui-monospace, SFMono-Regular, Menlo, Monaco, "Courier New", monospace';
//
export default function Loading() {
  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: "#cbd5e1", fontFamily: MONO }}>
      <header style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(8,9,12,.9)", borderBottom: `1px solid ${C.line}`, padding: "12px 20px", display: "flex", alignItems: "center", gap: 18 }}>
        <img src="/qntm-wordmark.png" alt="QNTM" style={{ height: 26, width: "auto" }} />
        <span style={{ color: C.dim, fontSize: 13 }}>Signal Archive</span>
      </header>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 24px 80px" }}>
        <h1 style={{ fontSize: 26, margin: "0 0 6px", color: C.text }}>Signal Archive</h1>
        <p style={{ color: C.dim, fontSize: 14, margin: "0 0 28px" }}>Loading the record&hellip;</p>
        <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 10, padding: 20, marginBottom: 28 }}>
          <div style={{ height: 12, width: 220, background: "rgba(255,255,255,.06)", borderRadius: 4, marginBottom: 14 }} />
          <div style={{ height: 38, width: 140, background: "rgba(255,255,255,.09)", borderRadius: 6 }} />
        </div>
        {[...Array(8)].map((_, i) => (
          <div key={i} style={{ height: 34, background: "rgba(255,255,255,.04)", borderRadius: 6, marginBottom: 8 }} />
        ))}
      </div>
    </div>
  );
}
