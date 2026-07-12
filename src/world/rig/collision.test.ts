import { describe, it, expect } from "vitest";
import { clampToBounds, distanceTo, WORLD_BOUND } from "./collision";

describe("clampToBounds", () => {
  it("passes through a position well inside the bounds unchanged", () => {
    expect(clampToBounds(3, -4)).toEqual({ x: 3, z: -4 });
  });

  it("clamps x and z independently to the world bound", () => {
    expect(clampToBounds(WORLD_BOUND + 10, -WORLD_BOUND - 10)).toEqual({
      x: WORLD_BOUND,
      z: -WORLD_BOUND,
    });
  });

  it("accepts a custom bound override", () => {
    expect(clampToBounds(100, 100, 5)).toEqual({ x: 5, z: 5 });
  });
});

describe("distanceTo", () => {
  it("computes straight-line distance in the XZ plane", () => {
    expect(distanceTo(0, 0, 3, 4)).toBe(5);
  });

  it("is zero for the same point", () => {
    expect(distanceTo(2, 2, 2, 2)).toBe(0);
  });
});
