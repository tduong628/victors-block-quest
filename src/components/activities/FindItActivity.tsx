import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { LessonItem } from "../../types/lesson";
import { pickDistractors } from "../../data/pickDistractors";
import { recordAttempt } from "../../data/db";
import { getBrickPop, getPressTap, getWrongAnswerCue, prefersReducedMotion } from "../../lib/animation";
import VoxelTile from "../VoxelTile";

export interface FindItActivityProps {
  item: LessonItem;
  allItems: LessonItem[];
  sessionId: string;
  onComplete: (wasCorrect: boolean) => void;
}

type Feedback = { choiceId: string; kind: "correct" | "wrong" } | null;

const CORRECT_ADVANCE_MS = 380;
const WRONG_ADVANCE_MS = 260;

function BrickBurst() {
  const brick = getBrickPop();
  const pieces = [0, 1, 2, 3, 4, 5];

  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
      {pieces.map((i) => {
        const angle = (i / pieces.length) * Math.PI * 2;
        const dx = Math.cos(angle) * 44;
        const dy = Math.sin(angle) * 44;
        return (
          <motion.span
            key={i}
            className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-sm"
            style={{ background: i % 2 === 0 ? "var(--bt-400)" : "var(--tc-400)" }}
            initial={{ x: 0, y: 0, opacity: 1, scale: 0.6 }}
            animate={{ x: dx, y: dy, opacity: 0, scale: 1 }}
            transition={{ ...brick, delay: i * 0.04 }}
          />
        );
      })}
    </div>
  );
}

interface ChoiceTileProps {
  choice: LessonItem;
  feedback: Feedback;
  onTap: () => void;
}

function ChoiceTile({ choice, feedback, onTap }: ChoiceTileProps) {
  const isThis = feedback?.choiceId === choice.id;
  const isCorrect = isThis && feedback?.kind === "correct";
  const wrongCue = isThis && feedback?.kind === "wrong" ? getWrongAnswerCue() : null;
  const isShake = wrongCue?.kind === "shake";
  const isFlash = wrongCue?.kind === "flash";
  const reduced = prefersReducedMotion();

  const animate = reduced
    ? undefined
    : isShake
      ? wrongCue.animate
      : isCorrect
        ? { scale: [1, 1.12, 1] }
        : undefined;
  const transition = isShake ? wrongCue.transition : isCorrect ? getBrickPop() : undefined;

  return (
    <motion.button
      type="button"
      onClick={onTap}
      whileTap={getPressTap()}
      whileHover={{ y: -2 }}
      animate={animate}
      transition={transition}
      className={`relative rounded-block ${isFlash ? "ring-4 ring-terracotta-600" : ""}`}
    >
      <VoxelTile
        interactive={false}
        baseColor="var(--surface-raised)"
        size="clamp(96px, 12vw, 150px)"
        symbol={choice.symbolUpper}
        symbolClassName="text-symbol-choice"
      />
      {isCorrect && !reduced && <BrickBurst />}
    </motion.button>
  );
}

export default function FindItActivity({ item, allItems, sessionId, onComplete }: FindItActivityProps) {
  const [choices, setChoices] = useState<LessonItem[] | null>(null);
  const [feedback, setFeedback] = useState<Feedback>(null);

  useEffect(() => {
    let cancelled = false;
    pickDistractors(item, allItems, 2).then((distractors) => {
      if (cancelled) return;
      const shuffled = [item, ...distractors].sort(() => Math.random() - 0.5);
      setChoices(shuffled);
    });
    return () => { cancelled = true; };
  }, [item, allItems]);

  async function handleChoice(choiceId: string) {
    const correct = choiceId === item.id;
    setFeedback({ choiceId, kind: correct ? "correct" : "wrong" });
    await recordAttempt(item.id, "find_it", correct, sessionId);
    const delay = prefersReducedMotion() ? 0 : correct ? CORRECT_ADVANCE_MS : WRONG_ADVANCE_MS;
    setTimeout(() => onComplete(correct), delay);
  }

  if (!choices) return <div className="flex h-full items-center justify-center text-ink-mute">Loading…</div>;

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-10 bg-surface p-safe-area">
      <p className="font-ui text-2xl font-semibold text-ink">Find {item.symbolUpper}</p>
      <div className="flex flex-wrap justify-center gap-6">
        {choices.map((choice) => (
          <ChoiceTile
            key={choice.id}
            choice={choice}
            feedback={feedback}
            onTap={() => handleChoice(choice.id)}
          />
        ))}
      </div>
    </div>
  );
}
