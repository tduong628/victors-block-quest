// Hand-rolled distance/AABB math — no physics engine (DESIGN_SPEC_3D.md §0, constraint 2).
export const WORLD_BOUND = 18;

export function clampToBounds(
  x: number,
  z: number,
  bound: number = WORLD_BOUND
): { x: number; z: number } {
  return {
    x: Math.max(-bound, Math.min(bound, x)),
    z: Math.max(-bound, Math.min(bound, z)),
  };
}

export function distanceTo(ax: number, az: number, bx: number, bz: number): number {
  return Math.hypot(ax - bx, az - bz);
}
