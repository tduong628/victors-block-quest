import { useEffect, useState } from "react";
import type { LessonItem } from "../../types/lesson";
import { pickDistractors } from "../../data/pickDistractors";
import { recordAttempt } from "../../data/db";

export interface FindItActivityProps {
  item: LessonItem;
  allItems: LessonItem[];
  sessionId: string;
  onComplete: (wasCorrect: boolean) => void;
}

export default function FindItActivity({ item, allItems, sessionId, onComplete }: FindItActivityProps) {
  const [choices, setChoices] = useState<LessonItem[] | null>(null);

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
    await recordAttempt(item.id, "find_it", correct, sessionId);
    onComplete(correct);
  }

  if (!choices) return <div>Loading…</div>;

  return (
    <div className="flex h-full flex-col items-center justify-center gap-8">
      <p className="text-2xl font-semibold text-white">Find {item.symbolUpper}</p>
      <div className="flex gap-6">
        {choices.map((choice) => (
          <button
            key={choice.id}
            onClick={() => handleChoice(choice.id)}
            className="rounded-2xl bg-slate-700 px-10 py-8 text-6xl font-black text-white active:scale-95"
          >
            {choice.symbolUpper}
          </button>
        ))}
      </div>
    </div>
  );
}
