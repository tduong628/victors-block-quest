import { afterEach, describe, expect, it, vi } from "vitest";
import {
  brickPop,
  getBrickPop,
  getPressTap,
  getSnapSoft,
  getSnapSpring,
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
