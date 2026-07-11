import { useMemo, useState } from "react";
import type { LessonItem, LessonPack } from "../types/lesson";
import DiscoverActivity from "./activities/DiscoverActivity";
import FindItActivity from "./activities/FindItActivity";
import MatchItActivity from "./activities/MatchItActivity";
import CreateItActivity from "./activities/CreateItActivity";
import ChallengeActivity from "./activities/ChallengeActivity";

type Step = "discover" | "find_it" | "match_it" | "create_it" | "challenge";

export interface LessonRunnerProps {
  item: LessonItem;
  pack: LessonPack;
  sessionId: string;
  onLessonComplete: (result: { itemId: string; activitiesCorrect: number; activitiesTotal: number }) => void;
}

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

export default function LessonRunner({ item, pack, sessionId, onLessonComplete }: LessonRunnerProps) {
  const steps = useMemo<Step[]>(
    () => ["discover", ...shuffle(["find_it", "match_it", "create_it"] as Step[]), "challenge"],
    [item.id]
  );
  const [stepIndex, setStepIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);

  function advance(wasCorrect: boolean) {
    const nextCorrect = correctCount + (wasCorrect ? 1 : 0);
    if (stepIndex === steps.length - 1) {
      onLessonComplete({ itemId: item.id, activitiesCorrect: nextCorrect, activitiesTotal: steps.length });
      return;
    }
    setCorrectCount(nextCorrect);
    setStepIndex(stepIndex + 1);
  }

  const step = steps[stepIndex];
  switch (step) {
    case "discover":
      return <DiscoverActivity item={item} onComplete={() => advance(true)} />;
    case "find_it":
      return <FindItActivity item={item} allItems={pack.items} sessionId={sessionId} onComplete={advance} />;
    case "match_it":
      return <MatchItActivity item={item} sessionId={sessionId} onComplete={advance} />;
    case "create_it":
      return <CreateItActivity item={item} onComplete={() => advance(true)} />;
    case "challenge":
      return <ChallengeActivity item={item} allItems={pack.items} sessionId={sessionId} onComplete={advance} />;
  }
}
