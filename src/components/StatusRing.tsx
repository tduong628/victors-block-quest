import type { MasteryStatus } from "../types/lesson";
import { getStatusVisual } from "../lib/masteryStatus";

export interface StatusRingProps {
  status: MasteryStatus;
  size?: number;
}

const RADIUS = 15;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * Non-color mastery cue (DESIGN_SPEC.md §9): an outline track plus a colored progress arc
 * (empty / half / three-quarter / full) and a checkmark glyph at "mastered" — the ring
 * shape and the glyph carry the meaning, color is never the only channel.
 */
export default function StatusRing({ status, size = 28 }: StatusRingProps) {
  const visual = getStatusVisual(status);
  const dash = CIRCUMFERENCE * visual.ringFraction;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 36"
      aria-hidden="true"
      className="drop-shadow-sm"
    >
      <circle cx="18" cy="18" r={RADIUS} fill="var(--surface-raised)" stroke="var(--surface-line)" strokeWidth="4" />
      <circle
        cx="18"
        cy="18"
        r={RADIUS}
        fill="none"
        stroke={visual.color}
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray={`${dash} ${CIRCUMFERENCE}`}
        transform="rotate(-90 18 18)"
      />
      {visual.showCheck && (
        <path
          d="M11 18.5l4.2 4.2L25 13"
          fill="none"
          stroke="var(--surface-raised)"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </svg>
  );
}
