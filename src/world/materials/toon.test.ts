import { describe, it, expect } from "vitest";
import * as THREE from "three";
import { createToonMaterial } from "./toon";

describe("createToonMaterial", () => {
  it("returns a MeshToonMaterial with a 3-step gradient map and the requested color", () => {
    const mat = createToonMaterial("#E07A5F");
    expect(mat).toBeInstanceOf(THREE.MeshToonMaterial);
    expect(mat.color.getHexString()).toBe("e07a5f");
    expect(mat.gradientMap).toBeInstanceOf(THREE.DataTexture);
  });

  it("reuses the same gradient map instance across calls (never rebuild the shared ramp)", () => {
    const a = createToonMaterial("#E07A5F");
    const b = createToonMaterial("#5F9E7E");
    expect(a.gradientMap).toBe(b.gradientMap);
  });
});
