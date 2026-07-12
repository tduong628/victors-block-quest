# DESIGN_SPEC_3D.md — Victor's Block Learning Quest · 3D World

> Locked art direction for the **Brookhaven-energy 3D world redesign**. Authored by **Aura**. Implemented by **NEO** against the existing, already-passing codebase — this adds a **new React Three Fiber rendering/interaction layer** on top of untouched data/mastery/audio/Phaser logic.
>
> This is a companion to (not a replacement for) `DESIGN_SPEC.md`. The 2D spec still governs: typography (Andika/Lexend), the audio pipeline, the Parent Data Room, and all the untouched tested logic. This document governs everything inside the new 3D world.

**Locked by John — 2026-07-11**

| Dimension | Choice | Notes |
|---|---|---|
| **A — Character** | **A3 · Voxel Cub** | non-humanoid mascot; sidesteps avatar-proportion IP risk; brandable later |
| **B — World** | **B1 · Toy Village Green** | bright grassy toy-diorama plateau, flat-shaded, bounded |
| **C — Color** | **C1 · Faithful Dusk 3D** | **considered trade-off** — see §1.1 |
| **D — Camera & feel** | **D3 · Snappy Arcade Chase** | energetic follow-cam, FOV kick + catch-up lag + bounce |
| **E — Monument** | **E3 · Block-Build Monument** | cubes fly in and snap into the glyph on approach |

---

## 0. Implementation Constraints (READ FIRST — NEO)

The scope, tech decisions, and phasing here are the approved design spec at
`docs/superpowers/specs/2026-07-11-3d-world-redesign-design.md`. That doc is binding; this one is the visual/technical execution of it. Key inherited rules:

1. **Do not touch the untouchable.** `src/data/*` (db, mastery, pickDistractors, lessonPacks), `src/audio/manifest.ts`, `src/game/ChallengeScene.ts` + `scoreCollectible.ts`, `ParentGate.tsx`, `ParentDashboard.tsx` are frozen. The new 3D components **call into** these exact functions (`recordAttempt`, `getItemAudio`/`playSequential`, `pickDistractors`) — presentation is new, logic is reused.
2. **No physics engine.** Movement + collision is hand-rolled (distance checks + AABB clamp). No `@react-three/rapier`.
3. **New deps only:** `three`, `@react-three/fiber`, `@react-three/drei`. Nothing else.
4. **Tablet-first, WebGL-in-Chrome.** Every choice below is constrained by the perf budget in §6. Low-poly is a *requirement*, not a style.
5. **Milestone 1 = ONE landmark (letter A).** §7 gives the concrete build for it. Do not build the other 9 items or the other activities in M1. M1 ends with **John testing on the real Samsung tablet** before anything scales.
6. **Preserve the existing test suite** (41 unit + 2 e2e). New pure modules get new unit tests (§8). Follow the existing `vi.mock` pattern for engine code.

### 1.1 The C1 trade-off — read this, it's the governing design thesis

John chose **C1 Faithful Dusk 3D** (muted brand palette) *and* **D3 Snappy Arcade Chase** (high-energy camera). Aura's options pass flagged that C1 "likely undersells the bright/energetic ask"; that warning was relayed to John before he locked it. His informed answer: *"stick with faithful dusk, if I don't like it, I can change later."* This is a considered choice, not an oversight.

**How the two reconcile — the thesis NEO must build to:**
> **Energy lives in motion, not chroma.** The muted dusk palette is the calm, cohesive storybook *canvas*. The game-alive "Brookhaven energy" comes entirely from **kinetics** — the D3 chase-cam FOV kicks and bounce, the E3 cube-assembly, the brick-burst particles, and the cub's squash-waddle. This is a deliberate, sophisticated pairing (premium indie titles like *Alto's Odyssey* pair restrained palettes with kinetic feel). Do not "helpfully" brighten the palette to compensate for the muted hues — the motion is doing that job.

**Open door (document, don't act on):** if, once built and on-device, the world reads too flat/quiet, the sanctioned next move is a palette-only pass toward C2 "Storybook Noon" (saturation/value up, same hue families) — nothing else in this spec changes. Keep the palette isolated in one module (§2, `palette3d.ts`) so that future swap is a one-file edit.

---

## 2. Color & Material System (C1 Faithful Dusk 3D)

3D materials consume hex constants, not CSS variables. Author these in **`src/world/materials/palette3d.ts`** — the single source of truth for the 3D world. Hues are the locked Storybook Dusk brand families, lifted only ~10–15% in saturation/value for 3D (flat/toon shading eats a little chroma), plus a **new sky** the flat 2D map never needed.

```ts
// src/world/materials/palette3d.ts — 3D world palette (C1 Faithful Dusk)
export const P3 = {
  // --- Sky (new — dusk-warm, NOT bright noon blue) ---
  skyTop:      '#A9C7D0',  // muted dusk blue (skydome top)
  skyHorizon:  '#F2D9C4',  // warm cream-peach (skydome horizon + fog color)

  // --- Ground / world (B1 toy village, dusk-muted) ---
  grass:       '#5F9E7E',  // muted sage-spring green (teal-pine family, lifted)
  grassLit:    '#72B08D',  // toon top band
  grassShade:  '#4C8168',  // toon shadow band
  path:        '#EBDCBF',  // muted cream sand (from --surface-sunken)
  fence:       '#C9B490',  // warm tan fence posts (world-bound marker)
  cloud:       '#FBF3E4',  // warm cream-white

  // --- Trees / set dressing ---
  foliage:     '#316B60',  // teal-pine 600 (deep, reads as dusk foliage)
  foliageLit:  '#3D8577',  // teal-pine base as toon top band
  trunk:       '#8A5A3C',  // warm wood brown

  // --- Voxel Cub (terracotta = brand warmth) ---
  cubBody:     '#E89C86',  // --tc-300, dusk-lifted
  cubBelly:    '#FCEFC3',  // butter-100 cream muzzle/belly
  cubPaw:      '#C55E44',  // --tc-600 ears/paws
  cubEye:      '#3A2E28',  // cocoa ink

  // --- Letter Monument (single-hue for glyph legibility) ---
  glyph:       '#E07A5F',  // --tc-500 terracotta base
  glyphLit:    '#EFA88F',  // toon top band
  glyphShade:  '#B85A42',  // toon shadow band
  glyphEdge:   'rgba(58,46,40,0.22)', // cocoa seam
  plinth:      '#EBDCBF',  // cream sand base
  glow:        '#F2CC5B',  // butter — discover glow + brick-burst

  // --- Ink / HUD (2D overlay, reuse verified 2D tokens) ---
  ink:         '#3A2E28',  // cocoa — HUD text, 11.89:1 on cream (AAA)
  surface:     '#FBF3E4',  // cream — HUD panels
  hudAction:   '#C1502F',  // terracotta-ink — joystick thumb (white-on: 4.71:1)
} as const;
```

**Shading model — cheap toon, no real-time shadows (applies to every surface):**

- **Material:** one shared `MeshToonMaterial` per hue, driven by a tiny **3-band gradient map** (a 3×1 px `DataTexture`, `magFilter = NearestFilter`). This gives the sunlit top / soft-shadow side "dimensional low-poly" read at near-zero cost. Build it once in `toon.ts` and reuse — **never a unique material per object.**
- **Lights:** exactly two, both cheap, **no shadow maps**:
  - `<hemisphereLight args={[P3.skyTop, P3.grass, 0.9]} />` (sky/ground bounce)
  - `<directionalLight position={[6,10,4]} intensity={0.85} castShadow={false} />` (the "sun" that drives the toon bands)
- **Explicitly banned for perf:** shadow maps, env maps, reflections, PBR (`MeshStandardMaterial`), post-processing, per-object textures (beyond the shared 3-band ramp + one optional cloud alpha).
- **Fallback if toon proves costly:** flat `MeshBasicMaterial` (unlit) with baked per-face vertex colors (top lighter, sides darker). Looks nearly identical, zero lighting cost. Decide on-device in M1.

**Fog + sky:** `<fogExp2 color={P3.skyHorizon} density={0.012} />` for atmosphere + free draw-distance culling. Sky = a simple unlit two-stop vertical **gradient skydome** (skyTop → skyHorizon), a large back-face sphere or a `scene.background` gradient texture. **Do not use drei `<Sky>`** (atmospheric-scattering shader, too heavy for the tablet and wrong dusk mood).

---

## 3. Typography, Audio, Bilingual Cue (inherited — do not re-derive)

- **Fonts unchanged:** Andika (glyphs/headings), Lexend (all UI/HUD). Self-hosted, offline. See `DESIGN_SPEC.md` §3. The monument letterform derives from the **Andika "A"** so the child maps world-glyph → taught-glyph.
- **Audio unchanged:** the 3D Discover calls the existing pipeline — EN then VI — via the exact function names in `src/audio/manifest.ts` (`getItemAudio` / `playSequential` or the current equivalents; use what the module exports, do not rename). Never rebuild audio.
- **Bilingual visual cue:** mirror the 2D Discover — two dots on the HUD, EN lights then VI lights in time with playback. Purely visual, no logic change.

---

## 4. Character — Voxel Cub (A3)

A small, rounded, non-humanoid bear cub. Non-humanoid is the point: zero avatar-proportion copy risk, and a brandable mascot.

**Construction (M1 — procedural, rig-free):** compose from ~8–12 `<RoundedBox>` primitives, merged where static:
- body (1 rounded box) · head (1 larger rounded box) · 2 small ear boxes · 2 stub legs · 2 optional stub arms · cream muzzle + belly patch · 2 cocoa dot eyes · tiny nose.
- **Budget: < 500 tris.** Colors from `P3.cub*`.

**Animation (procedural in `useFrame`, NO skeleton for M1 — de-risks the milestone):**
- **Idle:** whole-body breathing sine-bob (Y position/scale); blink (eye Y-scale pinch) every 3–5 s.
- **Walk (waddle):** alternating side tilt (`rotation.z` sine keyed to a step phase) + a vertical bob + a light squash on each step; amplitude scales with speed. Legs may counter-rotate slightly.
- **Turn:** lerp the cub's `rotation.y` toward the current travel heading (never snap).
- All driven by the controller's speed magnitude (§5). A real skeletal rig is a *later-phase* option, not M1.

**IP guard:** rounded organic cub, not a boxy-limbed humanoid — structurally un-Roblox by construction. No branded accessories in M1.

---

## 5. Movement & Camera Rig

### 5.1 Joystick (touch, DOM overlay — not in the canvas)

`src/world/hud/Joystick.tsx` — a fixed bottom-left virtual stick. Base ~120px, thumb ≥ 44px (target-size floor). Base = `P3.surface` @ ~70% opacity + 2px cocoa ring; thumb = `P3.hudAction` fill. Outputs a **normalized 2D vector** each frame via `useJoystick.ts` (pure hook: pointer position → clamped unit vector + magnitude). Touch-first; no keyboard assumptions.

### 5.2 Character controller — `useCharacterController.ts`

- `velocity = joystickVec * MAX_SPEED` with short accel/decel ramps (feel, not physics).
- Integrate position each frame; **clamp to world AABB** (`collision.ts`, ±18 world units — the fence is the visual signal for this bound).
- Compute travel heading → feed cub turn + walk animation.
- Expose `speedNorm` (0–1) for the camera FOV kick and cub animation amplitude.

### 5.3 Chase camera — `useChaseCamera.ts` (D3 Snappy Arcade Chase)

Base follow: fixed offset behind + above the cub (start `(0, 4.5, 7)`), `lookAt` cub + a small forward lead. Layer the D3 energy on top:
- **FOV kick:** `camera.fov = lerp(BASE_FOV=55, KICK_FOV=62, speedNorm)`; call `updateProjectionMatrix()` when it changes. Speed feels faster without moving faster.
- **Catch-up lag:** damp camera position toward its target (spring/lerp, e.g. factor ~0.08) so a fast start briefly "leaves the camera behind," then it catches up — the core D3 game-feel.
- **Follow-bounce:** small vertical camera bob keyed to movement (low amplitude).

**Safety caps (non-negotiable — the player is 3):**
- Cap FOV-kick amplitude (≤ ~7° swing) and bounce amplitude conservatively; err gentle. Nausea risk is real at this age.
- **`prefers-reduced-motion` gate:** collapse D3 to a static cozy follow — fixed offset, **no FOV kick, no bounce, no catch-up lag** (kill, don't shorten). Route all three D3 parameters through a single `reducedMotion` flag from `matchMedia('(prefers-reduced-motion: reduce)')`, not just CSS.

---

## 6. Tablet Performance Budget (hard targets — Samsung tablet, Chrome WebGL)

| Concern | Target |
|---|---|
| Frame rate | 60fps goal · **30fps hard floor** on the real device |
| Draw calls | < ~60 (M1), < ~120 (full village) — **InstancedMesh** for grass/trees/clouds/monument cubes |
| Triangles | < ~50k (M1), headroom to ~150k (full village). Cub < 500 · tree < 200 · monument A ~300 |
| Materials | One shared toon material per hue. **No** per-object materials |
| Textures | Only the 3×1 toon ramp (+ 1 optional cloud alpha). No normal/rough/metal/env maps |
| Lights | 1 hemisphere + 1 directional, **shadow maps OFF** |
| Pixel ratio | `<Canvas dpr={[1, 2]}>` — **cap dpr at 2** (Samsung high-DPI at native 3x will tank fps) |
| Post-processing | **None** |
| Frame loop | Single `useFrame`; **no per-frame allocations** — reuse `Vector3`/`Quaternion` temporaries |
| Culling | `fogExp2` + frustum culling; keep the world small and bounded |

Merge static world geometry; instance all repeats. If M1 misses the 30fps floor on-device, that is the spec-sanctioned reassessment point (per the approved spec's Phasing) — try the `MeshBasicMaterial` vertex-color fallback (§2) and lower dpr before adding complexity elsewhere.

---

## 7. Milestone 1 — Concrete Build (letter "A" only)

Enough detail to build the real landmark, not placeholder guidance. One walkable cub, one grassy bounded world, one working native-3D E3 Discover on the letter A wired to the real audio pipeline. Nothing else.

### 7.1 Canvas + scene setup (`WorldCanvas.tsx`)
```tsx
<Canvas
  dpr={[1, 2]}
  gl={{ antialias: true, powerPreference: 'high-performance' }}
  camera={{ fov: 55, near: 0.1, far: 120 }}
>
  <fogExp2 attach="fog" args={[P3.skyHorizon, 0.012]} />
  <hemisphereLight args={[P3.skyTop, P3.grass, 0.9]} />
  <directionalLight position={[6, 10, 4]} intensity={0.85} />
  <Suspense fallback={<LoadingCube />}>
    <Scene />           {/* skydome, ground, props, cub, LetterMonument 'A' */}
  </Suspense>
</Canvas>
```
Skydome: unlit gradient (`P3.skyTop` → `P3.skyHorizon`). `<Scene>` runs the single `useFrame` that ticks controller → cub anim → camera.

### 7.2 Ground & world (`Ground.tsx`)
- Grass **plateau** ~40×40 units: a flat-shaded plane with 2–3 gentle low-poly hills (vertex-displaced), `P3.grass` toon. B1 toy-diorama read.
- **Fence border** (instanced tan posts, `P3.fence`) around the perimeter = the visual cue for the AABB bound at ±18 (cub stops before the fence).
- A `P3.path` cream strip leading from the cub's spawn to the monument.
- Minimal set dressing: 3–5 instanced low-poly trees (`P3.foliage`/`P3.trunk`), 3–4 drifting cloud billboards (`P3.cloud`, slow lateral loop). One or two optional toy houses are fine but not required for M1. Keep it sparse — perf headroom first.

### 7.3 Voxel Cub (`entities/VoxelCub.tsx`)
Per §4 — RoundedBox composition, `P3.cub*` colors, procedural idle/walk/turn. Spawn on the path facing the monument.

### 7.4 Letter Monument "A" — E3 assembly (`entities/LetterMonument.tsx` + `discover/glyphGeometry.ts` + `discover/useMonumentDiscover.ts`)

**Glyph geometry (`glyphGeometry.ts` — pure, unit-tested, generalizes to all letters/numbers later):**
- Define each glyph as a boolean mask grid (e.g. 5 wide × 7 tall) → emit the list of cube positions forming the letterform, extruded 1–2 cubes deep. The "A" mask yields ~20–30 cubes. Render as **one `InstancedMesh`** (instance per cube). ~300 tris.
- Single hue (`P3.glyph` + toon bands) so the **A silhouette stays unbroken and legible** from the chase-cam. Cocoa seam edge. This honors the 2D spec's rule: *legibility of the learning glyph outranks the 3D effect.*
- Plinth: a cream cube base (`P3.plinth`) on the ground.

**Rest state:** the monument's cubes are **dispersed** — a loose, slowly-bobbing "cloud of blocks" hovering above the plinth (clearly not-yet-a-letter).

**E3 discover sequence (`useMonumentDiscover.ts`), triggered when `distanceTo(monument) < TRIGGER_RADIUS` (~4 units) and not already discovered this approach:**
1. **Assemble:** each instanced cube flies from its scattered position to its target glyph position. Animate per-instance via lerp/spring in `useFrame`, updating the `InstancedMesh` matrices, with a **per-cube stagger**. Use the locked **Snap & Stack** feel (see `DESIGN_SPEC.md` §5 / `src/lib/animation.ts` — `snapSpring` stiffness ~320 damping ~24; `brickPop` for the final settle). The name "Block Quest" + the brand motion literally enact themselves here.
2. **Light up:** on full assembly, boost the glyph's emissive toward `P3.glow` (butter), fire a **brick-burst** (6–10 tiny instanced butter/terracotta cubes fly out + fade, `brickPop` stagger), and a small whole-glyph scale-bounce.
3. **Speak:** call the existing audio pipeline — EN then VI — for item `'A'`. Fire the HUD bilingual EN→VI dot cue **simultaneously** with playback (multi-sensory; §9).
4. **Record:** call the existing `recordAttempt(...)` with the same signature the 2D Discover used. No new mastery logic.
5. **Hysteresis / replay:** after first discovery, leave the A **assembled** (dimmed glow). Re-approach within a short cooldown replays the audio; it does not re-shatter. (Re-shatter/re-assemble on every approach is a later polish option, not M1.)

### 7.5 Camera (`useChaseCamera.ts`) — D3 per §5.3, with the reduced-motion + nausea caps.

### 7.6 Bounds, fallback, loading
- **Bounds:** hard AABB clamp (`collision.ts`), fence = the visual signal. A determined child cannot walk off the world.
- **WebGL fallback (`WorldFallback.tsx`):** on WebGL-unavailable or context-lost, render a cream card + cocoa Lexend message ("This game needs a browser with 3D graphics") — never a blank screen. Not a permanent degrade path; it's a signal to investigate (per approved spec §Error handling).
- **Loading:** M1 is essentially all procedural geometry + the tiny toon ramp, so load is trivial — still wrap in `<Suspense>` for future assets. Fail-silent on any optional asset (log + skip), matching the audio manifest's "never fail loud" philosophy.

---

## 8. React Three Fiber Component Structure

```
src/world/                       # NEW — the entire 3D layer
  WorldCanvas.tsx                # <Canvas> root: renderer, camera, lights, fog, Suspense, fallback
  Scene.tsx                      # assembles world; owns the single useFrame tick
  rig/
    useJoystick.ts               # touch joystick -> unit vector + magnitude   (pure)
    useCharacterController.ts    # joystick -> position, turn, accel/decel, bounds, speedNorm
    useChaseCamera.ts            # D3 follow: offset + damped catch-up + FOV kick + bounce
    collision.ts                 # clampToBounds(), distanceTo()               (pure, tested)
  entities/
    VoxelCub.tsx                 # character mesh + procedural idle/walk/turn
    Ground.tsx                   # grass plateau + hills + path + fence
    Trees.tsx  Clouds.tsx        # instanced set dressing
  discover/
    glyphGeometry.ts             # glyph mask grid -> cube positions           (pure, tested)
    LetterMonument.tsx           # instanced glyph cubes + plinth + E3 assembly
    useMonumentDiscover.ts       # proximity trigger -> assemble -> audio(EN,VI) -> recordAttempt
  hud/
    Joystick.tsx                 # DOM overlay touch control
    WorldHud.tsx                 # bilingual EN/VI dots, back affordance
  materials/
    palette3d.ts                 # P3 hex constants (3D token source of truth)  <- isolate for future C2 swap
    toon.ts                      # shared MeshToonMaterial factory + 3-band ramp
  WorldFallback.tsx  LoadingCube.tsx
```

**Bridge rule:** the 3D layer imports *from* the frozen modules and never modifies them. Milestone 2's Find-it will call `pickDistractors` for scattered wrong symbols; M1 does not need it.

---

## 9. Accessibility Floor (WCAG 2.2 — handled inline; palette carried from the 2D spec's verified ratios)

The 3D palette reuses the Storybook Dusk families already verified in `DESIGN_SPEC.md` §9. What's genuinely new is the touch-HUD and motion gating — specified here.

- **HUD text/contrast:** all 2D overlay text = cocoa `P3.ink` on cream `P3.surface` = **11.89:1 (AAA)**. Joystick thumb `P3.hudAction` (#C1502F) carries white at **4.71:1 (AA)**. No small text on raw terracotta/teal/butter fills (fill-only rule, unchanged).
- **Learning glyph is form-legible, not contrast-legible:** the monument is an actual extruded Andika "A" at architectural scale, single-hue, unbroken silhouette — recognition comes from shape + narration, **never color** ("find the A," never "the terracotta one").
- **Multi-sensory instruction (deaf/HoH):** every spoken cue fires a **simultaneous visual event** — the monument glow + HUD dot cue happen *with* the audio, not instead of it.
- **Reduced motion (`prefers-reduced-motion: reduce`) — kill, don't shorten:**
  - D3 camera → static cozy follow (no FOV kick, no bounce, no catch-up lag).
  - Monument assembly → cubes appear already-assembled (or a single 120ms fade), **no fly-in overshoot**.
  - Brick-burst particles → **cut entirely** (don't reduce count).
  - Gate on `matchMedia`, not only CSS.
- **Motion-sickness guard (age 3):** D3 amplitudes capped conservatively (§5.3) even with motion enabled.
- **Target sizes:** joystick thumb ≥ 44px; any HUD button ≥ 44px hit area.
- **WebGL fallback** is legible cocoa-on-cream Lexend, never a blank screen.

*(If, after the C2 palette-brightness door in §1.1 is ever opened, any hue changes value/saturation enough to affect a text pairing, re-verify that one pairing — the structural rules above are palette-independent.)*

---

## 10. Testing Strategy (honest — per approved spec §Testing)

jsdom cannot render WebGL; follow the existing `vi.mock('phaser', …)` precedent for engine code.

- **Unit-testable (write these):** `collision.ts` (clamp + distance), `glyphGeometry.ts` (A mask → correct cube count/positions), `useJoystick` vector math, the FOV-kick/`speedNorm` lerp. Pure functions, engine-independent.
- **Mount test:** `WorldCanvas` mounts without crashing; `LetterMonument` receives item `'A'` and wires to `recordAttempt`. Proves wiring, not visuals.
- **NOT automatable — the real risk:** GPU frame rate, touch-joystick feel, visual quality. This project already ate two device-only bugs (#4 touch, #5 Challenge logic) that zero tooling caught. **Milestone 1 ends with John on the actual Samsung tablet** — that on-device look is the acceptance gate, not the CI run. Do not report M1 "done" from a green suite alone.

---

## 11. Milestone Roadmap (M1 detail is §7; later phases inherit from the approved spec)

- **M1 — this doc, §7.** One landmark (A), walkable Voxel Cub, D3 chase-cam, E3 Discover wired to real audio. Ship → **John tests on tablet** → reassess perf before scaling. If it reads too muted, open the §1.1 C2 door (palette-only).
- **M2 —** Find-it as native 3D (scattered wrong symbols via `pickDistractors`); lock any character/world refinements from M1's on-device learnings.
- **M3 —** Match-it (pedestal zone), Create-it (art-hut interior → unchanged 2D canvas), Challenge (re-skinned Phaser via `src/game/palette.ts`) as themed-zone transitions; all 10 Starter Village items present.
- **M4 —** polish, redeploy, full on-device re-test.

---

## 12. Definition of Done (M1 design acceptance)

- [ ] `palette3d.ts` is the isolated 3D palette (C1 dusk); one shared toon material per hue; **no shadow maps, no PBR, no post**.
- [ ] Voxel Cub built from RoundedBox primitives (< 500 tris), procedural idle/walk/turn, `P3.cub*` colors.
- [ ] Bounded grassy toy-village plateau (B1), fence = visual bound, AABB clamp holds against a determined child.
- [ ] Touch joystick (DOM overlay), thumb ≥ 44px, drives the cub.
- [ ] D3 chase-cam: FOV kick + catch-up lag + bounce, **amplitude-capped**, with a reduced-motion collapse to static follow.
- [ ] Letter "A" monument: dispersed cube cloud → **E3 fly-in assembly** (Snap & Stack feel) → butter glow + brick-burst → **EN then VI audio via the existing pipeline** → `recordAttempt` called.
- [ ] Bilingual EN→VI HUD dot cue fires **simultaneously** with audio.
- [ ] WebGL fallback message (no blank screen); Suspense loading wrapper.
- [ ] New pure modules unit-tested; existing 41 unit + 2 e2e tests still green; no contract weakened.
- [ ] **Hits ≥ 30fps on John's real Samsung tablet** — the true acceptance gate. Perf shortfall → try MeshBasicMaterial vertex-color fallback + lower dpr before anything else.
- [ ] §9 accessibility floor honored: reduced-motion kill (camera + assembly + particles), target sizes, multi-sensory discover, form-not-color glyph legibility.
