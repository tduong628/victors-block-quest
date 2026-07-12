import { describe, it, expect } from "vitest";
import { stepVelocity, speedNorm, headingFromVelocity, MAX_SPEED } from "./useCharacterController";

describe("stepVelocity", () => {
  it("accelerates toward the joystick's target velocity, not instantly", () => {
    const v1 = stepVelocity({ x: 0, z: 0 }, { x: 1, z: 0, magnitude: 1 }, 1 / 60);
    expect(v1.x).toBeGreaterThan(0);
    expect(v1.x).toBeLessThan(MAX_SPEED); // did not snap straight to max speed in one frame
  });

  it("decelerates toward zero when the joystick returns to center", () => {
    const v1 = stepVelocity({ x: MAX_SPEED, z: 0 }, { x: 0, z: 0, magnitude: 0 }, 1 / 60);
    expect(v1.x).toBeLessThan(MAX_SPEED);
    expect(v1.x).toBeGreaterThanOrEqual(0);
  });

  it("converges to max speed after enough frames at full joystick deflection", () => {
    let v = { x: 0, z: 0 };
    for (let i = 0; i < 120; i++) {
      v = stepVelocity(v, { x: 1, z: 0, magnitude: 1 }, 1 / 60);
    }
    expect(v.x).toBeCloseTo(MAX_SPEED, 1);
  });
});

describe("speedNorm", () => {
  it("is 0 at rest and 1 at max speed", () => {
    expect(speedNorm({ x: 0, z: 0 })).toBe(0);
    expect(speedNorm({ x: MAX_SPEED, z: 0 })).toBeCloseTo(1, 5);
  });

  it("never exceeds 1 even if velocity somehow overshoots", () => {
    expect(speedNorm({ x: MAX_SPEED * 3, z: 0 })).toBe(1);
  });
});

describe("headingFromVelocity", () => {
  it("computes heading from a moving velocity", () => {
    const heading = headingFromVelocity({ x: 1, z: 0 }, 0);
    expect(heading).toBeCloseTo(Math.atan2(1, 0), 5);
  });

  it("keeps the fallback heading when velocity is near zero, instead of snapping", () => {
    expect(headingFromVelocity({ x: 0.001, z: 0 }, 1.23)).toBe(1.23);
  });
});
