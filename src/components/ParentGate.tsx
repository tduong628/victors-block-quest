import { useRef, useState } from "react";

export interface ParentGateProps {
  onUnlock: () => void;
  holdMs?: number;
}

function randomTwoDigit(): number {
  return Math.floor(Math.random() * 90) + 10;
}

export default function ParentGate({ onUnlock, holdMs = 3000 }: ParentGateProps) {
  const [question, setQuestion] = useState<{ a: number; b: number } | null>(null);
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function startHold() {
    timerRef.current = setTimeout(() => {
      setQuestion({ a: randomTwoDigit(), b: randomTwoDigit() });
    }, holdMs);
  }

  function cancelHold() {
    if (timerRef.current) clearTimeout(timerRef.current);
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
      <div className="flex h-full flex-col items-center justify-center gap-4">
        <p data-testid="parent-math-question" className="text-3xl text-white">
          {question.a} + {question.b} = ?
        </p>
        <input
          data-testid="parent-math-input"
          type="number"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          className="rounded-lg border p-2 text-xl"
        />
        <button onClick={submit} className="rounded-full bg-emerald-500 px-6 py-3 text-white">
          Submit
        </button>
        {error && <p className="text-red-400">Try again</p>}
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
      className="fixed bottom-2 right-2 h-8 w-8 rounded-full bg-slate-700 opacity-40"
      aria-label="Parent settings"
    />
  );
}
