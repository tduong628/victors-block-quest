import { describe, it, expect, vi } from "vitest";
import { scoreCollectible } from "./ChallengeScene";

// ChallengeScene.ts imports the real "phaser" package (needed to `extends Phaser.Scene`).
// Importing the real package under jsdom crashes at module-load time — Phaser's CanvasFeatures
// device-detection calls canvas.getContext("2d") synchronously, which jsdom does not implement
// (see the plan's own testing note: Phaser is not meaningfully unit-testable in jsdom). Mocking it
// here mirrors ChallengeActivity.test.tsx's approach, and lets this file exercise the pure,
// testable scoreCollectible export without pulling in real Phaser. vi.mock calls are hoisted above
// all imports by Vitest, so this intercepts the "phaser" import before ChallengeScene.ts resolves it.
vi.mock("phaser", () => ({
  default: {
    Scene: class {},
  },
}));

describe("scoreCollectible", () => {
  it("is true when the collected id matches the target id", () => {
    expect(scoreCollectible("letter-A", "letter-A")).toBe(true);
  });
  it("is false when the collected id does not match", () => {
    expect(scoreCollectible("letter-A", "letter-B")).toBe(false);
  });
});
