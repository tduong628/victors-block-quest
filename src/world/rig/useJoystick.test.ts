import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { computeJoystickVector, useJoystick } from "./useJoystick";

describe("computeJoystickVector", () => {
  it("returns zero vector when pointer is at the origin", () => {
    expect(computeJoystickVector(100, 100, 100, 100, 50)).toEqual({ x: 0, z: 0, magnitude: 0 });
  });

  it("returns a unit-ish vector scaled by distance within the radius", () => {
    const v = computeJoystickVector(100, 100, 125, 100, 50); // 25px right, half the radius
    expect(v.x).toBeCloseTo(0.5, 5);
    expect(v.z).toBeCloseTo(0, 5);
    expect(v.magnitude).toBeCloseTo(0.5, 5);
  });

  it("clamps magnitude to 1 when the pointer moves beyond maxRadius", () => {
    const v = computeJoystickVector(100, 100, 300, 100, 50);
    expect(v.magnitude).toBe(1);
    expect(v.x).toBeCloseTo(1, 5);
  });

  it("maps vertical pointer movement to the z axis (screen up = forward = negative z)", () => {
    const v = computeJoystickVector(100, 100, 100, 50, 50); // pointer moved up
    expect(v.z).toBeCloseTo(-1, 5);
    expect(v.x).toBeCloseTo(0, 5);
  });
});

describe("useJoystick", () => {
  it("starts at zero vector and updates on pointer down + move, resets on pointer up", () => {
    const { result } = renderHook(() => useJoystick());
    expect(result.current.vector).toEqual({ x: 0, z: 0, magnitude: 0 });

    act(() => {
      result.current.onPointerDown({
        clientX: 100, clientY: 100,
        currentTarget: { getBoundingClientRect: () => ({ left: 40, top: 40, width: 120, height: 120 }) },
      } as unknown as React.PointerEvent);
    });
    act(() => {
      result.current.onPointerMove({ clientX: 130, clientY: 100 } as unknown as React.PointerEvent);
    });
    expect(result.current.vector.x).toBeGreaterThan(0);

    act(() => {
      result.current.onPointerUp();
    });
    expect(result.current.vector).toEqual({ x: 0, z: 0, magnitude: 0 });
  });
});
