import Phaser from "phaser";
import type { LessonItem } from "../types/lesson";
import { scoreCollectible } from "./scoreCollectible";

export { scoreCollectible } from "./scoreCollectible";

export interface ChallengeResult {
  correctCollected: number;
  wrongCollected: number;
}

export class ChallengeScene extends Phaser.Scene {
  private target!: LessonItem;
  private pool!: LessonItem[];
  private result: ChallengeResult = { correctCollected: 0, wrongCollected: 0 };
  private onFinish!: (result: ChallengeResult) => void;
  private timeLeftMs = 45_000;

  constructor() {
    super("ChallengeScene");
  }

  init(data: { target: LessonItem; pool: LessonItem[]; onFinish: (result: ChallengeResult) => void }) {
    this.target = data.target;
    this.pool = data.pool;
    this.onFinish = data.onFinish;
    this.result = { correctCollected: 0, wrongCollected: 0 };
  }

  create() {
    this.cameras.main.setBackgroundColor("#1e293b");
    this.spawnBatch();
    this.time.addEvent({
      delay: 1000,
      loop: true,
      callback: () => {
        this.timeLeftMs -= 1000;
        if (this.timeLeftMs <= 0) this.finish();
      },
    });
  }

  private spawnBatch() {
    const candidates = [this.target, ...this.pool.filter((p) => p.id !== this.target.id)].slice(0, 6);
    candidates.forEach((item, i) => {
      const x = 100 + i * 120;
      const y = 200 + (i % 2 === 0 ? 0 : 150);
      const text = this.add.text(x, y, item.symbolUpper, { fontSize: "48px", color: "#fbbf24" }).setInteractive();
      text.on("pointerdown", () => {
        const correct = scoreCollectible(this.target.id, item.id);
        if (correct) this.result.correctCollected += 1;
        else this.result.wrongCollected += 1;
        text.destroy();
      });
    });
  }

  private finish() {
    this.onFinish(this.result);
  }
}
