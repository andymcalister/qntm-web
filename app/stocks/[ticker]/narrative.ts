// app/stocks/[ticker]/narrative.ts
// Deterministic per-stock narrative — generates ~130-190 words of UNIQUE prose
// from the actual factor data, so each /stocks/[ticker] page carries substantive,
// distinct crawlable text (fixes "Crawled – currently not indexed", where Google
// declines to index near-identical templated pages). No LLM call: the text varies
// because the numbers vary — pillar rankings, spreads, valuation, conviction and
// peers differ per ticker, so the generated paragraphs read differently.

type StockLike = {
  ticker: string;
  sector: string;
  conviction: string;
  score: number;
  composite: number;
  momentum: number;
  quality: number;
  volume: number;
  value: number;
  sentiment: number;
  macro_overlay: number;
  value_position: number;
  pct_rank: number;
  mktcap?: string;
  peers?: { ticker: string; score: number }[];
};

const PILLAR_LABELS: Record<string, string> = {
  momentum: "momentum",
  quality: "quality",
  volume: "volume",
  value: "value",
  sentiment: "sentiment",
};

// Descriptive phrase for a pillar's strength band.
function band(v: number): string {
  if (v >= 80) return "exceptional";
  if (v >= 65) return "strong";
  if (v >= 50) return "solid";
  if (v >= 40) return "middling";
  if (v >= 25) return "soft";
  return "weak";
}

// How each pillar reads when it's a strength / weakness (varies the wording).
const STRENGTH_GLOSS: Record<string, string> = {
  momentum: "price trend and relative strength are working in its favor",
  quality: "earnings quality and balance-sheet strength stand out",
  volume: "trading volume confirms genuine accumulation",
  value: "it screens cheap on the model's valuation inputs",
  sentiment: "analyst and positioning signals are improving",
};
const WEAKNESS_GLOSS: Record<string, string> = {
  momentum: "price trend is the soft spot",
  quality: "earnings-quality metrics lag",
  volume: "volume gives little confirmation",
  value: "valuation looks stretched",
  sentiment: "sentiment signals are working against it",
};

function convictionFraming(conv: string, score: number): string {
  const c = conv.toUpperCase();
  if (c === "HIGH")
    return `a high-conviction reading — ${score.toFixed(0)} puts it among the strongest factor profiles the model tracks`;
  if (c === "MODERATE")
    return `a moderate reading — neither strongly favored nor flagged for weakness at ${score.toFixed(0)}`;
  return `a low-conviction reading — at ${score.toFixed(0)} the factor profile is among the weaker names in the universe`;
}

function valuationClause(vp: number): string {
  if (vp <= 20) return "priced near the floor of its own recent range — the cheap end on the model's valuation read";
  if (vp <= 40) return "priced in the lower part of its recent range";
  if (vp >= 80) return "priced near the top of its recent range — the rich end on the model's valuation read";
  if (vp >= 60) return "priced in the upper part of its recent range";
  return "priced around the middle of its recent range";
}

function spreadClause(pillars: { k: string; v: number }[]): string {
  const hi = pillars[0].v;
  const lo = pillars[pillars.length - 1].v;
  const spread = hi - lo;
  if (spread >= 45)
    return "The profile is lopsided — a few factors carry it while others drag, so the composite masks real disagreement underneath.";
  if (spread <= 18)
    return "The five factors sit close together, so the composite reflects a balanced profile rather than one dominant driver.";
  return "";
}

export function buildStockNarrative(s: StockLike): string[] {
  const pillars = [
    { k: "momentum", v: s.momentum },
    { k: "quality", v: s.quality },
    { k: "volume", v: s.volume },
    { k: "value", v: s.value },
    { k: "sentiment", v: s.sentiment },
  ].sort((a, b) => b.v - a.v);

  const top = pillars[0];
  const second = pillars[1];
  const bottom = pillars[pillars.length - 1];

  const rankPct = Math.max(0, Math.min(100, s.pct_rank));
  const rankClause =
    rankPct >= 50
      ? `ranks in roughly the top ${(100 - rankPct).toFixed(0)}% of the ${s.sector} names the model scores`
      : `sits in the lower ${rankPct.toFixed(0)}% of ${s.sector} names by composite`;

  // Paragraph 1 — the headline read.
  const p1 =
    `${s.ticker} scores ${s.score.toFixed(0)} out of 100 on QNTM's five-factor model — ` +
    `${convictionFraming(s.conviction, s.score)}. Its strongest factor is ${PILLAR_LABELS[top.k]} ` +
    `at ${top.v.toFixed(0)} (${band(top.v)}), where ${STRENGTH_GLOSS[top.k]}, followed by ` +
    `${PILLAR_LABELS[second.k]} at ${second.v.toFixed(0)}. The weakest is ${PILLAR_LABELS[bottom.k]} ` +
    `at ${bottom.v.toFixed(0)}, where ${WEAKNESS_GLOSS[bottom.k]}. ` +
    `Among ${s.sector} stocks it ${rankClause}.`;

  // Paragraph 2 — valuation + spread + macro + peers.
  const spread = spreadClause(pillars);
  const macroClause =
    Math.abs(s.macro_overlay) >= 3
      ? ` The current macro regime ${s.macro_overlay < 0 ? "subtracts from" : "adds to"} the raw factor score by about ${Math.abs(s.macro_overlay).toFixed(1)} points.`
      : "";
  const peerNames = (s.peers || []).slice(0, 3).map((p) => p.ticker);
  const peerClause = peerNames.length
    ? ` Same-sector names the model rates nearby include ${peerNames.join(", ")}.`
    : "";

  const p2 =
    `On valuation, ${s.ticker} is ${valuationClause(s.value_position)}. ` +
    (spread ? spread + " " : "") +
    `The blended composite before the macro overlay was ${s.composite.toFixed(0)}.` +
    macroClause +
    peerClause;

  // Paragraph 3 — standing disclaimer framed as method, adds unique-ish context.
  const p3 =
    `This is a descriptive factor read on ${s.ticker}, recomputed each trading day and ` +
    `shown with its reasoning — not a recommendation to buy, hold or sell. The score reflects ` +
    `where ${s.ticker} sits on the model's measures today, and can change as new data arrives.`;

  return [p1, p2, p3];
}
