# Brookhaven-Style 3D World Redesign — Design Spec

## Context and goal

The current V1 vertical slice (Starter Village map + 5 lesson activities) is fully built, deployed, and working on John's real Samsung tablet — but John's son Victor doesn't want to play it. It reads as a flat, tap-through learning app, not a game. John wants the app upgraded to feel like Roblox's Brookhaven: a real 3D world Victor controls a character in and walks around, something he'll want to play, that happens to teach letters and numbers rather than something that visibly announces itself as an educational app first.

**IP boundary (unchanged from the original product spec, more binding now that the repo and site are public):** this must capture Brookhaven's *energy* — a bright, blocky, low-poly 3D world with a controllable character and a sense of place — without reproducing Brookhaven's specific name, logo, house designs, or any Roblox-owned assets. The visual style should read as "an original game in the same genre," the same posture the existing Storybook Dusk / Voxel design already took toward Minecraft.

## Scope decision

Three approaches were considered:

- **A — True 3D world** (React Three Fiber): a real 3D scene with a joystick-controlled character. Biggest build, most authentic to the ask.
- **B — Rich 2.5D isometric world** (extend the already-installed Phaser): a sprite-based character walking a hand-styled isometric village. Lower risk, lower ceiling.
- **C — B now, A later**: ship the cheaper version first, decide on full 3D based on Victor's real reaction.

**John chose A.** This is explicitly a larger undertaking than the entire V1 build — a new rendering/interaction engine layer on top of an already-complete, tested application — and is being scoped and phased accordingly (see Phasing below), not attempted as a single pass.

## Activity-to-3D mapping

This was the key open design question, discussed and approved with John directly. Not every activity needs to be a literal open-world 3D interaction — real Brookhaven-style games constantly transition into focused interior/mini-game moments (walk through a door → interior loads), so this is genre-authentic, not a compromise.

| Activity | Treatment | Why |
|---|---|---|
| **Discover** | Native 3D | Walking up to a giant glowing 3D letter/number monument triggers it to light up, animate, and speak (EN then VI) directly in the open world. Lowest risk, highest "feels like a real game" payoff. |
| **Find-it** | Native 3D | A few wrong symbols spawn scattered near the monument after Discover; Victor runs and touches the correct one. Walking *is* the interaction — reuses `pickDistractors` for which wrong symbols spawn. |
| **Match-it** | Themed pedestal zone | A contained interaction near the monument, styled to match the 3D world visually, but not free-roam. |
| **Create-it** (drawing) | Themed interior ("art hut") | Fundamentally needs a flat 2D drawing surface regardless of engine — the entrance/framing feels like part of the world; the canvas itself is unchanged. |
| **Challenge** (collect) | Existing Phaser mini-game, re-skinned, triggered by entering a "collect zone" | This exact mechanic was fixed twice in the days immediately before this redesign (touch input via Scale Manager; the early-finish-on-correct-pick logic). Rebuilding it as a native 3D interaction would re-risk both fixes for a mostly-cosmetic win. Reused as-is, just visually re-themed to fit. |

**Net result:** 2 of 5 activities become genuinely native to the 3D world; 3 become focused moments within it, one of which is untouched game logic. This is the deliberate risk/reward split — it delivers the real "walk around and discover things" feeling without re-risking hard-won, tested mechanics.

## Technical architecture

**New dependencies:**
- `three` — core 3D rendering
- `@react-three/fiber` — React renderer for Three.js; keeps the 3D world as ordinary React components, consistent with the rest of the app
- `@react-three/drei` — camera controls, 3D text, common helpers, avoids hand-rolling primitives that already exist

**Explicitly NOT adding:** a physics engine (e.g. `@react-three/rapier`). "Walk around a small world without clipping through simple geometric shapes" doesn't need real physics simulation — a lightweight custom collision check (distance-to-landmark or axis-aligned bounding box) is lighter to run on a tablet browser, more predictable to test, and easier to reason about than integrating a full physics engine for this use case.

**Character movement:** an on-screen virtual joystick (touch-first — there is no keyboard on a tablet). Movement updates the character's position each frame; camera follows at a fixed offset (simple third-person or slightly-elevated follow-cam, exact framing to be locked with Aura during the art-direction pass).

**What stays completely untouched — the core risk-reduction principle of this whole redesign:**
- `src/data/db.ts`, `src/data/mastery.ts`, `src/data/pickDistractors.ts`, `src/data/lessonPacks/` — all Dexie/mastery/content logic
- `src/audio/manifest.ts` — audio playback and the `BASE_URL` path-resolution fix
- `src/game/ChallengeScene.ts`, `src/game/scoreCollectible.ts` — the just-fixed Phaser Challenge logic
- `ParentGate.tsx`, `ParentDashboard.tsx` — parent-facing surfaces, entirely out of scope for this redesign

New 3D components call into these exact same functions (`recordAttempt`, `getItemAudio`/`playSequential`, `pickDistractors`, etc.) — only the *presentation* layer for Discover, Find-it, and the world/character is new. This mirrors the exact principle Aura's earlier redesign followed (restyle existing tested logic, don't rewrite it), applied one layer deeper.

**World scope for V1 of this redesign:** just the existing Starter Village content — 10 landmarks (letters A–E, numbers 0–4) in one small explorable area. Not an attempt to build out the other five zones from the original product plan (Alphabet Forest, Number Mine, Creative Studio, Dance Stage, Skyline Swing) at the same time — those remain future phases, unchanged from the original plan doc's roadmap.

## Art direction

Not decided in this spec. Once this design is approved, a fresh Aura design pass is needed specifically for the 3D world — character design, world/landmark visual style, color direction for a "blocky, bright, low-poly Roblox-adjacent" look. The existing Storybook Dusk palette and Voxel tile system were designed for a flat 2D map and will likely inform but not directly transfer to a true 3D scene (lighting, material, and proportions work differently in 3D than in CSS clip-path faces).

## Testing strategy — stated honestly given this project's actual history

jsdom cannot render real WebGL, the same way it was never able to render real Phaser — the existing codebase already handles this via `vi.mock("phaser", ...)` for logic-only tests. The same pattern applies here:

- **Fully unit-testable:** movement math, zone-trigger/collision-distance calculations, and every piece of reused logic (`pickDistractors`, `recordAttempt`, mastery calculation) — these are pure functions independent of the rendering engine.
- **Testable but limited:** that the React Three Fiber component tree mounts without crashing, that the right landmarks/props are passed — proves wiring, not visual correctness or real performance.
- **NOT testable in any automated sandbox:** actual 3D rendering quality, frame rate/performance on a real tablet GPU, and touch-joystick feel. This project has already hit two device-only bugs (#4 touch input, #5 Challenge completion logic) that zero automated tooling caught — a 3D world raises this risk further, not lower. **Every phase of this build ends with an actual look in a browser, and Milestone 1 specifically ends with John testing on the real tablet before any further content is built** (see Phasing).

## Error handling

- **WebGL unavailable/context lost:** rare on a modern tablet but not impossible — detect and show a clear fallback message rather than a blank screen. (Does not need to gracefully degrade to the old 2D map — if this happens, it's a signal to investigate, not a supported permanent fallback path.)
- **Character/camera out of bounds:** the world needs a hard boundary so a determined child can't walk the character off the edge of the explorable area into empty space.
- **Asset loading:** 3D models/textures should have a loading state; a failed load should not hard-crash the world (log and skip, matching the audio manifest's existing "fail silent, never fail loud" philosophy).

## Phasing

Detailed task-by-task breakdown belongs in the implementation plan (next step, via `writing-plans`), but the milestone shape is part of this design because it's the core risk-management strategy:

- **Milestone 1 — prove the core feel, on-device, before scaling.** One landmark (letter A) only. Walkable character via joystick, simple ground/world, one 3D "A" monument with a working native-3D Discover interaction wired to the real audio pipeline. Shipped and **tested by John on the actual tablet for real performance and feel** before any of the other 9 items or remaining activities get built.
- **Milestone 2** — Find-it added as a native 3D interaction; full character/world art direction locked with Aura.
- **Milestone 3** — Match-it, Create-it, and Challenge wired as themed-zone transitions; all 10 Starter Village items present in the world.
- **Milestone 4** — polish pass, redeploy, full on-device re-test of the complete experience (same discipline as the original V1 ship).

If Milestone 1 reveals real performance problems on the tablet (a genuine risk this spec does not paper over), that is the point to reassess before further investment — not after Milestone 3.

## What is explicitly out of scope for this redesign

- The other five zones from the original product plan (Alphabet Forest, Number Mine, Creative Studio, Dance & Celebration Stage, Skyline Swing Course)
- Avatar customization/cosmetics — not ruled out for later, but not part of this spec
- Any change to ParentGate, ParentDashboard, or the underlying data/mastery/audio logic
- Full A–Z / 0–20 content expansion — still gated behind validating this redesign works, same as it was gated behind V1 shipping
