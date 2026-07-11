import { useEffect, useRef } from "react";
import type { ChallengeResult } from "../../game/ChallengeScene";
import type { LessonItem } from "../../types/lesson";
import { recordAttempt } from "../../data/db";

export interface ChallengeActivityProps {
  item: LessonItem;
  allItems: LessonItem[];
  sessionId: string;
  onComplete: (wasCorrect: boolean) => void;
}

export default function ChallengeActivity({ item, allItems, sessionId, onComplete }: ChallengeActivityProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    let cancelled = false;
    let game: import("phaser").Game | undefined;

    async function handleFinish(result: ChallengeResult) {
      const wasCorrect = result.correctCollected > result.wrongCollected;
      await recordAttempt(item.id, "challenge", wasCorrect, sessionId);
      onComplete(wasCorrect);
    }

    (async () => {
      const [{ default: Phaser }, { ChallengeScene }] = await Promise.all([
        import("phaser"),
        import("../../game/ChallengeScene"),
      ]);

      if (cancelled || !containerRef.current) return;

      game = new Phaser.Game({
        type: Phaser.AUTO,
        width: 800,
        height: 480,
        parent: containerRef.current,
        scene: [ChallengeScene],
      });

      game.scene.start("ChallengeScene", { target: item, pool: allItems, onFinish: handleFinish });
    })();

    return () => {
      cancelled = true;
      game?.destroy(true);
    };
  }, [item, allItems, sessionId, onComplete]);

  return <div ref={containerRef} data-testid="challenge-canvas-host" />;
}
