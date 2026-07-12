// Each glyph is a boolean mask on a 5-wide x 7-tall grid, extruded 2 cubes deep, converted to
// a flat list of cube-center positions. Generalizes to every letter/number in later milestones
// (DESIGN_SPEC_3D.md §7.4) — only the mask table grows, this conversion logic does not change.
export interface CubePosition {
  x: number;
  y: number;
  z: number;
}

const CUBE_SIZE = 1;
const GRID_WIDTH = 5;
const GRID_HEIGHT = 7;
const DEPTH = 2;

// 1 = filled cube column at that grid cell, read top row first (y = GRID_HEIGHT-1) down to
// bottom row (y = 0), so the mask reads visually top-to-bottom in source.
const GLYPH_MASKS: Record<string, number[][]> = {
  A: [
    [0, 1, 1, 1, 0],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 1, 1, 1, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
  ],
};

export function getGlyphCubePositions(glyphChar: string): CubePosition[] {
  const mask = GLYPH_MASKS[glyphChar];
  if (!mask) {
    throw new Error(`getGlyphCubePositions: no mask defined for "${glyphChar}"`);
  }

  const positions: CubePosition[] = [];
  const halfWidth = ((GRID_WIDTH - 1) * CUBE_SIZE) / 2;
  const halfDepth = ((DEPTH - 1) * CUBE_SIZE) / 2;

  for (let row = 0; row < mask.length; row++) {
    const gridY = mask.length - 1 - row; // flip so row 0 (top of source) maps to the tallest y
    for (let col = 0; col < mask[row].length; col++) {
      if (mask[row][col] !== 1) continue;
      for (let d = 0; d < DEPTH; d++) {
        positions.push({
          x: col * CUBE_SIZE - halfWidth,
          y: gridY * CUBE_SIZE,
          z: d * CUBE_SIZE - halfDepth,
        });
      }
    }
  }

  return positions;
}
