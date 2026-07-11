import type { MasteryStatus } from "../types/lesson";

export interface StatusVisual {
  color: string;
  /** 0..1 — how much of the status ring is filled (§9: outline-only / half / three-quarter / filled). */
  ringFraction: number;
  showCheck: boolean;
}

// DESIGN_SPEC.md §9 — verified CVD-safe status colors, always paired with a non-color
// shape cue (ring fraction / checkmark), never color alone.
const STATUS_VISUALS: Record<MasteryStatus, StatusVisual> = {
  new: { color: "var(--status-new)", ringFraction: 0, showCheck: false },
  practicing: { color: "var(--status-practicing)", ringFraction: 0.5, showCheck: false },
  nearly_mastered: { color: "var(--status-nearly)", ringFraction: 0.75, showCheck: false },
  mastered: { color: "var(--status-mastered)", ringFraction: 1, showCheck: true },
};

export function getStatusVisual(status: MasteryStatus): StatusVisual {
  return STATUS_VISUALS[status];
}
