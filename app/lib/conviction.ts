// app/lib/conviction.ts
// Single source of truth for conviction thresholds on the frontend — mirrors the
// backend conviction.py (HIGH_MIN=65, MODERATE_MIN=55). Route every label/color
// that keys off the composite CONVICTION score through here so the display can
// never drift from the model again. NOTE: this is the composite-conviction
// threshold ONLY — individual pillar cutoffs (weak-factor flags, pillar coloring)
// are a different scale and must NOT use these.

export const HIGH_MIN = 65;
export const MODERATE_MIN = 55;
export const HIGH_VOL_ENTRY = 70; // model-portfolio buy bar tightens to this in high-vol

export type ConvictionLabel = "HIGH" | "MODERATE" | "LOW";

// Round before comparing — the backend rounds (round(adj) <= 55), so a 64.6 must
// read the same here as it does in the model.
export function convictionLabel(score: number): ConvictionLabel {
  const s = Math.round(score);
  return s >= HIGH_MIN ? "HIGH" : s >= MODERATE_MIN ? "MODERATE" : "LOW";
}

// Title-case variant for UIs that render "High"/"Moderate"/"Low".
export function convictionLabelTitle(score: number): string {
  const l = convictionLabel(score);
  return l.charAt(0) + l.slice(1).toLowerCase();
}

const CONV_COLOR: Record<ConvictionLabel, string> = {
  HIGH: "#34d399",
  MODERATE: "#fbbf24",
  LOW: "#f87171",
};

export function convictionColor(score: number): string {
  return CONV_COLOR[convictionLabel(score)];
}
