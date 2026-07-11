import Phaser from "phaser";
import type { LessonItem } from "../types/lesson";
import { scoreCollectible } from "./scoreCollectible";

export { scoreCollectible } from "./scoreCollectible";

const COUNTDOWN_TICK_MS = 1000;
const CORRECT_PICK_FINISH_DELAY_MS = 400;

export interface ChallengeResult {
  correctCollected: number;
  wrongCollected: number;
  wasCorrect?: boolean;
}

export class ChallengeScene extends Phaser.Scene {
  private target!: LessonItem;
  private pool!: LessonItem[];
  private result: ChallengeResult = { correctCollected: 0, wrongCollected: 0 };
  private onFinish!: (result: ChallengeResult) => void;
  private timeLeftMs = 45_000;
  private finished = false;
  private countdownEvent?: Phaser.Time.TimerEvent;

  constructor() {
    super("ChallengeScene");
  }

  init(data: { target: LessonItem; pool: LessonItem[]; onFinish: (result: ChallengeResult) => void }) {
    this.target = data.target;
    this.pool = data.pool;
    this.onFinish = data.onFinish;
    this.result = { correctCollected: 0, wrongCollected: 0 };
    this.timeLeftMs = 45_000;
    this.finished = false;
    this.countdownEvent = undefined;
  }

  create() {
    this.cameras.main.setBackgroundColor("#1e293b");
    this.spawnBatch();
    this.countdownEvent = this.time.addEvent({
      delay: COUNTDOWN_TICK_MS,
      loop: true,
      callback: () => {
        this.timeLeftMs -= COUNTDOWN_TICK_MS;
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
        if (correct) {
          this.result.correctCollected += 1;
          this.result.wasCorrect = true;
          this.time.delayedCall(CORRECT_PICK_FINISH_DELAY_MS, () => this.finish());
        } else this.result.wrongCollected += 1;
        text.destroy();
      });
    });
  }

  private finish() {
    if (this.finished) return;
    this.finished = true;
    this.countdownEvent?.remove();
    this.onFinish(this.result);
  }
}
