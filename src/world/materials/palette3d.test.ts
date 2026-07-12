import { describe, it, expect } from "vitest";
import { P3 } from "./palette3d";

const HEX_OR_RGBA = /^#[0-9a-fA-F]{6}$|^rgba\(/;

describe("P3 palette", () => {
  it("defines every required key as a valid color string", () => {
    const requiredKeys = [
      "skyTop", "skyHorizon", "grass", "grassLit", "grassShade", "path", "fence", "cloud",
      "foliage", "foliageLit", "trunk",
      "cubBody", "cubBelly", "cubPaw", "cubEye",
      "glyph", "glyphLit", "glyphShade", "glyphEdge", "plinth", "glow",
      "ink", "surface", "hudAction",
    ];
    for (const key of requiredKeys) {
      expect(P3).toHaveProperty(key);
      expect((P3 as Record<string, string>)[key]).toMatch(HEX_OR_RGBA);
    }
  });

  it("reuses the verified 2D ink/surface tokens for HUD text (AAA contrast carries over)", () => {
    expect(P3.ink).toBe("#3A2E28");
    expect(P3.surface).toBe("#FBF3E4");
  });
});
