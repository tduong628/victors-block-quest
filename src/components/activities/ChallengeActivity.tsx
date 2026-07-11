import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import type { ChallengeResult } from "../../game/ChallengeScene";
import type { LessonItem } from "../../types/lesson";
import { recordAttempt } from "../../data/db";
import { getEnterVariant } from "../../lib/animation";

export interface ChallengeActivityProps {
  item: LessonItem;
  allItems: LessonItem[];
  sessionId: string;
  onComplete: (wasCorrect: boolean) => void;
}

// The Phaser canvas itself (background, collectible glyphs, spawn logic in
// ChallengeScene.ts) is untouched here on purpose — only the chrome around the
// canvas host is restyled to the Storybook Dusk voxel direction.
export default function ChallengeActivity({ item, allItems, sessionId, onComplete }: ChallengeActivityProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const enter = getEnterVariant();

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

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-4 bg-surface p-safe-area">
      <p className="font-ui text-xl font-semibold text-ink">Challenge — Collect the {item.symbolUpper}</p>
      <motion.div
        initial={enter.initial}
        animate={enter.animate}
        transition={enter.transition}
        className="overflow-hidden rounded-block border-4 border-surface-line bg-surface-sunken p-3 shadow-inner"
      >
        <div
          ref={containerRef}
          data-testid="challenge-canvas-host"
          className="overflow-hidden rounded-card"
        />
      </motion.div>
    </div>
  );
}
