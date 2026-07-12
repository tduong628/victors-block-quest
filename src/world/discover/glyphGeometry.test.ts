import { describe, it, expect } from "vitest";
import { getGlyphCubePositions } from "./glyphGeometry";

describe("getGlyphCubePositions", () => {
  it("returns a non-empty list of cube positions for 'A'", () => {
    const cubes = getGlyphCubePositions("A");
    expect(cubes.length).toBeGreaterThan(15);
    expect(cubes.length).toBeLessThan(40); // DESIGN_SPEC_3D.md §7.4: "A" mask yields ~20-30 cubes
  });

  it("every cube position has finite numeric x/y/z", () => {
    const cubes = getGlyphCubePositions("A");
    for (const c of cubes) {
      expect(Number.isFinite(c.x)).toBe(true);
      expect(Number.isFinite(c.y)).toBe(true);
      expect(Number.isFinite(c.z)).toBe(true);
    }
  });

  it("is deterministic — same glyph always yields the same cube list", () => {
    expect(getGlyphCubePositions("A")).toEqual(getGlyphCubePositions("A"));
  });

  it("throws a clear error for a glyph with no defined mask yet", () => {
    expect(() => getGlyphCubePositions("Z")).toThrow(/no mask defined for "Z"/i);
  });
});
