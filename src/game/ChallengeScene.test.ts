import { describe, it, expect, vi } from "vitest";
import type { LessonItem } from "../types/lesson";
import { scoreCollectible } from "./scoreCollectible";

vi.mock("phaser", () => ({
  default: {
    Scene: class {
      constructor(_key?: string) {}
    },
  },
}));

import { ChallengeScene, type ChallengeResult } from "./ChallengeScene";

describe("scoreCollectible", () => {
  it("is true when the collected id matches the target id", () => {
    expect(scoreCollectible("letter-A", "letter-A")).toBe(true);
  });
  it("is false when the collected id does not match", () => {
    expect(scoreCollectible("letter-A", "letter-B")).toBe(false);
  });
});

interface TextStub {
  setInteractive: ReturnType<typeof vi.fn<() => TextStub>>;
  on: ReturnType<typeof vi.fn<(event: string, callback: () => void) => TextStub>>;
  destroy: ReturnType<typeof vi.fn<() => void>>;
}

interface TimerEventStub {
  remove: ReturnType<typeof vi.fn<() => void>>;
}

interface TimerEventConfig {
  delay: number;
  loop?: boolean;
  callback: () => void;
}

interface DelayedCallRecord {
  delay: number;
  callback: () => void;
  event: TimerEventStub;
}

function item(id: string, symbolUpper: string): LessonItem {
  return {
    id,
    kind: "letter",
    symbolUpper,
    audioEn: `/audio/${id}-en.mp3`,
    audioVi: `/audio/${id}-vi.mp3`,
    viLabel: symbolUpper,
    distractorPoolIds: [],
  };
}

function setupScene() {
  const scene = new ChallengeScene();
  const target = item("letter-A", "A");
  const pool = [item("letter-B", "B"), item("letter-C", "C")];
  const onFinish = vi.fn<(result: ChallengeResult) => void>();
  const pointerHandlers: Array<() => void> = [];
  const textStubs: TextStub[] = [];
  const countdownEvent: TimerEventStub = { remove: vi.fn() };
  const delayedCalls: DelayedCallRecord[] = [];
  let countdownConfig: TimerEventConfig | undefined;

  const createTextStub = (): TextStub => {
    const text = {} as TextStub;
    text.setInteractive = vi.fn(() => text);
    text.on = vi.fn((event: string, callback: () => void) => {
      if (event === "pointerdown") pointerHandlers.push(callback);
      return text;
    });
    text.destroy = vi.fn();
    textStubs.push(text);
    return text;
  };

  Object.assign(scene, {
    cameras: {
      main: {
        setBackgroundColor: vi.fn(),
      },
    },
    add: {
      text: vi.fn((_x: number, _y: number, _text: string, _style: { fontSize: string; color: string }) =>
        createTextStub()
      ),
    },
    time: {
      addEvent: vi.fn((config: TimerEventConfig) => {
        countdownConfig = config;
        return countdownEvent;
      }),
      delayedCall: vi.fn((delay: number, callback: () => void) => {
        const event: TimerEventStub = { remove: vi.fn() };
        delayedCalls.push({ delay, callback, event });
        return event;
      }),
    },
  });

  scene.init({ target, pool, onFinish });
  scene.create();

  if (!countdownConfig) throw new Error("Expected countdown timer to be registered");

  return {
    scene,
    onFinish,
    pointerHandlers,
    textStubs,
    countdownConfig,
    countdownEvent,
    delayedCalls,
  };
}

describe("ChallengeScene", () => {
  it("finishes shortly after tapping the correct target", () => {
    const { onFinish, pointerHandlers, textStubs, delayedCalls } = setupScene();

    pointerHandlers[0]();

    expect(textStubs[0].destroy).toHaveBeenCalledTimes(1);
    expect(delayedCalls).toHaveLength(1);
    expect(delayedCalls[0].delay).toBe(400);
    expect(delayedCalls[0].delay).toBeLessThanOrEqual(1000);
    expect(onFinish).not.toHaveBeenCalled();

    delayedCalls[0].callback();

    expect(onFinish).toHaveBeenCalledTimes(1);
    expect(onFinish).toHaveBeenCalledWith(
      expect.objectContaining({
        correctCollected: 1,
        wrongCollected: 0,
        wasCorrect: true,
      })
    );
  });

  it("does not fire onFinish twice if the countdown also reaches zero", () => {
    const { onFinish, pointerHandlers, delayedCalls, countdownConfig } = setupScene();

    pointerHandlers[0]();
    delayedCalls[0].callback();

    for (let i = 0; i < 45; i += 1) {
      countdownConfig.callback();
    }

    expect(onFinish).toHaveBeenCalledTimes(1);
  });

  it("removes the countdown timer when finishing after a correct tap", () => {
    const { pointerHandlers, delayedCalls, countdownEvent } = setupScene();

    pointerHandlers[0]();
    delayedCalls[0].callback();

    expect(countdownEvent.remove).toHaveBeenCalledTimes(1);
  });

  it("still times out without setting wasCorrect when the target is not tapped", () => {
    const { onFinish, pointerHandlers, countdownConfig } = setupScene();

    pointerHandlers[1]();
    pointerHandlers[2]();

    for (let i = 0; i < 45; i += 1) {
      countdownConfig.callback();
    }

    expect(onFinish).toHaveBeenCalledTimes(1);
    expect(onFinish).toHaveBeenCalledWith({
      correctCollected: 0,
      wrongCollected: 2,
    });
    expect(onFinish.mock.calls[0][0].wasCorrect).toBeUndefined();
  });
});
