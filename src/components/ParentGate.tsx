import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { getPressTap, getHoverLift } from "../lib/animation";

export interface ParentGateProps {
  onUnlock: () => void;
  holdMs?: number;
}

function randomTwoDigit(): number {
  return Math.floor(Math.random() * 90) + 10;
}

const RING_R = 18;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_R;

export default function ParentGate({ onUnlock, holdMs = 3000 }: ParentGateProps) {
  const [question, setQuestion] = useState<{ a: number; b: number } | null>(null);
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState(false);
  const [holding, setHolding] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function startHold() {
    setHolding(true);
    timerRef.current = setTimeout(() => {
      setQuestion({ a: randomTwoDigit(), b: randomTwoDigit() });
    }, holdMs);
  }

  function cancelHold() {
    if (timerRef.current) clearTimeout(timerRef.current);
    setHolding(false);
  }

  function submit() {
    if (!question) return;
    if (Number(answer) === question.a + question.b) {
      onUnlock();
    } else {
      setError(true);
      setAnswer("");
    }
  }

  if (question) {
    return (
      <div data-surface="parent" className="flex h-full flex-col items-center justify-center gap-6 bg-pd-bg p-8 font-ui">
        <p data-testid="parent-math-question" className="font-ui text-2xl font-semibold tabular-nums text-pd-ink">
          {question.a} + {question.b} = ?
        </p>
        <input
          data-testid="parent-math-input"
          type="number"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          aria-label="Answer"
          className="min-h-[48px] w-32 rounded-pd border-2 border-pd-line bg-pd-panel px-4 text-center font-ui text-xl text-pd-ink"
        />
        <motion.button
          onClick={submit}
          whileTap={getPressTap()}
          whileHover={getHoverLift()}
          className="min-h-[48px] rounded-pd bg-pd-accent px-8 py-3 font-ui text-lg font-semibold text-white"
        >
          Submit
        </motion.button>
        {error && (
          <p role="alert" className="font-ui text-sm font-semibold text-terracotta-ink">
            Try again
          </p>
        )}
      </div>
    );
  }

  return (
    <button
      data-testid="parent-gate-hold"
      onMouseDown={startHold}
      onMouseUp={cancelHold}
      onMouseLeave={cancelHold}
      onTouchStart={startHold}
      onTouchEnd={cancelHold}
      className="fixed bottom-2 right-2 flex h-11 w-11 items-center justify-center rounded-pill"
      aria-label="Parent settings"
    >
      <svg width="44" height="44" viewBox="0 0 44 44" aria-hidden="true">
        <circle cx="22" cy="22" r={RING_R} fill="none" stroke="var(--ink-mute)" strokeWidth="2.5" />
        <circle
          cx="22"
          cy="22"
          r={RING_R}
          fill="none"
          stroke="var(--teal-ink)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray={RING_CIRCUMFERENCE}
          strokeDashoffset={holding ? 0 : RING_CIRCUMFERENCE}
          transform="rotate(-90 22 22)"
          style={{ transition: holding ? `stroke-dashoffset ${holdMs}ms linear` : "none" }}
        />
        <circle cx="22" cy="22" r="9" fill="var(--ink-soft)" opacity="0.4" />
      </svg>
    </button>
  );
}
