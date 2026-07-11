import { useMemo } from "react";
import type { LessonItem } from "../../types/lesson";
import { starterVillagePack } from "../../data/lessonPacks/starter-village";
import { recordAttempt } from "../../data/db";

export interface MatchItActivityProps {
  item: LessonItem;
  sessionId: string;
  onComplete: (wasCorrect: boolean) => void;
}

export default function MatchItActivity({ item, sessionId, onComplete }: MatchItActivityProps) {
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
    await recordAttempt(item.id, "match_it", correct, sessionId);
    onComplete(correct);
  }

  return (
    <div className="flex h-full flex-col items-center justify-center gap-8">
      <div data-testid="match-prompt" className="text-8xl font-black text-amber-300">
        {item.symbolUpper}
      </div>
      <div className="flex gap-6">
        {choices.map((choice) => (
          <button
            key={choice}
            onClick={() => handleChoice(choice)}
            className="rounded-2xl bg-slate-700 px-10 py-8 text-6xl font-black text-white active:scale-95"
          >
            {choice}
          </button>
        ))}
      </div>
    </div>
  );
}
