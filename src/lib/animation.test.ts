import { afterEach, describe, expect, it, vi } from "vitest";
import {
  brickPop,
  getBrickPop,
  getDropSnapVariant,
  getEnterVariant,
  getPressTap,
  getScaleInVariant,
  getSnapSoft,
  getSnapSpring,
  getStaggerDelay,
  getWrongAnswerCue,
  mapEntrySpring,
  pressTap,
  prefersReducedMotion,
  reducedCrossFade,
  reducedTap,
  snapSoft,
  snapSpring,
} from "./animation";

function mockMatchMedia(matches: boolean) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockImplementation((query: string) => ({
      matches,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
}

describe("prefersReducedMotion", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns false when the OS has no reduced-motion preference", () => {
    mockMatchMedia(false);

    expect(prefersReducedMotion()).toBe(false);
  });

  it("returns true when the OS requests reduced motion", () => {
    mockMatchMedia(true);

    expect(prefersReducedMotion()).toBe(true);
  });
});

describe("motion preset gating", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns the full spring presets when motion is not reduced", () => {
    mockMatchMedia(false);

    expect(getSnapSpring()).toBe(snapSpring);
    expect(getSnapSoft()).toBe(snapSoft);
    expect(getBrickPop()).toBe(brickPop);
    expect(getPressTap()).toBe(pressTap);
  });

  it("swaps every spring preset for the reduced cross-fade when motion is reduced", () => {
    mockMatchMedia(true);

    expect(getSnapSpring()).toBe(reducedCrossFade);
    expect(getSnapSoft()).toBe(reducedCrossFade);
    expect(getBrickPop()).toBe(reducedCrossFade);
    expect(getPressTap()).toBe(reducedTap);
  });
});

describe("signature-moment motion variants", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("animates y and scale transforms when motion is not reduced", () => {
    mockMatchMedia(false);

    expect(getDropSnapVariant()).toEqual({
      initial: { y: -24, opacity: 0 },
      animate: { y: 0, opacity: 1 },
      transition: mapEntrySpring,
    });
    expect(getScaleInVariant()).toEqual({
      initial: { scale: 0.85, opacity: 0 },
      animate: { scale: 1, opacity: 1 },
      transition: snapSpring,
    });
    expect(getEnterVariant()).toEqual({
      initial: { y: 12, opacity: 0 },
      animate: { y: 0, opacity: 1 },
      transition: snapSoft,
    });
  });

  it("strips every transform down to an opacity-only cross-fade when motion is reduced", () => {
    mockMatchMedia(true);

    for (const variant of [getDropSnapVariant(), getScaleInVariant(), getEnterVariant()]) {
      expect(variant).toEqual({
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        transition: reducedCrossFade,
      });
    }
  });
});

describe("getStaggerDelay", () => {
  it("increases linearly for the first few nodes", () => {
    expect(getStaggerDelay(0)).toBe(0);
    expect(getStaggerDelay(1)).toBeCloseTo(0.03);
    expect(getStaggerDelay(2)).toBeCloseTo(0.06);
  });

  // Regression: the village map's entrance previously multiplied `index * 0.05` with no
  // ceiling, so every extra item in a lesson pack pushed the last node's start time further
  // out and widened the window where most of the map sits at opacity 0. This asserts the
  // delay is bounded regardless of how large `index` gets, so a bigger pack can never make
  // the invisible window longer than today's 10-item map does.
  it("caps the delay so it does not grow unbounded for large indexes", () => {
    const cappedAtSix = getStaggerDelay(6);
    expect(getStaggerDelay(9)).toBe(cappedAtSix);
    expect(getStaggerDelay(50)).toBe(cappedAtSix);
    expect(getStaggerDelay(1000)).toBe(cappedAtSix);
  });
});

describe("getWrongAnswerCue", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns a horizontal shake when motion is not reduced", () => {
    mockMatchMedia(false);

    expect(getWrongAnswerCue()).toEqual({
      kind: "shake",
      animate: { x: [0, -6, 6, -4, 0] },
      transition: { duration: 0.18 },
    });
  });

  it("returns a flash cue instead of a shake when motion is reduced", () => {
    mockMatchMedia(true);

    expect(getWrongAnswerCue()).toEqual({ kind: "flash" });
  });
});
