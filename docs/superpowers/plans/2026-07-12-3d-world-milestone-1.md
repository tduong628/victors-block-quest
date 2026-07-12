# 3D World Milestone 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first playable slice of the Brookhaven-style 3D world for Victor's Block Learning Quest — one walkable low-poly "Voxel Cub" character on a small bounded grass plateau, a Snappy Arcade Chase camera, and one letter-A monument with a working native-3D Discover interaction (cubes disperse → assemble into the glyph on approach → glow → speak EN/VI via the existing audio pipeline → record the attempt). Nothing else — no other letters/numbers, no other activities in 3D.

**Architecture:** A new `src/world/` layer built with React Three Fiber sits alongside the existing, untouched 2D app. It imports and calls the existing frozen logic (`recordAttempt`, `getItemAudio`/`playSequential`) rather than reimplementing it. `App.tsx` is repointed to render the new 3D world as the app's entry screen for Milestone 1 (the existing 2D `StarterVillageMap` code is not deleted, just no longer the default render path).

**Tech Stack:** React 18 + TypeScript + Vite (existing), + `three`, `@react-three/fiber`, `@react-three/drei` (new). `@react-three/test-renderer` (new devDependency) for component tests that don't need a real WebGL context. No physics engine. Vitest + Testing Library for pure-logic and mount tests, matching the existing `vi.mock("phaser", ...)` precedent for engine code that can't run in jsdom.

## Global Constraints

- **Frozen, do not touch:** `src/data/*` (db, mastery, pickDistractors, lessonPacks), `src/audio/manifest.ts`, `src/game/ChallengeScene.ts` + `scoreCollectible.ts`, `ParentGate.tsx`, `ParentDashboard.tsx`. New code calls into these exact functions; it never modifies them.
- **No physics engine.** Movement and collision are hand-rolled distance/AABB math, not `@react-three/rapier` or any physics library.
- **New dependencies only:** `three`, `@react-three/fiber`, `@react-three/drei`, `@react-three/test-renderer` (dev). Nothing else without a documented reason in the task that adds it.
- **Performance budget (hard targets, Samsung tablet Chrome WebGL):** 30fps hard floor · <60 draw calls · <50k triangles · one shared toon material per hue, no per-object materials · no shadow maps, no PBR, no post-processing · `dpr` capped at `[1, 2]` · no per-frame allocations inside `useFrame` (reuse `Vector3`/`Quaternion` temporaries).
- **Color palette:** `P3` constants from `DESIGN_SPEC_3D.md` §2, isolated in `src/world/materials/palette3d.ts` — the single source of truth for 3D hex values, kept separate from the 2D `tokens.css` so a future palette swap (documented "C2 door" in the spec) is a one-file edit.
- **Reduced motion:** every animated system (camera FOV kick/bounce/catch-up, monument assembly, brick-burst particles) must collapse to a static/instant equivalent under `matchMedia('(prefers-reduced-motion: reduce)')` — gate in JS, not CSS, since Three.js/R3F animation runs via `useFrame`, not CSS transitions.
- **Existing test suite (55 unit + 2 e2e as of this plan) must stay green throughout.** No existing test's assertions may be weakened.
- **Acceptance gate is NOT the test suite.** jsdom cannot render real WebGL. The plan's final task ends with an explicit statement that automated tests prove wiring, not real frame rate, visual quality, or touch-joystick feel — those can only be judged by John on his actual Samsung tablet, per `DESIGN_SPEC_3D.md` §10.

---

## File Structure

```
src/world/                       # NEW — the entire 3D layer
  WorldCanvas.tsx                # <Canvas> root: renderer, camera, lights, fog, Suspense, fallback
  WorldCanvas.test.tsx
  Scene.tsx                      # assembles world; owns the single useFrame tick
  Scene.test.tsx
  WorldFallback.tsx              # WebGL-unavailable message
  WorldFallback.test.tsx
  LoadingCube.tsx                # Suspense fallback
  rig/
    collision.ts                 # clampToBounds(), distanceTo()               (pure)
    collision.test.ts
    useJoystick.ts                # touch joystick -> unit vector + magnitude   (pure logic + hook)
    useJoystick.test.ts
    useCharacterController.ts    # joystick -> position, turn, accel/decel, bounds, speedNorm
    useCharacterController.test.ts
    useChaseCamera.ts            # D3 follow: offset + damped catch-up + FOV kick + bounce
    useChaseCamera.test.ts
  entities/
    VoxelCub.tsx                 # character mesh + procedural idle/walk/turn
    VoxelCub.test.tsx
    WorldDressing.tsx            # Ground + Trees + Clouds (grouped — all simple set dressing)
    WorldDressing.test.tsx
  discover/
    glyphGeometry.ts             # glyph mask grid -> cube positions           (pure)
    glyphGeometry.test.ts
    LetterMonument.tsx           # instanced glyph cubes + plinth + E3 assembly
    LetterMonument.test.tsx
    useMonumentDiscover.ts       # proximity trigger -> assemble -> audio(EN,VI) -> recordAttempt
    useMonumentDiscover.test.ts
  hud/
    Joystick.tsx                 # DOM overlay touch control
    Joystick.test.tsx
    WorldHud.tsx                 # bilingual EN/VI dots
    WorldHud.test.tsx
  materials/
    palette3d.ts                 # P3 hex constants (3D token source of truth)
    palette3d.test.ts
    toon.ts                      # shared MeshToonMaterial factory + 3-band ramp
    toon.test.ts
```

Modified: `src/App.tsx` (renders `WorldCanvas` instead of `StarterVillageMap` for Milestone 1), `src/App.test.tsx`, `package.json`/`package-lock.json` (new dependencies).

---

### Task 1: Dependencies + 3D palette + shared toon material

**Files:**
- Modify: `package.json` (add dependencies)
- Create: `src/world/materials/palette3d.ts`
- Test: `src/world/materials/palette3d.test.ts`
- Create: `src/world/materials/toon.ts`
- Test: `src/world/materials/toon.test.ts`

**Interfaces:**
- Produces (used by every later task in `src/world/`):
```typescript
// src/world/materials/palette3d.ts
export const P3: {
  skyTop: string; skyHorizon: string;
  grass: string; grassLit: string; grassShade: string; path: string; fence: string; cloud: string;
  foliage: string; foliageLit: string; trunk: string;
  cubBody: string; cubBelly: string; cubPaw: string; cubEye: string;
  glyph: string; glyphLit: string; glyphShade: string; glyphEdge: string; plinth: string; glow: string;
  ink: string; surface: string; hudAction: string;
};

// src/world/materials/toon.ts
export function createToonMaterial(hue: string): THREE.MeshToonMaterial;
```

- [ ] **Step 1: Install dependencies**

```bash
cd /Volumes/Claude/John/victors-block-quest
npm install three @react-three/fiber @react-three/drei
npm install -D @react-three/test-renderer @types/three
```

Verify `package.json`'s React version (`^18.3.1`) is compatible with whatever `@react-three/fiber` version npm resolves — R3F v8.x targets React 18; if npm resolves an R3F version that requires React 19, stop and pin explicitly to the latest v8.x release instead (`npm install @react-three/fiber@^8`) rather than letting the peer-dependency mismatch through.

- [ ] **Step 2: Write the failing test for the palette**

```typescript
// src/world/materials/palette3d.test.ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- palette3d.test.ts`
Expected: FAIL — `src/world/materials/palette3d.ts` does not exist.

- [ ] **Step 3: Write the palette (transcribed exactly from `DESIGN_SPEC_3D.md` §2)**

```typescript
// src/world/materials/palette3d.ts
// 3D world palette (C1 Faithful Dusk 3D) — the single source of truth for 3D hex values.
// Isolated from the 2D tokens.css on purpose: DESIGN_SPEC_3D.md §1.1 documents a possible
// future palette-only swap toward brighter "Storybook Noon" if the muted C1 choice reads too
// flat once built — keeping every 3D hue in this one file makes that swap a one-file edit.
export const P3 = {
  skyTop: "#A9C7D0",
  skyHorizon: "#F2D9C4",

  grass: "#5F9E7E",
  grassLit: "#72B08D",
  grassShade: "#4C8168",
  path: "#EBDCBF",
  fence: "#C9B490",
  cloud: "#FBF3E4",

  foliage: "#316B60",
  foliageLit: "#3D8577",
  trunk: "#8A5A3C",

  cubBody: "#E89C86",
  cubBelly: "#FCEFC3",
  cubPaw: "#C55E44",
  cubEye: "#3A2E28",

  glyph: "#E07A5F",
  glyphLit: "#EFA88F",
  glyphShade: "#B85A42",
  glyphEdge: "rgba(58,46,40,0.22)",
  plinth: "#EBDCBF",
  glow: "#F2CC5B",

  ink: "#3A2E28",
  surface: "#FBF3E4",
  hudAction: "#C1502F",
} as const;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- palette3d.test.ts`
Expected: PASS

- [ ] **Step 5: Write the failing test for the toon material factory**

```typescript
// src/world/materials/toon.test.ts
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
```

- [ ] **Step 6: Run test to verify it fails**

Run: `npm run test -- toon.test.ts`
Expected: FAIL — `src/world/materials/toon.ts` does not exist. If it instead fails with a WebGL-context/canvas error, that means constructing `THREE.MeshToonMaterial`/`THREE.DataTexture` needs a real GL context even before rendering — if so, note this in the commit message and skip to Step 8's fallback approach instead of Step 7.

- [ ] **Step 7: Implement the toon material factory**

```typescript
// src/world/materials/toon.ts
import * as THREE from "three";

// A tiny 3x1px gradient ramp shared by every material — this is what gives flat-shaded
// low-poly geometry its "sunlit top / soft shadow" read at near-zero GPU cost (no shadow
// maps, no PBR — see DESIGN_SPEC_3D.md §2 and §6 for why this matters on a tablet).
let sharedGradientMap: THREE.DataTexture | null = null;

function getGradientMap(): THREE.DataTexture {
  if (sharedGradientMap) return sharedGradientMap;
  const data = new Uint8Array([64, 64, 64, 160, 160, 160, 255, 255, 255]); // shadow, mid, lit
  const texture = new THREE.DataTexture(data, 3, 1, THREE.RGBFormat);
  texture.magFilter = THREE.NearestFilter;
  texture.needsUpdate = true;
  sharedGradientMap = texture;
  return sharedGradientMap;
}

export function createToonMaterial(hue: string): THREE.MeshToonMaterial {
  return new THREE.MeshToonMaterial({ color: hue, gradientMap: getGradientMap() });
}
```

- [ ] **Step 8: If Step 6 revealed a jsdom/WebGL construction error, use this fallback implementation and test approach instead**

If `three`'s core classes genuinely cannot construct in jsdom without a real canvas, mock `three` at the top of `toon.test.ts` the same way `phaser` is mocked in `ChallengeActivity.test.tsx` — mock only `MeshToonMaterial`/`DataTexture`/`NearestFilter`/`RGBFormat` as lightweight stand-ins, and assert the factory calls them with the right arguments rather than asserting on real instance behavior. Document which path was needed in the commit message so later tasks know whether `three` core classes are safe to construct directly in tests.

- [ ] **Step 9: Run test to verify it passes**

Run: `npm run test -- toon.test.ts`
Expected: PASS

- [ ] **Step 10: Run the full existing suite to confirm no regression**

Run: `npm run test`
Expected: all existing tests still pass, plus the 3 new ones above.

- [ ] **Step 11: Commit**

```bash
git add package.json package-lock.json src/world/materials/
git commit -m "feat: add R3F dependencies and the 3D world's palette + shared toon material"
```

---

### Task 2: Collision — bounds clamp and distance check (pure)

**Files:**
- Create: `src/world/rig/collision.ts`
- Test: `src/world/rig/collision.test.ts`

**Interfaces:**
- Produces (used by Task 5's character controller and Task 9's monument discover trigger):
```typescript
export const WORLD_BOUND: number; // 18 — matches the fence radius in DESIGN_SPEC_3D.md §7.2
export function clampToBounds(x: number, z: number, bound?: number): { x: number; z: number };
export function distanceTo(ax: number, az: number, bx: number, bz: number): number;
```

- [ ] **Step 1: Write the failing tests**

```typescript
// src/world/rig/collision.test.ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- collision.test.ts`
Expected: FAIL — `src/world/rig/collision.ts` does not exist.

- [ ] **Step 3: Implement**

```typescript
// src/world/rig/collision.ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- collision.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/world/rig/collision.ts src/world/rig/collision.test.ts
git commit -m "feat: add pure world-bounds clamp and distance functions"
```

---

### Task 3: Glyph geometry — letter mask to cube positions (pure)

**Files:**
- Create: `src/world/discover/glyphGeometry.ts`
- Test: `src/world/discover/glyphGeometry.test.ts`

**Interfaces:**
- Produces (used by Task 9's `LetterMonument.tsx`):
```typescript
export interface CubePosition { x: number; y: number; z: number }
export function getGlyphCubePositions(glyphChar: string): CubePosition[];
```

- [ ] **Step 1: Write the failing tests**

```typescript
// src/world/discover/glyphGeometry.test.ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- glyphGeometry.test.ts`
Expected: FAIL — `src/world/discover/glyphGeometry.ts` does not exist.

- [ ] **Step 3: Implement**

```typescript
// src/world/discover/glyphGeometry.ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- glyphGeometry.test.ts`
Expected: PASS (the "A" mask above has 15 filled cells × 2 depth = 30 cubes, inside the 15–40 range asserted)

- [ ] **Step 5: Commit**

```bash
git add src/world/discover/glyphGeometry.ts src/world/discover/glyphGeometry.test.ts
git commit -m "feat: add pure glyph-mask-to-cube-position geometry for the letter monuments"
```

---

### Task 4: Touch joystick — pointer input to movement vector

**Files:**
- Create: `src/world/rig/useJoystick.ts`
- Test: `src/world/rig/useJoystick.test.ts`

**Interfaces:**
- Produces (used by Task 5's character controller and Task 10's `Joystick.tsx` DOM overlay):
```typescript
export interface JoystickVector { x: number; z: number; magnitude: number } // x/z each in [-1, 1], magnitude in [0, 1]
export function computeJoystickVector(
  originX: number, originY: number,
  pointerX: number, pointerY: number,
  maxRadius: number
): JoystickVector;
export function useJoystick(): {
  vector: JoystickVector;
  onPointerDown: (e: React.PointerEvent) => void;
  onPointerMove: (e: React.PointerEvent) => void;
  onPointerUp: () => void;
};
```

- [ ] **Step 1: Write the failing tests for the pure vector math**

```typescript
// src/world/rig/useJoystick.test.ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- useJoystick.test.ts`
Expected: FAIL — `src/world/rig/useJoystick.ts` does not exist.

- [ ] **Step 3: Implement**

```typescript
// src/world/rig/useJoystick.ts
import { useCallback, useRef, useState } from "react";

export interface JoystickVector {
  x: number;
  z: number;
  magnitude: number;
}

const ZERO_VECTOR: JoystickVector = { x: 0, z: 0, magnitude: 0 };

export function computeJoystickVector(
  originX: number,
  originY: number,
  pointerX: number,
  pointerY: number,
  maxRadius: number
): JoystickVector {
  const dx = pointerX - originX;
  const dy = pointerY - originY;
  const rawMagnitude = Math.hypot(dx, dy) / maxRadius;
  const magnitude = Math.min(1, rawMagnitude);
  if (magnitude === 0) return ZERO_VECTOR;

  const angle = Math.atan2(dy, dx);
  return {
    x: Math.cos(angle) * magnitude,
    z: Math.sin(angle) * magnitude, // screen "up" (negative dy) becomes negative z (forward)
    magnitude,
  };
}

export function useJoystick() {
  const [vector, setVector] = useState<JoystickVector>(ZERO_VECTOR);
  const originRef = useRef<{ x: number; y: number } | null>(null);
  const maxRadiusRef = useRef(50);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    originRef.current = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    maxRadiusRef.current = rect.width / 2;
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!originRef.current) return;
    setVector(
      computeJoystickVector(
        originRef.current.x,
        originRef.current.y,
        e.clientX,
        e.clientY,
        maxRadiusRef.current
      )
    );
  }, []);

  const onPointerUp = useCallback(() => {
    originRef.current = null;
    setVector(ZERO_VECTOR);
  }, []);

  return { vector, onPointerDown, onPointerMove, onPointerUp };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- useJoystick.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/world/rig/useJoystick.ts src/world/rig/useJoystick.test.ts
git commit -m "feat: add touch joystick pointer-to-vector logic"
```

---

### Task 5: Character controller — velocity, bounds, heading (pure math + hook)

**Files:**
- Create: `src/world/rig/useCharacterController.ts`
- Test: `src/world/rig/useCharacterController.test.ts`

**Interfaces:**
- Consumes: `JoystickVector` (Task 4), `clampToBounds` (Task 2)
- Produces (used by Task 7's `VoxelCub.tsx` and Task 6's chase camera):
```typescript
export const MAX_SPEED: number; // world units/sec
export function stepVelocity(current: { x: number; z: number }, joystick: JoystickVector, deltaSec: number): { x: number; z: number };
export function speedNorm(velocity: { x: number; z: number }): number; // 0-1
export function headingFromVelocity(velocity: { x: number; z: number }, fallbackHeading: number): number; // radians
export function useCharacterController(joystickVector: JoystickVector): {
  position: { x: number; z: number };
  heading: number;
  speedNorm: number;
};
```

- [ ] **Step 1: Write the failing tests for the pure functions**

```typescript
// src/world/rig/useCharacterController.test.ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- useCharacterController.test.ts`
Expected: FAIL — `src/world/rig/useCharacterController.ts` does not exist.

- [ ] **Step 3: Implement**

```typescript
// src/world/rig/useCharacterController.ts
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { JoystickVector } from "./useJoystick";
import { clampToBounds } from "./collision";

export const MAX_SPEED = 6; // world units/sec
const ACCEL = 24; // units/sec^2 toward target velocity — feel-tuned, not physics

function clampDelta(delta: number, maxDelta: number): number {
  return Math.max(-maxDelta, Math.min(maxDelta, delta));
}

export function stepVelocity(
  current: { x: number; z: number },
  joystick: JoystickVector,
  deltaSec: number
): { x: number; z: number } {
  const targetX = joystick.x * MAX_SPEED;
  const targetZ = joystick.z * MAX_SPEED;
  const maxDelta = ACCEL * deltaSec;
  return {
    x: current.x + clampDelta(targetX - current.x, maxDelta),
    z: current.z + clampDelta(targetZ - current.z, maxDelta),
  };
}

export function speedNorm(velocity: { x: number; z: number }): number {
  return Math.min(1, Math.hypot(velocity.x, velocity.z) / MAX_SPEED);
}

const HEADING_DEADZONE = 0.01;

export function headingFromVelocity(velocity: { x: number; z: number }, fallbackHeading: number): number {
  if (Math.hypot(velocity.x, velocity.z) < HEADING_DEADZONE) return fallbackHeading;
  return Math.atan2(velocity.x, velocity.z);
}

export interface CharacterState {
  position: { x: number; z: number };
  heading: number;
  speedNorm: number;
}

// Thin useFrame wrapper around the pure functions above — this hook itself is not unit
// tested directly (it requires an R3F render loop); the pure functions it calls are, per
// DESIGN_SPEC_3D.md §10's testing strategy. Covered by Task 12's WorldCanvas mount test.
export function useCharacterController(joystickVector: JoystickVector): CharacterState {
  const stateRef = useRef<CharacterState>({ position: { x: 0, z: 0 }, heading: 0, speedNorm: 0 });
  const velocityRef = useRef({ x: 0, z: 0 });

  useFrame((_state, delta) => {
    velocityRef.current = stepVelocity(velocityRef.current, joystickVector, delta);
    const nextX = stateRef.current.position.x + velocityRef.current.x * delta;
    const nextZ = stateRef.current.position.z + velocityRef.current.z * delta;
    const clamped = clampToBounds(nextX, nextZ);
    stateRef.current = {
      position: clamped,
      heading: headingFromVelocity(velocityRef.current, stateRef.current.heading),
      speedNorm: speedNorm(velocityRef.current),
    };
  });

  return stateRef.current;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- useCharacterController.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/world/rig/useCharacterController.ts src/world/rig/useCharacterController.test.ts
git commit -m "feat: add character velocity/heading/bounds controller"
```

---

### Task 6: Chase camera — D3 Snappy Arcade Chase (pure math + hook)

**Files:**
- Create: `src/world/rig/useChaseCamera.ts`
- Test: `src/world/rig/useChaseCamera.test.ts`

**Interfaces:**
- Consumes: `CharacterState` shape from Task 5, `prefersReducedMotion()` from `src/lib/animation.ts` (existing, reused as-is per Global Constraints)
- Produces (used by Task 12's `Scene.tsx`):
```typescript
export const BASE_FOV: number; // 55
export const KICK_FOV: number; // 62
export function computeFov(speedNorm: number, reducedMotion: boolean): number;
export function dampTowards(current: number, target: number, dampingFactor: number): number;
export function useChaseCamera(target: { position: { x: number; z: number }; heading: number; speedNorm: number }): void; // mutates the R3F camera each frame
```

- [ ] **Step 1: Write the failing tests for the pure functions**

```typescript
// src/world/rig/useChaseCamera.test.ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- useChaseCamera.test.ts`
Expected: FAIL — `src/world/rig/useChaseCamera.ts` does not exist.

- [ ] **Step 3: Implement**

```typescript
// src/world/rig/useChaseCamera.ts
import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { prefersReducedMotion } from "../../lib/animation";

// D3 Snappy Arcade Chase — DESIGN_SPEC_3D.md §5.3. Amplitude caps and the reduced-motion
// kill switch are non-negotiable (the player is 3 years old — nausea risk is real).
export const BASE_FOV = 55;
export const KICK_FOV = 62; // capped swing per the spec's "<= ~7 degrees" safety note
const CAMERA_DAMPING = 0.08;
const BOUNCE_AMPLITUDE = 0.06; // small, per spec's "conservative" bounce note
const BASE_OFFSET = { x: 0, y: 4.5, z: 7 };

export function computeFov(speedNorm: number, reducedMotion: boolean): number {
  if (reducedMotion) return BASE_FOV;
  return BASE_FOV + (KICK_FOV - BASE_FOV) * speedNorm;
}

export function dampTowards(current: number, target: number, dampingFactor: number): number {
  return current + (target - current) * dampingFactor;
}

export interface ChaseCameraTarget {
  position: { x: number; z: number };
  heading: number;
  speedNorm: number;
}

// Thin useFrame wrapper — the pure math above is what's unit tested (DESIGN_SPEC_3D.md §10).
// This hook itself needs a live R3F camera and is covered by Task 12's WorldCanvas mount test.
export function useChaseCamera(target: ChaseCameraTarget): void {
  const { camera } = useThree();
  const bounceTimeRef = useRef(0);

  useFrame((_state, delta) => {
    const reducedMotion = prefersReducedMotion();
    const fov = computeFov(target.speedNorm, reducedMotion);
    if ("fov" in camera && camera.fov !== fov) {
      (camera as THREE.PerspectiveCamera).fov = fov;
      (camera as THREE.PerspectiveCamera).updateProjectionMatrix();
    }

    const desiredX = target.position.x + BASE_OFFSET.x;
    const desiredZ = target.position.z + BASE_OFFSET.z;
    let desiredY = BASE_OFFSET.y;

    if (!reducedMotion) {
      bounceTimeRef.current += delta;
      desiredY += Math.sin(bounceTimeRef.current * 6) * BOUNCE_AMPLITUDE * target.speedNorm;
    }

    const damping = reducedMotion ? 1 : CAMERA_DAMPING;
    camera.position.x = dampTowards(camera.position.x, desiredX, damping);
    camera.position.y = dampTowards(camera.position.y, desiredY, damping);
    camera.position.z = dampTowards(camera.position.z, desiredZ, damping);
    camera.lookAt(target.position.x, 1, target.position.z);
  });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- useChaseCamera.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/world/rig/useChaseCamera.ts src/world/rig/useChaseCamera.test.ts
git commit -m "feat: add D3 snappy arcade chase camera with reduced-motion collapse"
```

---

### Task 7: Voxel Cub character

**Files:**
- Create: `src/world/entities/VoxelCub.tsx`
- Test: `src/world/entities/VoxelCub.test.tsx`

**Interfaces:**
- Consumes: `P3` (Task 1), `createToonMaterial` (Task 1)
- Produces (used by Task 12's `Scene.tsx`):
```typescript
export interface VoxelCubProps {
  position: { x: number; z: number };
  heading: number;
  speedNorm: number;
}
export default function VoxelCub(props: VoxelCubProps): JSX.Element;
```

- [ ] **Step 1: Write the failing mount test**

```typescript
// src/world/entities/VoxelCub.test.tsx
import { describe, it, expect } from "vitest";
import ReactThreeTestRenderer from "@react-three/test-renderer";
import VoxelCub from "./VoxelCub";

describe("VoxelCub", () => {
  it("mounts a group containing mesh primitives, under the perf budget (<500 tris means <~15 primitive meshes for M1's simple boxes)", async () => {
    const renderer = await ReactThreeTestRenderer.create(
      <VoxelCub position={{ x: 0, z: 0 }} heading={0} speedNorm={0} />
    );
    const meshes = renderer.scene.children[0].allChildren.filter((n) => n.type === "Mesh");
    expect(meshes.length).toBeGreaterThan(0);
    expect(meshes.length).toBeLessThan(15);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- VoxelCub.test.tsx`
Expected: FAIL — `src/world/entities/VoxelCub.tsx` does not exist.

- [ ] **Step 3: Implement**

```typescript
// src/world/entities/VoxelCub.tsx
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";
import { P3 } from "../materials/palette3d";
import { createToonMaterial } from "../materials/toon";

export interface VoxelCubProps {
  position: { x: number; z: number };
  heading: number;
  speedNorm: number;
}

// Non-humanoid, rounded, rig-free for Milestone 1 (DESIGN_SPEC_3D.md §4) — procedural
// idle/walk/turn only, no skeleton. Budget: <500 tris.
export default function VoxelCub({ position, heading, speedNorm }: VoxelCubProps) {
  const groupRef = useRef<Group>(null);
  const timeRef = useRef(0);

  const bodyMat = createToonMaterial(P3.cubBody);
  const bellyMat = createToonMaterial(P3.cubBelly);
  const pawMat = createToonMaterial(P3.cubPaw);
  const eyeMat = createToonMaterial(P3.cubEye);

  useFrame((_state, delta) => {
    if (!groupRef.current) return;
    timeRef.current += delta;

    groupRef.current.position.x = position.x;
    groupRef.current.position.z = position.z;

    // Turn toward travel heading, never snap.
    const headingDiff = heading - groupRef.current.rotation.y;
    groupRef.current.rotation.y += headingDiff * Math.min(1, delta * 8);

    // Idle breathing bob when still; waddle bob + side-tilt scaled by speed when moving.
    const bobFreq = speedNorm > 0.05 ? 8 : 1.5;
    const bobAmplitude = speedNorm > 0.05 ? 0.06 * speedNorm : 0.03;
    groupRef.current.position.y = Math.sin(timeRef.current * bobFreq) * bobAmplitude;
    groupRef.current.rotation.z = Math.sin(timeRef.current * bobFreq) * 0.08 * speedNorm;
  });

  return (
    <group ref={groupRef} data-testid="voxel-cub">
      <mesh position={[0, 0.35, 0]} material={bodyMat}>
        <boxGeometry args={[0.6, 0.5, 0.5]} />
      </mesh>
      <mesh position={[0, 0.75, 0.15]} material={bodyMat}>
        <boxGeometry args={[0.5, 0.45, 0.45]} />
      </mesh>
      <mesh position={[-0.16, 1.0, 0.15]} material={pawMat}>
        <boxGeometry args={[0.14, 0.14, 0.1]} />
      </mesh>
      <mesh position={[0.16, 1.0, 0.15]} material={pawMat}>
        <boxGeometry args={[0.14, 0.14, 0.1]} />
      </mesh>
      <mesh position={[0, 0.72, 0.36]} material={bellyMat}>
        <boxGeometry args={[0.22, 0.18, 0.06]} />
      </mesh>
      <mesh position={[-0.1, 0.78, 0.38]} material={eyeMat}>
        <boxGeometry args={[0.05, 0.05, 0.02]} />
      </mesh>
      <mesh position={[0.1, 0.78, 0.38]} material={eyeMat}>
        <boxGeometry args={[0.05, 0.05, 0.02]} />
      </mesh>
      <mesh position={[-0.16, 0.1, 0]} material={pawMat}>
        <boxGeometry args={[0.18, 0.2, 0.22]} />
      </mesh>
      <mesh position={[0.16, 0.1, 0]} material={pawMat}>
        <boxGeometry args={[0.18, 0.2, 0.22]} />
      </mesh>
    </group>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- VoxelCub.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/world/entities/VoxelCub.tsx src/world/entities/VoxelCub.test.tsx
git commit -m "feat: add procedural rig-free Voxel Cub character"
```

---

### Task 8: World dressing — ground, fence, path, trees, clouds

**Files:**
- Create: `src/world/entities/WorldDressing.tsx`
- Test: `src/world/entities/WorldDressing.test.tsx`

**Interfaces:**
- Consumes: `P3`, `createToonMaterial` (Task 1)
- Produces (used by Task 12's `Scene.tsx`):
```typescript
export default function WorldDressing(): JSX.Element; // grass plateau + fence + path + instanced trees/clouds
```

- [ ] **Step 1: Write the failing mount test**

```typescript
// src/world/entities/WorldDressing.test.tsx
import { describe, it, expect } from "vitest";
import ReactThreeTestRenderer from "@react-three/test-renderer";
import WorldDressing from "./WorldDressing";

describe("WorldDressing", () => {
  it("mounts without crashing and includes at least one instanced mesh (perf: instance repeats, DESIGN_SPEC_3D.md §6)", async () => {
    const renderer = await ReactThreeTestRenderer.create(<WorldDressing />);
    const instanced = renderer.scene.children[0].allChildren.filter((n) => n.type === "InstancedMesh");
    expect(instanced.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- WorldDressing.test.tsx`
Expected: FAIL — `src/world/entities/WorldDressing.tsx` does not exist.

- [ ] **Step 3: Implement**

```typescript
// src/world/entities/WorldDressing.tsx
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Object3D, InstancedMesh } from "three";
import { P3 } from "../materials/palette3d";
import { createToonMaterial } from "../materials/toon";
import { WORLD_BOUND } from "../rig/collision";

const PLATEAU_SIZE = WORLD_BOUND * 2 + 4;
const FENCE_POST_COUNT = 28;
const TREE_COUNT = 4;
const CLOUD_COUNT = 3;

const dummy = new Object3D(); // reused scratch object — no per-frame allocations (DESIGN_SPEC_3D.md §6)

// B1 Toy Village Green: a bounded grassy plateau with a fence marking the AABB bound, a path
// to the monument, sparse instanced trees, and drifting cloud billboards. Kept sparse on
// purpose — perf headroom first (DESIGN_SPEC_3D.md §7.2).
export default function WorldDressing() {
  const grassMat = createToonMaterial(P3.grass);
  const fenceMat = createToonMaterial(P3.fence);
  const pathMat = createToonMaterial(P3.path);
  const foliageMat = createToonMaterial(P3.foliage);
  const trunkMat = createToonMaterial(P3.trunk);
  const cloudMat = createToonMaterial(P3.cloud);

  const fenceRef = useRef<InstancedMesh>(null);
  const treesRef = useRef<InstancedMesh>(null);
  const cloudsRef = useRef<InstancedMesh>(null);

  const fencePositions = useMemo(() => {
    const positions: [number, number, number][] = [];
    for (let i = 0; i < FENCE_POST_COUNT; i++) {
      const angle = (i / FENCE_POST_COUNT) * Math.PI * 2;
      positions.push([Math.cos(angle) * WORLD_BOUND, 0.5, Math.sin(angle) * WORLD_BOUND]);
    }
    return positions;
  }, []);

  const treePositions = useMemo(
    () =>
      Array.from({ length: TREE_COUNT }, (_, i) => {
        const angle = (i / TREE_COUNT) * Math.PI * 2 + 0.6;
        const radius = WORLD_BOUND * 0.6;
        return [Math.cos(angle) * radius, 0.6, Math.sin(angle) * radius] as [number, number, number];
      }),
    []
  );

  useFrame(() => {
    if (fenceRef.current) {
      fencePositions.forEach((pos, i) => {
        dummy.position.set(...pos);
        dummy.updateMatrix();
        fenceRef.current!.setMatrixAt(i, dummy.matrix);
      });
      fenceRef.current.instanceMatrix.needsUpdate = true;
    }
    if (treesRef.current) {
      treePositions.forEach((pos, i) => {
        dummy.position.set(...pos);
        dummy.updateMatrix();
        treesRef.current!.setMatrixAt(i, dummy.matrix);
      });
      treesRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} material={grassMat}>
        <planeGeometry args={[PLATEAU_SIZE, PLATEAU_SIZE, 8, 8]} />
      </mesh>
      <mesh position={[0, 0.01, -WORLD_BOUND / 2]} rotation={[-Math.PI / 2, 0, 0]} material={pathMat}>
        <planeGeometry args={[1.5, WORLD_BOUND]} />
      </mesh>
      <instancedMesh ref={fenceRef} args={[undefined, undefined, FENCE_POST_COUNT]} material={fenceMat}>
        <cylinderGeometry args={[0.08, 0.08, 1]} />
      </instancedMesh>
      <instancedMesh ref={treesRef} args={[undefined, undefined, TREE_COUNT]} material={foliageMat}>
        <coneGeometry args={[0.5, 1.2, 6]} />
      </instancedMesh>
      {Array.from({ length: CLOUD_COUNT }, (_, i) => (
        <mesh key={i} position={[i * 6 - 6, 8, -10]} material={cloudMat}>
          <boxGeometry args={[1.5, 0.5, 1]} />
        </mesh>
      ))}
      <mesh position={[0, -0.01, 0]}>
        <ringGeometry args={[WORLD_BOUND - 0.1, WORLD_BOUND + 0.1, 32]} />
        <meshBasicMaterial color={P3.fence} />
      </mesh>
    </group>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- WorldDressing.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/world/entities/WorldDressing.tsx src/world/entities/WorldDressing.test.tsx
git commit -m "feat: add bounded toy-village world dressing (ground, fence, path, trees, clouds)"
```

---

### Task 9: Letter Monument — E3 Block-Build Discover interaction

**Files:**
- Create: `src/world/discover/useMonumentDiscover.ts`
- Test: `src/world/discover/useMonumentDiscover.test.ts`
- Create: `src/world/discover/LetterMonument.tsx`
- Test: `src/world/discover/LetterMonument.test.tsx`

**Interfaces:**
- Consumes: `getGlyphCubePositions` (Task 3), `distanceTo` (Task 2), `snapSpring`/`brickPop`/`prefersReducedMotion` (existing `src/lib/animation.ts`), `getItemAudio`/`playSequential` (existing `src/audio/manifest.ts`), `recordAttempt` (existing `src/data/db.ts`)
- Produces (used by Task 12's `Scene.tsx`):
```typescript
export const DISCOVER_TRIGGER_RADIUS: number; // 4
export function shouldTriggerDiscover(playerX: number, playerZ: number, monumentX: number, monumentZ: number, alreadyDiscovered: boolean): boolean;
export function useMonumentDiscover(itemId: string, sessionId: string, playerPosition: { x: number; z: number }, monumentPosition: { x: number; z: number }): {
  phase: "dispersed" | "assembling" | "discovered";
};

export interface LetterMonumentProps {
  itemId: string; // "letter-A" for M1
  glyphChar: string; // "A"
  position: { x: number; z: number };
  sessionId: string;
  playerPosition: { x: number; z: number };
}
export default function LetterMonument(props: LetterMonumentProps): JSX.Element;
```

- [ ] **Step 1: Write the failing tests for the pure trigger logic**

```typescript
// src/world/discover/useMonumentDiscover.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { shouldTriggerDiscover, DISCOVER_TRIGGER_RADIUS } from "./useMonumentDiscover";

describe("shouldTriggerDiscover", () => {
  it("triggers when the player is within the radius and not already discovered", () => {
    expect(shouldTriggerDiscover(0, 0, 1, 1, false)).toBe(true);
  });

  it("does not trigger when the player is outside the radius", () => {
    expect(shouldTriggerDiscover(0, 0, DISCOVER_TRIGGER_RADIUS + 5, 0, false)).toBe(false);
  });

  it("does not re-trigger once already discovered, even if still in radius", () => {
    expect(shouldTriggerDiscover(0, 0, 1, 1, true)).toBe(false);
  });

  it("triggers exactly at the boundary radius (inclusive edge documented, not accidental)", () => {
    expect(shouldTriggerDiscover(0, 0, DISCOVER_TRIGGER_RADIUS, 0, false)).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- useMonumentDiscover.test.ts`
Expected: FAIL — `src/world/discover/useMonumentDiscover.ts` does not exist.

- [ ] **Step 3: Write the pure trigger function and the hook**

```typescript
// src/world/discover/useMonumentDiscover.ts
import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { distanceTo } from "../rig/collision";
import { getItemAudio, playSequential } from "../../audio/manifest";
import { recordAttempt } from "../../data/db";

export const DISCOVER_TRIGGER_RADIUS = 4;

export function shouldTriggerDiscover(
  playerX: number,
  playerZ: number,
  monumentX: number,
  monumentZ: number,
  alreadyDiscovered: boolean
): boolean {
  if (alreadyDiscovered) return false;
  return distanceTo(playerX, playerZ, monumentX, monumentZ) <= DISCOVER_TRIGGER_RADIUS;
}

export type DiscoverPhase = "dispersed" | "assembling" | "discovered";

// E3 Block-Build Monument sequence (DESIGN_SPEC_3D.md §7.4): proximity trigger -> assemble
// -> glow -> speak EN then VI via the EXISTING audio pipeline -> recordAttempt. No new
// mastery logic — this calls the same frozen functions the 2D app uses.
export function useMonumentDiscover(
  itemId: string,
  sessionId: string,
  playerPosition: { x: number; z: number },
  monumentPosition: { x: number; z: number }
): { phase: DiscoverPhase } {
  const [phase, setPhase] = useState<DiscoverPhase>("dispersed");
  const firingRef = useRef(false);

  useFrame(() => {
    if (firingRef.current || phase !== "dispersed") return;
    const trigger = shouldTriggerDiscover(
      playerPosition.x,
      playerPosition.z,
      monumentPosition.x,
      monumentPosition.z,
      false
    );
    if (!trigger) return;

    firingRef.current = true;
    setPhase("assembling");

    (async () => {
      const { en, vi } = getItemAudio(itemId);
      await playSequential([en, vi]);
      await recordAttempt(itemId, "discover", true, sessionId);
      setPhase("discovered");
    })();
  });

  return { phase };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- useMonumentDiscover.test.ts`
Expected: PASS

- [ ] **Step 5: Write the failing mount/integration test for `LetterMonument`**

```typescript
// src/world/discover/LetterMonument.test.tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import "fake-indexeddb/auto";
import ReactThreeTestRenderer from "@react-three/test-renderer";
import LetterMonument from "./LetterMonument";
import { db } from "../../data/db";

vi.mock("../../audio/manifest", () => ({
  getItemAudio: vi.fn().mockReturnValue({ en: { src: "/audio/en_letter-A.mp3" }, vi: { src: "/audio/vi_letter-A.mp3" } }),
  playSequential: vi.fn().mockResolvedValue(undefined),
}));

describe("LetterMonument", () => {
  beforeEach(async () => {
    await db.attempts.clear();
    await db.mastery.clear();
  });

  it("mounts an instanced glyph mesh matching the 'A' cube count", async () => {
    const renderer = await ReactThreeTestRenderer.create(
      <LetterMonument
        itemId="letter-A"
        glyphChar="A"
        position={{ x: 0, z: -10 }}
        sessionId="s1"
        playerPosition={{ x: 20, z: 20 }} // far away — should not trigger discover
      />
    );
    const instanced = renderer.scene.children[0].allChildren.filter((n) => n.type === "InstancedMesh");
    expect(instanced.length).toBeGreaterThan(0);
  });

  it("records a discover attempt once the player walks within the trigger radius", async () => {
    const renderer = await ReactThreeTestRenderer.create(
      <LetterMonument
        itemId="letter-A"
        glyphChar="A"
        position={{ x: 0, z: 0 }}
        sessionId="s1"
        playerPosition={{ x: 1, z: 1 }} // within DISCOVER_TRIGGER_RADIUS
      />
    );
    await renderer.advanceFrames(5, 1 / 60);
    await new Promise((resolve) => setTimeout(resolve, 0)); // flush the async discover chain

    const record = await db.mastery.get("letter-A");
    expect(record?.totalAttempts).toBe(1);
    expect(record?.correctAttempts).toBe(1);
  });
});
```

- [ ] **Step 6: Run test to verify it fails**

Run: `npm run test -- LetterMonument.test.tsx`
Expected: FAIL — `src/world/discover/LetterMonument.tsx` does not exist.

- [ ] **Step 7: Implement**

```typescript
// src/world/discover/LetterMonument.tsx
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Object3D, InstancedMesh } from "three";
import { P3 } from "../materials/palette3d";
import { createToonMaterial } from "../materials/toon";
import { getGlyphCubePositions } from "./glyphGeometry";
import { useMonumentDiscover } from "./useMonumentDiscover";
import { snapSpring, brickPop, prefersReducedMotion } from "../../lib/animation";

export interface LetterMonumentProps {
  itemId: string;
  glyphChar: string;
  position: { x: number; z: number };
  sessionId: string;
  playerPosition: { x: number; z: number };
}

const dummy = new Object3D();
const CUBE_SCALE = 0.5;

export default function LetterMonument({
  itemId,
  glyphChar,
  position,
  sessionId,
  playerPosition,
}: LetterMonumentProps) {
  const targetCubes = useMemo(() => getGlyphCubePositions(glyphChar), [glyphChar]);
  const glyphMat = createToonMaterial(P3.glyph);
  const plinthMat = createToonMaterial(P3.plinth);
  const meshRef = useRef<InstancedMesh>(null);
  const timeRef = useRef(0);

  const { phase } = useMonumentDiscover(itemId, sessionId, playerPosition, position);
  const reducedMotion = prefersReducedMotion();

  // Dispersed rest positions — a loose scattered cloud above the plinth (DESIGN_SPEC_3D.md §7.4).
  const dispersedCubes = useMemo(
    () =>
      targetCubes.map((_, i) => ({
        x: (Math.sin(i * 12.9) * 3) % 3,
        y: 3 + (i % 4) * 0.3,
        z: (Math.cos(i * 7.3) * 3) % 3,
      })),
    [targetCubes]
  );

  useFrame((_state, delta) => {
    if (!meshRef.current) return;
    timeRef.current += delta;

    const assembled = phase === "assembling" || phase === "discovered";
    const instant = reducedMotion; // reduced motion: appear already-assembled, no fly-in overshoot

    targetCubes.forEach((target, i) => {
      const rest = dispersedCubes[i];
      let x = rest.x;
      let y = rest.y;
      let z = rest.z;

      if (assembled) {
        if (instant) {
          x = target.x;
          y = target.y;
          z = target.z;
        } else {
          // Snap & Stack feel, reused from the existing 2D motion system (not reinvented).
          const t = Math.min(1, (timeRef.current - i * 0.02) * (snapSpring.stiffness ?? 320) / 320);
          x = rest.x + (target.x - rest.x) * t;
          y = rest.y + (target.y - rest.y) * t;
          z = rest.z + (target.z - rest.z) * t;
        }
      } else if (!instant) {
        y += Math.sin(timeRef.current * 1.5 + i) * 0.05; // slow bob while dispersed
      }

      dummy.position.set(x, y, z);
      dummy.scale.setScalar(CUBE_SCALE);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;

    if (phase === "discovered" && !instant) {
      const glow = 0.3 + Math.sin(timeRef.current * (brickPop.stiffness ?? 400) / 400) * 0.1;
      glyphMat.emissive.set(P3.glow);
      glyphMat.emissiveIntensity = Math.max(0, glow);
    }
  });

  return (
    <group position={[position.x, 0, position.z]} data-testid="letter-monument">
      <mesh position={[0, 0.15, 0]} material={plinthMat}>
        <boxGeometry args={[1.5, 0.3, 1]} />
      </mesh>
      <instancedMesh ref={meshRef} args={[undefined, undefined, targetCubes.length]} material={glyphMat}>
        <boxGeometry args={[1, 1, 1]} />
      </instancedMesh>
    </group>
  );
}
```

- [ ] **Step 8: Run test to verify it passes**

Run: `npm run test -- LetterMonument.test.tsx useMonumentDiscover.test.ts`
Expected: PASS

- [ ] **Step 9: Run the full suite to confirm no regression to the frozen data layer**

Run: `npm run test`
Expected: all tests pass — this task is the first to actually call `recordAttempt`/`getItemAudio` from new code, so this is the most important regression check in the whole plan.

- [ ] **Step 10: Commit**

```bash
git add src/world/discover/
git commit -m "feat: add E3 block-build letter monument wired to the existing audio and mastery pipeline"
```

---

### Task 10: HUD — DOM joystick overlay and bilingual cue

**Files:**
- Create: `src/world/hud/Joystick.tsx`
- Test: `src/world/hud/Joystick.test.tsx`
- Create: `src/world/hud/WorldHud.tsx`
- Test: `src/world/hud/WorldHud.test.tsx`

**Interfaces:**
- Consumes: `useJoystick` (Task 4), `P3` (Task 1)
- Produces (used by Task 13's `App.tsx` wiring):
```typescript
export interface JoystickProps { onVectorChange: (v: { x: number; z: number; magnitude: number }) => void }
export default function Joystick(props: JoystickProps): JSX.Element;

export interface WorldHudProps { activeLang: "en" | "vi" | null }
export default function WorldHud(props: WorldHudProps): JSX.Element;
```

- [ ] **Step 1: Write the failing test for `Joystick`**

```typescript
// src/world/hud/Joystick.test.tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import Joystick from "./Joystick";

describe("Joystick", () => {
  it("has a >=44px thumb hit area (target-size floor) and reports vector changes on drag", () => {
    const onVectorChange = vi.fn();
    render(<Joystick onVectorChange={onVectorChange} />);
    const base = screen.getByTestId("joystick-base");
    expect(base).toBeInTheDocument();

    fireEvent.pointerDown(base, { clientX: 100, clientY: 100 });
    fireEvent.pointerMove(base, { clientX: 130, clientY: 100 });
    expect(onVectorChange).toHaveBeenCalled();
    const lastCall = onVectorChange.mock.calls[onVectorChange.mock.calls.length - 1][0];
    expect(lastCall.magnitude).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- Joystick.test.tsx`
Expected: FAIL — `src/world/hud/Joystick.tsx` does not exist.

- [ ] **Step 3: Implement**

```typescript
// src/world/hud/Joystick.tsx
import { useEffect } from "react";
import { useJoystick, type JoystickVector } from "../rig/useJoystick";
import { P3 } from "../materials/palette3d";

export interface JoystickProps {
  onVectorChange: (vector: JoystickVector) => void;
}

// Fixed bottom-left virtual stick, DOM overlay (not inside the R3F canvas). Base ~120px,
// thumb >=44px hit area (DESIGN_SPEC_3D.md §5.1 target-size floor).
export default function Joystick({ onVectorChange }: JoystickProps) {
  const { vector, onPointerDown, onPointerMove, onPointerUp } = useJoystick();

  useEffect(() => {
    onVectorChange(vector);
  }, [vector, onVectorChange]);

  return (
    <div
      data-testid="joystick-base"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
      style={{
        position: "fixed",
        bottom: 24,
        left: 24,
        width: 120,
        height: 120,
        borderRadius: "50%",
        background: `${P3.surface}B3`,
        border: `2px solid ${P3.ink}`,
        touchAction: "none",
      }}
    >
      <div
        data-testid="joystick-thumb"
        style={{
          position: "absolute",
          left: `${50 + vector.x * 35}%`,
          top: `${50 + vector.z * 35}%`,
          transform: "translate(-50%, -50%)",
          width: 44,
          height: 44,
          borderRadius: "50%",
          background: P3.hudAction,
        }}
      />
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- Joystick.test.tsx`
Expected: PASS

- [ ] **Step 5: Write the failing test for `WorldHud`**

```typescript
// src/world/hud/WorldHud.test.tsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import WorldHud from "./WorldHud";

describe("WorldHud", () => {
  it("shows both language dots, highlighting the active one", () => {
    const { rerender } = render(<WorldHud activeLang="en" />);
    expect(screen.getByTestId("hud-dot-en")).toHaveAttribute("data-active", "true");
    expect(screen.getByTestId("hud-dot-vi")).toHaveAttribute("data-active", "false");

    rerender(<WorldHud activeLang="vi" />);
    expect(screen.getByTestId("hud-dot-en")).toHaveAttribute("data-active", "false");
    expect(screen.getByTestId("hud-dot-vi")).toHaveAttribute("data-active", "true");
  });

  it("shows neither dot active when no language is playing", () => {
    render(<WorldHud activeLang={null} />);
    expect(screen.getByTestId("hud-dot-en")).toHaveAttribute("data-active", "false");
    expect(screen.getByTestId("hud-dot-vi")).toHaveAttribute("data-active", "false");
  });
});
```

- [ ] **Step 6: Run test to verify it fails, then implement**

```typescript
// src/world/hud/WorldHud.tsx
import { P3 } from "../materials/palette3d";

export interface WorldHudProps {
  activeLang: "en" | "vi" | null;
}

// Mirrors the 2D Discover's bilingual dot cue (DESIGN_SPEC_3D.md §3) — purely visual,
// no new logic, fires in sync with whatever the audio pipeline is actually playing.
export default function WorldHud({ activeLang }: WorldHudProps) {
  return (
    <div style={{ position: "fixed", top: 16, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 8 }}>
      <span
        data-testid="hud-dot-en"
        data-active={activeLang === "en"}
        style={{
          width: 10,
          height: 10,
          borderRadius: "50%",
          background: activeLang === "en" ? P3.hudAction : `${P3.ink}40`,
        }}
      />
      <span
        data-testid="hud-dot-vi"
        data-active={activeLang === "vi"}
        style={{
          width: 10,
          height: 10,
          borderRadius: "50%",
          background: activeLang === "vi" ? P3.hudAction : `${P3.ink}40`,
        }}
      />
    </div>
  );
}
```

- [ ] **Step 7: Run test to verify it passes**

Run: `npm run test -- WorldHud.test.tsx`
Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add src/world/hud/
git commit -m "feat: add touch joystick DOM overlay and bilingual HUD cue"
```

---

### Task 11: WebGL fallback and loading state

**Files:**
- Create: `src/world/WorldFallback.tsx`
- Test: `src/world/WorldFallback.test.tsx`
- Create: `src/world/LoadingCube.tsx`

**Interfaces:**
- Produces (used by Task 12's `WorldCanvas.tsx`):
```typescript
export function isWebGLAvailable(): boolean;
export default function WorldFallback(): JSX.Element; // WorldFallback.tsx
export default function LoadingCube(): JSX.Element; // LoadingCube.tsx — R3F Suspense fallback, no DOM
```

- [ ] **Step 1: Write the failing tests**

```typescript
// src/world/WorldFallback.test.tsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import WorldFallback, { isWebGLAvailable } from "./WorldFallback";

describe("isWebGLAvailable", () => {
  afterEach(() => vi.restoreAllMocks());

  it("returns true when the canvas can produce a webgl context", () => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({} as RenderingContext);
    expect(isWebGLAvailable()).toBe(true);
  });

  it("returns false when getContext returns null for webgl", () => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
    expect(isWebGLAvailable()).toBe(false);
  });
});

describe("WorldFallback", () => {
  it("renders a legible message, never a blank screen", () => {
    render(<WorldFallback />);
    expect(screen.getByText(/3d graphics/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- WorldFallback.test.tsx`
Expected: FAIL — `src/world/WorldFallback.tsx` does not exist.

- [ ] **Step 3: Implement**

```typescript
// src/world/WorldFallback.tsx
import { P3 } from "./materials/palette3d";

export function isWebGLAvailable(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return !!(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

// Never a blank screen on WebGL-unavailable/context-lost (DESIGN_SPEC_3D.md §7.6) — this is
// a signal to investigate, not a permanent supported fallback path.
export default function WorldFallback() {
  return (
    <div
      style={{
        display: "flex",
        height: "100%",
        width: "100%",
        alignItems: "center",
        justifyContent: "center",
        background: P3.surface,
        color: P3.ink,
        fontFamily: "Lexend, sans-serif",
        textAlign: "center",
        padding: 24,
      }}
    >
      This game needs a browser with 3D graphics support.
    </div>
  );
}
```

```typescript
// src/world/LoadingCube.tsx
import { P3 } from "./materials/palette3d";

// R3F Suspense fallback — renders inside the Canvas, so DOM elements aren't valid here.
// M1 is entirely procedural geometry (no loaded assets), so this is essentially unreachable
// in practice, but required for forward-compatibility with future loaded assets (DESIGN_SPEC_3D.md §7.6).
export default function LoadingCube() {
  return (
    <mesh>
      <boxGeometry args={[0.5, 0.5, 0.5]} />
      <meshBasicMaterial color={P3.glow} />
    </mesh>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- WorldFallback.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/world/WorldFallback.tsx src/world/WorldFallback.test.tsx src/world/LoadingCube.tsx
git commit -m "feat: add WebGL-unavailable fallback and Suspense loading state"
```

---

### Task 12: Scene assembly and Canvas root

**Files:**
- Create: `src/world/Scene.tsx`
- Test: `src/world/Scene.test.tsx`
- Create: `src/world/WorldCanvas.tsx`
- Test: `src/world/WorldCanvas.test.tsx`

**Interfaces:**
- Consumes: everything from Tasks 1–11
- Produces (used by Task 13's `App.tsx`):
```typescript
export interface WorldCanvasProps { sessionId: string }
export default function WorldCanvas(props: WorldCanvasProps): JSX.Element;
```

- [ ] **Step 1: Write the failing test for `Scene`**

```typescript
// src/world/Scene.test.tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import "fake-indexeddb/auto";
import ReactThreeTestRenderer from "@react-three/test-renderer";
import Scene from "./Scene";
import { db } from "../data/db";

vi.mock("../audio/manifest", () => ({
  getItemAudio: vi.fn().mockReturnValue({ en: { src: "/audio/en_letter-A.mp3" }, vi: { src: "/audio/vi_letter-A.mp3" } }),
  playSequential: vi.fn().mockResolvedValue(undefined),
}));

describe("Scene", () => {
  beforeEach(async () => {
    await db.attempts.clear();
    await db.mastery.clear();
  });

  it("mounts the cub, world dressing, and the letter-A monument together without crashing", async () => {
    const renderer = await ReactThreeTestRenderer.create(<Scene sessionId="s1" />);
    const cub = renderer.scene.children[0].allChildren.find((n) => n.props?.["data-testid"] === "voxel-cub");
    const monument = renderer.scene.children[0].allChildren.find(
      (n) => n.props?.["data-testid"] === "letter-monument"
    );
    expect(cub).toBeDefined();
    expect(monument).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- Scene.test.tsx`
Expected: FAIL — `src/world/Scene.tsx` does not exist.

- [ ] **Step 3: Implement**

```typescript
// src/world/Scene.tsx
import { useState } from "react";
import { P3 } from "./materials/palette3d";
import WorldDressing from "./entities/WorldDressing";
import VoxelCub from "./entities/VoxelCub";
import LetterMonument from "./discover/LetterMonument";
import { useCharacterController } from "./rig/useCharacterController";
import { useChaseCamera } from "./rig/useChaseCamera";
import type { JoystickVector } from "./rig/useJoystick";

export interface SceneProps {
  sessionId: string;
  joystickVector?: JoystickVector;
}

const MONUMENT_POSITION = { x: 0, z: -10 };
const ZERO_VECTOR: JoystickVector = { x: 0, z: 0, magnitude: 0 };

// Owns the single frame-tick chain: joystick -> controller -> cub/camera (DESIGN_SPEC_3D.md
// §7.1/§8). Milestone 1 assembles exactly one monument (letter A) per the approved phasing.
export default function Scene({ sessionId, joystickVector = ZERO_VECTOR }: SceneProps) {
  const character = useCharacterController(joystickVector);
  useChaseCamera(character);

  return (
    <>
      {/* Unlit gradient skydome — DESIGN_SPEC_3D.md §2, never drei's <Sky> (too heavy). */}
      <mesh scale={[-1, 1, 1]}>
        <sphereGeometry args={[80, 16, 16]} />
        <meshBasicMaterial color={P3.skyTop} side={2} />
      </mesh>
      <WorldDressing />
      <VoxelCub position={character.position} heading={character.heading} speedNorm={character.speedNorm} />
      <LetterMonument
        itemId="letter-A"
        glyphChar="A"
        position={MONUMENT_POSITION}
        sessionId={sessionId}
        playerPosition={character.position}
      />
    </>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- Scene.test.tsx`
Expected: PASS

- [ ] **Step 5: Write the failing test for `WorldCanvas`**

```typescript
// src/world/WorldCanvas.test.tsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import "fake-indexeddb/auto";
import WorldCanvas from "./WorldCanvas";

vi.mock("../audio/manifest", () => ({
  getItemAudio: vi.fn().mockReturnValue({ en: { src: "/audio/en_letter-A.mp3" }, vi: { src: "/audio/vi_letter-A.mp3" } }),
  playSequential: vi.fn().mockResolvedValue(undefined),
}));

describe("WorldCanvas", () => {
  afterEach(() => vi.restoreAllMocks());

  it("renders the fallback message when WebGL is unavailable", () => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
    render(<WorldCanvas sessionId="s1" />);
    expect(screen.getByText(/3d graphics/i)).toBeInTheDocument();
  });

  it("renders the joystick overlay and canvas host when WebGL is available", () => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({} as RenderingContext);
    render(<WorldCanvas sessionId="s1" />);
    expect(screen.getByTestId("joystick-base")).toBeInTheDocument();
    expect(screen.getByTestId("world-canvas-host")).toBeInTheDocument();
  });
});
```

- [ ] **Step 6: Run test to verify it fails**

Run: `npm run test -- WorldCanvas.test.tsx`
Expected: FAIL — `src/world/WorldCanvas.tsx` does not exist.

- [ ] **Step 7: Implement**

```typescript
// src/world/WorldCanvas.tsx
import { Suspense, useState } from "react";
import { Canvas } from "@react-three/fiber";
import Scene from "./Scene";
import WorldFallback, { isWebGLAvailable } from "./WorldFallback";
import LoadingCube from "./LoadingCube";
import Joystick from "./hud/Joystick";
import WorldHud from "./hud/WorldHud";
import { P3 } from "./materials/palette3d";
import type { JoystickVector } from "./rig/useJoystick";

export interface WorldCanvasProps {
  sessionId: string;
}

// Canvas root — perf-critical config lives here (DESIGN_SPEC_3D.md §6/§7.1): dpr capped at
// 2, no shadow maps, no post-processing, exactly two lights.
export default function WorldCanvas({ sessionId }: WorldCanvasProps) {
  const [joystickVector, setJoystickVector] = useState<JoystickVector>({ x: 0, z: 0, magnitude: 0 });

  if (!isWebGLAvailable()) {
    return <WorldFallback />;
  }

  return (
    <div style={{ position: "relative", height: "100%", width: "100%" }} data-testid="world-canvas-host">
      <Canvas
        dpr={[1, 2]}
        gl={{ antialias: true, powerPreference: "high-performance" }}
        camera={{ fov: 55, near: 0.1, far: 120 }}
      >
        <fogExp2 attach="fog" args={[P3.skyHorizon, 0.012]} />
        <hemisphereLight args={[P3.skyTop, P3.grass, 0.9]} />
        <directionalLight position={[6, 10, 4]} intensity={0.85} castShadow={false} />
        <Suspense fallback={<LoadingCube />}>
          <Scene sessionId={sessionId} joystickVector={joystickVector} />
        </Suspense>
      </Canvas>
      <Joystick onVectorChange={setJoystickVector} />
      <WorldHud activeLang={null} />
    </div>
  );
}
```

- [ ] **Step 8: Run test to verify it passes**

Run: `npm run test -- WorldCanvas.test.tsx`
Expected: PASS

- [ ] **Step 9: Commit**

```bash
git add src/world/Scene.tsx src/world/Scene.test.tsx src/world/WorldCanvas.tsx src/world/WorldCanvas.test.tsx
git commit -m "feat: assemble the Milestone 1 scene and Canvas root with WebGL fallback"
```

---

### Task 13: Wire into App.tsx and final verification

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/App.test.tsx`

**Interfaces:**
- Consumes: `WorldCanvas` (Task 12)

- [ ] **Step 1: Read the current `App.tsx` and `App.test.tsx` before changing anything**

Confirm the current structure (session ID generation, `ParentGate`/`ParentDashboard` wiring) so this change touches only the `StarterVillageMap` render path, not the parent-facing surfaces.

- [ ] **Step 2: Update the failing/changing test first**

```typescript
// src/App.test.tsx — add this alongside (not replacing) the existing app-shell test
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import "fake-indexeddb/auto";
import App from "./App";

vi.mock("../audio/manifest", () => ({
  getItemAudio: vi.fn().mockReturnValue({ en: { src: "/audio/en_letter-A.mp3" }, vi: { src: "/audio/vi_letter-A.mp3" } }),
  playSequential: vi.fn().mockResolvedValue(undefined),
}));

describe("App — Milestone 1 3D world entry", () => {
  it("renders the 3D world canvas host as the default screen", () => {
    render(<App />);
    expect(screen.getByTestId("app-shell")).toBeInTheDocument();
    expect(screen.getByTestId("world-canvas-host")).toBeInTheDocument();
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm run test -- App.test.tsx`
Expected: FAIL — `App.tsx` still renders `StarterVillageMap`, not `WorldCanvas`.

- [ ] **Step 4: Wire `WorldCanvas` in as the Milestone 1 entry point**

```typescript
// src/App.tsx — replace the non-dashboard branch's StarterVillageMap render with WorldCanvas.
// The 2D StarterVillageMap import and starterVillagePack import can stay (not deleted — this
// is a Milestone 1 entry-point swap, not a removal of the 2D app), but the default render
// path now shows the 3D world per the approved phasing (docs/superpowers/specs/2026-07-11-3d-world-redesign-design.md).
import WorldCanvas from "./world/WorldCanvas";
// ... keep existing imports (ParentGate, ParentDashboard, useMemo, useState) ...

export default function App() {
  const sessionId = useMemo(() => crypto.randomUUID(), []);
  const [dashboardOpen, setDashboardOpen] = useState(false);

  return (
    <div data-testid="app-shell" className="h-screen w-screen bg-[var(--surface)] text-[var(--ink)] font-ui">
      {dashboardOpen ? (
        <ParentDashboard onClose={() => setDashboardOpen(false)} />
      ) : (
        <>
          <WorldCanvas sessionId={sessionId} />
          <ParentGate onUnlock={() => setDashboardOpen(true)} />
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm run test -- App.test.tsx`
Expected: PASS

- [ ] **Step 6: Run the FULL test suite**

Run: `npm run test`
Expected: every existing test (55 baseline + all new tests from Tasks 1–13) passes. If any existing `StarterVillageMap`-specific test now fails because it's no longer the default `App` render, that test was asserting on the old entry point — leave `StarterVillageMap.test.tsx` itself untouched (it still tests the component directly, which still exists and works), only `App.test.tsx`'s app-level assertions should change.

- [ ] **Step 7: Run the production build**

Run: `npm run build`
Expected: succeeds. Note the new bundle size — `three`/`@react-three/fiber`/`@react-three/drei` are a real addition to the main bundle; if the gzipped main chunk grows substantially, check whether `three` should be split into its own lazy chunk the same way `phaser` was (Phase 2's perf fix precedent) — if the increase is large, add this as a follow-up note rather than silently shipping a regression, but do not attempt the code-split within this task unless it's trivial (it may not be, since the 3D world is now the default entry screen, not a lazily-entered activity like Phaser's Challenge was).

- [ ] **Step 8: Commit**

```bash
git add src/App.tsx src/App.test.tsx
git commit -m "feat: wire the 3D world as Milestone 1's default entry screen"
```

- [ ] **Step 9: Report honestly — this is NOT "done" from a green suite alone**

Per `DESIGN_SPEC_3D.md` §10 and this plan's Global Constraints: every test above proves wiring — that the right functions get called, that components mount, that pure math is correct. **None of it proves real frame rate, real touch-joystick feel, or real visual quality on the actual Samsung tablet.** State this explicitly in the final report. The plan's true Definition of Done (per `DESIGN_SPEC_3D.md` §12) is not satisfied by this task list alone — it requires John opening the deployed build on his physical tablet and confirming it runs at a real, playable frame rate. Do not report Milestone 1 as complete without that on-device check.

---

## Self-Review Notes (per the writing-plans skill's required self-check)

**Spec coverage:** palette/toon material (Task 1) ✓. Collision/bounds (Task 2) ✓. Glyph geometry (Task 3) ✓. Joystick (Task 4) ✓. Character controller (Task 5) ✓. Chase camera with reduced-motion collapse (Task 6) ✓. Voxel Cub (Task 7) ✓. World dressing/bounds fence (Task 8) ✓. E3 monument assembly + audio + recordAttempt (Task 9) ✓. HUD joystick + bilingual dots (Task 10) ✓. WebGL fallback + loading (Task 11) ✓. Scene/Canvas assembly with perf-budget config (Task 12) ✓. App entry wiring (Task 13) ✓. The one deliberately-not-automatable item — real on-device performance — is explicitly called out as the true acceptance gate in Task 13 Step 9, not silently assumed.

**Placeholder scan:** no TBD/TODO/"add appropriate" language; every code step has complete, runnable code; Task 1 Step 8 is the one intentional branch point (jsdom's real behavior with raw `three` construction can't be known until run), and it gives a complete alternative implementation, not a vague fallback instruction.

**Type consistency:** `JoystickVector { x, z, magnitude }` defined once in Task 4, consumed identically in Tasks 5, 6 (via `CharacterState`), 10, 12, 13. `CharacterState`/character controller's `{ position: {x,z}, heading, speedNorm }` shape defined in Task 5, consumed identically by `VoxelCub` (Task 7) and `useChaseCamera` (Task 6) and `Scene` (Task 12). `recordAttempt(itemId, activityType, correct, sessionId, nowMs?)` called in Task 9 with the exact existing signature from `src/data/db.ts` — verified against the real file before writing this plan, not assumed. `getGlyphCubePositions(glyphChar): CubePosition[]` defined Task 3, consumed identically in Task 9.
