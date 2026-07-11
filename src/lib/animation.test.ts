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
  getWrongAnswerCue,
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
      transition: snapSpring,
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
