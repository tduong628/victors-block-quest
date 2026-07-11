import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import type { LessonItem } from "../../types/lesson";
import { starterVillagePack } from "../../data/lessonPacks/starter-village";
import { recordAttempt } from "../../data/db";
import { getHoverLift, getPressTap, getSnapSpring, getWrongAnswerCue, prefersReducedMotion } from "../../lib/animation";
import VoxelTile from "../VoxelTile";

export interface MatchItActivityProps {
  item: LessonItem;
  sessionId: string;
  onComplete: (wasCorrect: boolean) => void;
}

type Feedback = { choice: string; kind: "correct" | "wrong" } | null;

interface MatchChoiceTileProps {
  choice: string;
  feedback: Feedback;
  onTap: () => void;
}

function MatchChoiceTile({ choice, feedback, onTap }: MatchChoiceTileProps) {
  const isThis = feedback?.choice === choice;
  const isCorrect = isThis && feedback?.kind === "correct";
  const wrongCue = isThis && feedback?.kind === "wrong" ? getWrongAnswerCue() : null;
  const isShake = wrongCue?.kind === "shake";
  const isFlash = wrongCue?.kind === "flash";
  const reduced = prefersReducedMotion();

  // "Snaps up to dock beside the uppercase prompt" (DESIGN_SPEC.md §5.4/§7): the tapped
  // choice lifts and shrinks toward the prompt above it on snapSpring before the activity
  // advances, rather than computing exact shared-layout coordinates with the prompt node.
  const animate = reduced
    ? undefined
    : isShake
      ? wrongCue.animate
      : isCorrect
        ? { y: -120, scale: 0.55, opacity: 0 }
        : undefined;
  const transition = isShake ? wrongCue.transition : isCorrect ? getSnapSpring() : undefined;

  return (
    <motion.button
      type="button"
      onClick={onTap}
      whileTap={getPressTap()}
      whileHover={getHoverLift()}
      animate={animate}
      transition={transition}
      className={`relative rounded-block ${isFlash ? "ring-4 ring-terracotta-600" : ""}`}
    >
      <VoxelTile
        interactive={false}
        baseColor="var(--surface-raised)"
        size="clamp(88px, 11vw, 140px)"
        symbol={choice}
        symbolClassName="text-symbol-choice"
      />
    </motion.button>
  );
}

export default function MatchItActivity({ item, sessionId, onComplete }: MatchItActivityProps) {
  const [feedback, setFeedback] = useState<Feedback>(null);

  const choices = useMemo(() => {
    if (item.kind === "letter") {
      const wrongPool = starterVillagePack.items.filter((i) => i.kind === "letter" && i.id !== item.id);
      const wrong = [...wrongPool].sort(() => Math.random() - 0.5).slice(0, 2);
      return [item, ...wrong].map((i) => i.symbolLower!).sort(() => Math.random() - 0.5);
    }
    const wrongPool = starterVillagePack.items.filter((i) => i.kind === "number" && i.id !== item.id);
    const wrong = [...wrongPool].sort(() => Math.random() - 0.5).slice(0, 2);
    return [item, ...wrong].map((i) => i.symbolUpper).sort(() => Math.random() - 0.5);
  }, [item]);

  const correctChoice = item.kind === "letter" ? item.symbolLower! : item.symbolUpper;

  async function handleChoice(choice: string) {
    const correct = choice === correctChoice;
    // Visual-only: drives the dock/shake cue on the tapped tile. onComplete fires
    // immediately after recordAttempt resolves, exactly as before this restyle.
    setFeedback({ choice, kind: correct ? "correct" : "wrong" });
    await recordAttempt(item.id, "match_it", correct, sessionId);
    onComplete(correct);
  }

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-10 bg-surface p-safe-area">
      <VoxelTile
        data-testid="match-prompt"
        interactive={false}
        baseColor="var(--tc-400)"
        size="clamp(120px, 14vw, 170px)"
        symbol={item.symbolUpper}
        symbolClassName="text-3xl"
      />
      <div className="flex flex-wrap justify-center gap-6">
        {choices.map((choice) => (
          <MatchChoiceTile key={choice} choice={choice} feedback={feedback} onTap={() => handleChoice(choice)} />
        ))}
      </div>
    </div>
  );
}
