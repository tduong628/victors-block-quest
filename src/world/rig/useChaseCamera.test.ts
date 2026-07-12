import { describe, it, expect } from "vitest";
import { computeFov, dampTowards, BASE_FOV, KICK_FOV } from "./useChaseCamera";

describe("computeFov", () => {
  it("is the base FOV at rest", () => {
    expect(computeFov(0, false)).toBe(BASE_FOV);
  });

  it("lerps toward the kicked FOV as speed increases", () => {
    const fov = computeFov(1, false);
    expect(fov).toBeCloseTo(KICK_FOV, 1);
  });

  it("is a value between base and kick at half speed", () => {
    const fov = computeFov(0.5, false);
    expect(fov).toBeGreaterThan(BASE_FOV);
    expect(fov).toBeLessThan(KICK_FOV);
  });

  it("never kicks under reduced motion, regardless of speed — killed, not shortened", () => {
    expect(computeFov(1, true)).toBe(BASE_FOV);
    expect(computeFov(0.5, true)).toBe(BASE_FOV);
  });
});

describe("dampTowards", () => {
  it("moves partway toward the target, not instantly", () => {
    const result = dampTowards(0, 10, 0.1);
    expect(result).toBeGreaterThan(0);
    expect(result).toBeLessThan(10);
  });

  it("converges to the target over repeated calls", () => {
    let value = 0;
    for (let i = 0; i < 200; i++) value = dampTowards(value, 10, 0.1);
    expect(value).toBeCloseTo(10, 1);
  });

  it("a damping factor of 1 snaps immediately to the target", () => {
    expect(dampTowards(0, 10, 1)).toBe(10);
  });
});
