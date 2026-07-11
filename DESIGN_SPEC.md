# DESIGN_SPEC.md — Victor's Block Learning Quest

> Locked design direction for the V1 Starter Village slice. Authored by **Aura** (design orchestrator). Implemented by **NEO** (Codex-backed) against the EXISTING, already-passing codebase — this is a **restyle/rebuild of built components, not a greenfield build**. See "Implementation Constraints" before touching anything.

**Locked by John — 2026-07-11**

| Dimension | Choice |
|---|---|
| Color | **A3 · Storybook Dusk** — terracotta / teal-pine / butter on cream paper, cocoa ink |
| Layout | **B1 · Isometric Village Path** — a winding voxel trail that reads as the start of a bigger world |
| Typography | **C3 · Schoolbook Clarity** — Andika (symbols/headings) + Lexend (UI/body/dashboard) |
| Motion | **D2 · Snap & Stack** — fast tactile springs, blocks snap into place, brick-burst rewards |
| Block language | **E1a · Voxel 3D** — pseudo-isometric shaded cubes with real depth |
| Parent tone | **E2b · Clean Data Room** — a stark, distinct adult analytics skin |

---

## 0. Implementation Constraints (READ FIRST — NEO)

This app is a **working Vite + React 18 + TypeScript + Tailwind PWA** with **41 passing unit tests (Vitest + RTL) and 2 passing Playwright e2e tests**. Your job is to apply the visual direction below **without breaking that coverage or the working logic**.

**Hard rules:**

1. **Do not delete or rewrite working logic.** `LessonRunner`, `StarterVillageMap`, the 5 activity components, `ParentGate`, `ParentDashboard`, the Dexie/mastery/lessonPack/audio modules, and `ChallengeScene.ts` all work. You are changing `className`, wrapping elements in Framer Motion, adding token CSS, and restructuring markup for the iso layout — **not** changing state, data flow, callbacks, or test contracts.
2. **Preserve every test contract.** The tests query specific hooks. Keep ALL of these intact — same element, same accessible name, same `data-testid`:
   - `data-testid`: `app-shell`, `discover-symbol`, `create-canvas`, `challenge-canvas-host`, `match-prompt`, `parent-math-question`, `parent-math-input`, `parent-gate-hold`, `village-node-<itemId>`, `dashboard-row-<itemId>`.
   - Accessible button names (do NOT bury these under an `aria-label` that adds words): `Continue`, `Submit`, `Save`, `Close`. Find-it choice buttons must expose the **bare symbol** as their accessible name (test matches `/^[A-Za-z0-9]$/`) — do not wrap the symbol in an aria-label like "Choose A". Match-it lowercase buttons must expose the bare lowercase letter (e.g. name `"a"`). Palette swatches must keep `aria-label={`color ${c}`}`.
   - The `crypto.randomUUID()` sessionId, the `onComplete`/`onLessonComplete` callback signatures, and the mastery status strings (`new`, `practicing`, `nearly_mastered`, `mastered`) are load-bearing — do not rename.
3. **Run the suite after each component.** `npm run test` must stay green. If a visual change forces a markup change a test asserts on, update the test **only** to match the new structure while preserving the same behavioral intent — never weaken an assertion to make it pass.
4. **Framer Motion is already a dependency.** Use it for all interactive motion. No raw CSS transitions on interactive elements (CSS `@keyframes` is fine for ambient/idle-only decorative motion). No GSAP.
5. **Offline-first / PWA.** All fonts and art must work offline after install. **Self-host the fonts** (see §3) — do not rely on a runtime Google Fonts fetch, and add the font files + any SVG art to the Workbox `globPatterns`. Update `theme_color` / `background_color` in the PWA manifest to the new palette (see §8).
6. **Tablet landscape is the primary target** (~1600×1000). Design there first; portrait is a graceful fallback, not the priority.
7. **Copy rules:** no em-dashes in UI copy. No emoji baked into customer/child-facing labels as the sole meaning-carrier (icons are fine, but never emoji-as-button-label without a text or aria name).

---

## 1. Design Tokens — CSS Custom Properties

Author these in `src/styles/tokens.css` (create it) and import once in `src/main.tsx` (or `index.css`). Everything downstream references the variable, never a raw hex. Tailwind can read them via `theme.extend.colors` mapping to `var(--…)` if you prefer utility classes, but the variables are the source of truth.

```css
:root {
  /* ---- Storybook Dusk — brand scales ---- */
  /* Terracotta (primary) */
  --tc-50:  #FBEEEA;
  --tc-100: #F6D9CF;
  --tc-200: #EFBBAB;
  --tc-300: #E89C86;
  --tc-400: #E48A70;
  --tc-500: #E07A5F;  /* base */
  --tc-600: #C55E44;
  --tc-700: #A24732;  /* text-safe on cream */
  --tc-800: #7D3626;
  --tc-900: #5A271B;

  /* Teal-pine (secondary) */
  --tp-50:  #E9F2F0;
  --tp-100: #C9E0DB;
  --tp-200: #9CC7BF;
  --tp-300: #6BA99E;
  --tp-400: #4E9689;
  --tp-500: #3D8577;  /* base */
  --tp-600: #316B60;
  --tp-700: #27544C;  /* text-safe on cream */
  --tp-800: #1F423B;
  --tp-900: #16302B;

  /* Butter (accent) */
  --bt-50:  #FEF9EA;
  --bt-100: #FCEFC3;
  --bt-200: #F9E294;
  --bt-300: #F5D66B;
  --bt-400: #F2CC5B;  /* base — accent fill only */
  --bt-500: #E6B733;
  --bt-600: #C8991E;
  --bt-700: #9E7717;  /* text-safe on cream */
  --bt-800: #6E5310;

  /* ---- Kid surface (cream paper) ---- */
  --surface:        #FBF3E4;  /* app background */
  --surface-raised: #FFFBF2;  /* cards / tiles top */
  --surface-sunken: #F3E8D3;  /* insets / canvas frame */
  --surface-line:   #E7D8BE;  /* hairline borders */

  /* ---- Ink (text on cream) ---- */
  --ink:      #3A2E28;  /* primary text / symbols — 11.89:1 on cream (AAA) */
  --ink-soft: #5C4B42;  /* secondary text */
  --ink-mute: #6F5C51;  /* tertiary labels */

  /* ---- Text-safe brand -ink tokens (VERIFIED — use these, not raw brand, for ANY text/small icon) ---- */
  --terracotta-ink: #C1502F;  /* white text on this fill: 4.71:1 PASS. Raw --tc-500 has NO compliant text pairing — fill-only. */
  --teal-ink:       #2E6B5E;  /* text on cream: 5.63:1 · white on this fill: 6.21:1. Raw --tp-500 is large/UI-only. */
  --teal-ink-deep:  #245349;  /* 7.91:1 on cream (AAA) — parent dashboard extra margin */

  /* ---- Mastery status (VERIFIED on BOTH cream + parent off-white, CVD-safe — always pair with a shape/glyph, never color alone) ---- */
  --status-new:        #4B5563;  /* slate — 6.85:1 cream · outline-only ring */
  --status-practicing: #B45309;  /* amber-700 — 4.55:1 cream · half-filled ring */
  --status-nearly:     #2E6B5E;  /* teal-ink — 5.63:1 cream · three-quarter ring */
  --status-mastered:   #15803D;  /* green-700 — 4.55:1 cream · filled ring + check/star glyph */

  /* ---- Parent "Clean Data Room" — distinct neutral skin ---- */
  --pd-bg:      #FAFAF9;  /* off-white desk (verified against status colors) */
  --pd-panel:   #FFFFFF;
  --pd-line:    #E6E4DE;
  --pd-ink:     #1C1B19;  /* near-black */
  --pd-ink-soft:#55534E;
  --pd-accent:  #27544C;  /* teal-pine 700, the ONE restrained data accent */

  /* ---- Voxel face shading (applied to any block's base hue) ---- */
  --voxel-top-lighten:  18%;  /* top face   */
  --voxel-side-darken:  16%;  /* right face  */
  --voxel-edge:         rgba(58, 46, 40, 0.16); /* cube seam line */
  --voxel-drop:         0 14px 0 -6px rgba(58, 46, 40, 0.18); /* grounded block shadow */

  /* ---- Focus (VERIFIED — halo+ring combo; single-accent rings failed 3:1 on the brand fills) ---- */
  /* kid surface:   box-shadow: 0 0 0 2px var(--surface), 0 0 0 5px var(--ink);   */
  /* parent surface: box-shadow: 0 0 0 2px var(--pd-bg),   0 0 0 5px var(--ink);  */
  --focus-inner: var(--surface);   /* inner spacer ring = the surface color */
  --focus-outer: var(--ink);       /* outer 3px ring = cocoa ink, reads on every brand color */

  /* ---- Type scale — Major Third 1.250, 16px root ---- */
  --text-xs:   0.64rem;
  --text-sm:   0.8rem;
  --text-base: 1rem;
  --text-lg:   1.25rem;
  --text-xl:   1.563rem;
  --text-2xl:  1.953rem;
  --text-3xl:  2.441rem;
  /* fluid hero steps (tablet-first) */
  --symbol-map:     clamp(2.5rem, 1rem + 6vw, 5rem);    /* map node symbol */
  --symbol-choice:  clamp(3rem, 1.5rem + 6vw, 5.5rem);  /* find-it / match-it choices */
  --symbol-hero:    clamp(8rem, 4rem + 20vw, 18rem);    /* Discover giant symbol */

  /* ---- Spacing — 4px base ---- */
  --space-1: 0.25rem; --space-2: 0.5rem;  --space-3: 0.75rem; --space-4: 1rem;
  --space-6: 1.5rem;  --space-8: 2rem;    --space-12: 3rem;   --space-16: 4rem;
  --space-24: 6rem;
  --safe-area: clamp(1.5rem, 3vw, 3rem);   /* map / screen padding */

  /* ---- Radii — chunky, block-consistent ---- */
  --radius-block: 18px;   /* voxel tiles / big buttons */
  --radius-card:  14px;
  --radius-pill:  999px;
  --radius-pd:    8px;     /* data room = tighter, more adult */

  /* ---- Motion (see §5 for Framer presets) ---- */
  --ease-snap: cubic-bezier(0.34, 1.30, 0.64, 1);  /* slight overshoot "snap" */
  --ease-crisp: cubic-bezier(0.20, 0, 0, 1);
  --dur-fast: 140ms;
  --dur-normal: 240ms;
}
```

---

## 2. Color Usage Rules (semantic, not decorative)

- **Cream (`--surface`) is the world.** The kid app background is warm paper, never dark, never white.
- **Cocoa ink (`--ink`) carries all kid-facing text and the giant symbols.** It is the only color allowed for the letters/numbers the child is learning — maximum legibility, AAA contrast.
- **Terracotta = primary action / warmth.** Used as a voxel fill, the "Continue/Save" affordance accent, and the `practicing` status. When terracotta is a background behind text, the text is cream or ink at large sizes only (see §9 — do not put small ink text on `--tc-500`).
- **Teal-pine = success / progress / focus.** `mastered` status, focus rings, the primary CTA button fill (`--tp-500` with cream text at button size ≥ 24px). It is the closest thing to "green/go" in this palette.
- **Butter = reward / highlight only.** Star bursts, "nearly there" status (`--bt-700` text), pennant flags on mastered tiles. Never a text color at base size on cream except the `--bt-700` shade.
- **The 6 canvas paint colors** (`#f87171 #fbbf24 #34d399 #38bdf8 #a78bfa #f472b6`) stay as-is on the coloring canvas — they are the child's crayons, not UI, and are exempt from the brand palette. But their **swatch buttons** need a visible selected-state ring (see §7 Create-it) and a ≥44px target.
- **Parent Data Room uses ONLY the `--pd-*` tokens.** No cream, no terracotta fills, no playful color. One teal-pine accent (`--pd-accent`) for data emphasis (bars, the active row, links). This surface must read as a different application.

---

## 3. Typography

**Fonts (self-hosted for offline):**
- **Andika** — symbols + headings. Early-literacy face: single-story `a`, tailed `g`/`l`, disambiguated `b/d/p/q` and `0/O`, `1/l`. This is a pedagogical choice: the child maps the on-screen glyph to what they're taught to write. Weights: 400, 700.
- **Lexend** — all UI, body, buttons, and the entire parent dashboard. Reading-proficiency-optimized, and clean/neutral enough to read "adult" on the Data Room surface. Weights: 400, 500, 600, 700.

Download the WOFF2 files into `public/fonts/` and declare `@font-face` with `font-display: swap`. Add `**/*.{woff2}` to the Workbox `globPatterns`. Preload `Andika-700` and `Lexend-600` in `index.html` (`<link rel="preload" as="font" crossorigin>`). Max two families — no third font.

**Roles:**

| Role | Font | Size token | Weight | Notes |
|---|---|---|---|---|
| Discover giant symbol | Andika | `--symbol-hero` | 700 | `text-align: center`, ink color, optical letter-spacing 0 |
| Map node symbol | Andika | `--symbol-map` | 700 | sits on the voxel top face |
| Find-it / Match-it choice | Andika | `--symbol-choice` | 700 | bare glyph = accessible name |
| Match-it prompt (`match-prompt`) | Andika | `--text-3xl` | 700 | uppercase cue |
| Screen title / zone label | Lexend | `--text-xl` | 600 | e.g. "Starter Village" |
| Button label | Lexend | `--text-lg` | 600 | Continue / Save / Submit |
| Body / helper | Lexend | `--text-base` | 400 | |
| Status pill (kid map) | Lexend | `--text-sm` | 600 | uppercase, tracking 0.04em |
| Dashboard H1 | Lexend | `--text-2xl` | 700 | Data Room |
| Dashboard table | Lexend | `--text-sm`/`--text-base` | 400/600 | **`font-variant-numeric: tabular-nums`** for accuracy/attempts columns |

Line-height: 1.15 for symbols/headings, 1.5 for body. Never letterspace the learning glyphs.

---

## 4. Layout — Isometric Village Path

**Primary viewport:** 1600×1000 landscape. `--safe-area` padding around the map.

**Concept:** The 10 items sit as voxel nodes along a serpentine iso trail that visibly **continues off-screen into locked zone gateways** — so the slice reads as the opening of a much bigger world (Alphabet Forest, Number Mine, Creative Studio, Dance & Celebration Stage, Skyline Swing Course all come later).

**Structure (replaces the current `grid grid-cols-5`):**

```
   ╔═══════════════════════════════════════════════╗
   ║  🏠 trailhead                    🌲 Alphabet    ║
   ║   ╲                                  Forest     ║
   ║    A ─ B ─ C                        (locked)    ║
   ║             ╲                                   ║
   ║   ⛏ Mine     D ─ E                              ║
   ║  (locked)         ╲                             ║
   ║                    0 ─ 1 ─ 2 ─ 3 ─ 4   🎤 Stage ║
   ║  🎨 Studio (locked)              (locked) 🕸 Swing║
   ╚═══════════════════════════════════════════════╝
```

**Implementation guidance:**
- The map is a **positioned layout**, not a uniform grid (kills the banned "equal card grid" look). Define node positions as `%` coordinates along the path in a `NODE_LAYOUT` array keyed by `itemId`; render each `village-node-<itemId>` as an absolutely-positioned `VoxelTile` inside a relative map container. Draw the connecting trail as an SVG `<path>` behind the nodes (dashed "stepping-block" stroke, `--surface-line` / `--tp-300`).
- **Letters (A–E)** ride the upper serpentine; **numbers (0–4)** ride the lower run. A small **home cabin** voxel sits at the trailhead (top-left).
- **Zone gateways** are decorative, clearly-locked voxel signposts at the margins (padlock glyph, ghosted to ~55% opacity, `aria-hidden` or `aria-disabled`, not focusable). They are set dressing that promises more — label them ("Alphabet Forest", "Number Mine", "Creative Studio", "Dance Stage", "Skyline Swing") in Lexend `--text-sm` `--ink-mute`.
- **Responsive:** ≥1280px full iso path. 768–1279px compress into two stacked iso clusters (letters cluster, numbers cluster). <768px (portrait fallback) collapse to a single vertical scroll of large full-width voxel tiles, keeping the same nodes and testids.
- **Iso projection:** tiles use a 2:1 footprint (classic isometric). A node cube is ~150–180px wide on the primary viewport.

**App shell:** keep `app-shell` on the root. The current `h-screen w-screen` fullscreen is acceptable for an installed tablet PWA — just change `bg-slate-900 text-white` to `bg-[var(--surface)] text-[var(--ink)]`. Avoid nested `h-screen`.

---

## 5. Motion — Snap & Stack (Framer Motion)

Personality: blocks **snap** into place like building — fast settle, a whisper of overshoot, tactile. Rewards **stack/burst** in bricks. Nothing floaty, nothing slow.

**Spring presets** (put in `src/lib/animation.ts` and import — single source of truth):

```ts
export const snapSpring = { type: "spring", stiffness: 320, damping: 24, mass: 0.9 } as const;   // primary settle
export const snapSoft   = { type: "spring", stiffness: 260, damping: 26, mass: 1.0 } as const;   // enters / screen transitions
export const brickPop   = { type: "spring", stiffness: 400, damping: 18, mass: 0.7 } as const;   // reward burst children
export const pressTap   = { scale: 0.94 } as const;                                              // whileTap on every button
```

**Signature moments:**
1. **Map assembly (load):** nodes drop-and-snap in sequence. `initial={{ y: -24, opacity: 0 }}` → `animate={{ y: 0, opacity: 1 }}` with `snapSpring`, parent `staggerChildren: 0.05`. The trail SVG path draws in (`pathLength` 0→1) under them.
2. **Discover symbol:** replace the current `stiffness:200, damping:14` with `snapSpring` on `scale`+`opacity` — the glyph snaps to full size. A subtle **bilingual audio indicator** (two dots: EN lights, then VI lights) pulses in time with playback; purely visual, no logic change.
3. **Find-it correct:** target tile does a `brickPop` scale bump + a small **brick-burst** (4–6 tiny butter/terracotta cubes fly out with `brickPop`, `staggerChildren: 0.04`, then fade). Wrong tap: a 2px horizontal shake (`x: [0,-6,6,-4,0]`, 180ms) — **replaced by a color flash under reduced-motion**.
4. **Match-it correct:** lowercase choice snaps up to "dock" beside the uppercase prompt (`layout` + `snapSpring`).
5. **Create-it save:** the finished canvas shrinks and snaps into a "collection" corner (`snapSpring`), confirming it was collected.
6. **Buttons everywhere:** `whileTap={pressTap}` (keeps the existing `active:scale-95` intent, now spring-backed) and a `whileHover={{ y: -2 }}` lift on pointer devices.

**Reduced motion (required):** wrap presets so `prefers-reduced-motion: reduce` → no translate/scale/overshoot; use opacity-only cross-fades (~120ms) and swap the wrong-answer shake for a `--tc-600` border flash. Provide a `useReducedMotion()` (Framer) gate in `animation.ts`.

**Remotion counterpart (for the PWA splash + any future reward export, not required for this slice's runtime):** 30fps. Splash ~90 frames: a small tower of voxel blocks stacks bottom-up (each block lands with the same snap easing), then the wordmark "Victor's Block Quest" snaps in. Keep it as a documented target in `docs/` — do not block V1 on it.

---

## 6. Voxel 3D Block Language

Every tile, choice, and map node is a **pseudo-isometric cube** with three visible faces, giving real depth (the strongest read of the block-world identity and the best app icon).

**Geometry (per cube):**
- **Top face:** base hue lightened by `--voxel-top-lighten` (18%). Carries the symbol (Andika 700, `--ink`).
- **Front/left face:** base hue.
- **Right face:** base hue darkened by `--voxel-side-darken` (16%).
- **Seams:** 1px `--voxel-edge` line between faces.
- **Grounding:** `--voxel-drop` shadow so cubes sit on the trail.

**Build approach (NEO's choice, ranked):**
1. Preferred: a reusable `VoxelTile` React component using **CSS 3D transforms** (`transform-style: preserve-3d`, three child face `<div>`s rotated into an iso cube) OR a layered clip-path approach (top rhombus + two parallelograms). Either gives crisp, resolution-independent cubes that scale for the PWA icon.
2. Acceptable fallback: a flat rounded tile with a hard bottom+right "extruded" shadow (`box-shadow` double-layer) to fake depth — use only if true iso proves too costly for the Challenge/Phaser parity.
- Voxel base hues by context: map letter nodes `--tc-400`, number nodes `--tp-400`, choice tiles `--surface-raised` (neutral so the ink symbol dominates), reward cubes alternate `--bt-400`/`--tc-400`.
- **CRITICAL — symbols must render UPRIGHT, never skewed.** The whole point of this app is letter/number recognition; a child must see a true `A`, not an `A` sheared into the iso plane. The cube *body* may be isometric, but the glyph sits on the top face **counter-transformed to read flat and upright** (or floats just above the top face as an un-transformed layer). If achieving upright glyphs on a true-3D top face is fiddly, prefer the **layered clip-path cube** (iso body + a flat, upright symbol plate on top) or the extruded-flat-tile fallback. Legibility of the learning glyph outranks the 3D effect every time. Same rule in `ChallengeScene` — the collectible symbol is drawn upright.
- **Mastery on a node cube:** a "brick fill" — the front face fills bottom-up with `--tp-500` proportional to accuracy; a `mastered` node flies a small **butter pennant** flag from the top face.

**Phaser parity:** `ChallengeScene.ts` renders its own canvas. Pass the palette in via the scene config/registry so the mini-game world uses `--surface`, `--tc-500`, `--tp-500`, `--bt-400`, `--ink` (hard-code the hex constants in a small shared `src/game/palette.ts` mirroring the tokens). The collectible target symbol should render in Andika-equivalent styling (load the same webfont into Phaser or draw large high-contrast glyphs). Do not restyle game *logic* — only colors/typography.

---

## 7. Component-Level Notes (signature moments)

**StarterVillageMap** — becomes the iso trail (§4). Each `village-node-<itemId>` is a `VoxelTile` with symbol + a status pill (`--status-*` colors, §9) + brick-fill mastery. Keep the `onClick={() => setActiveItem(item)}` wiring and the `data-testid`. The status text still renders the raw status string the test reads — style it, don't rename it.

**DiscoverActivity** — cream screen, giant Andika ink symbol (`--symbol-hero`) with `snapSpring` entrance and a soft terracotta radial glow behind it. Bilingual audio dots (EN→VI) as a visual playback cue. `Continue` = chunky teal-pine pill button (`--tp-500`, cream label, ≥ 56px tall, `whileTap`).

**FindItActivity** — prompt "Find A" in Lexend above three voxel choice tiles (`--surface-raised`, ink symbol). Correct → `brickPop` + brick-burst; wrong → shake/flash. Keep bare-symbol accessible names. Tiles ≥ 96px, generous gaps.

**MatchItActivity** — `match-prompt` uppercase voxel cue on top; three lowercase voxel choices below. Correct choice snaps up to dock beside the prompt. Keep bare lowercase names.

**CreateItActivity** — reframe the white canvas as a "block canvas" inside a `--surface-sunken` framed panel with `--radius-block`. The 6 paint swatches become **color blocks ≥ 44×44px** with a clear **selected ring** (2px `--ink` + 2px offset) on the active color — the current version shows no selected state, which is a real usability gap for a child. `Save` button becomes "Save to Collection" affordance with the snap-to-corner collectible animation. Keep the `create-canvas` testid and `color ${c}` aria-labels.

**ChallengeActivity / ChallengeScene** — themed to the block world via `src/game/palette.ts` (§6). Keep `challenge-canvas-host` and the Phaser lifecycle untouched.

**ParentGate** — keep the discreet bottom-right hold button (child shouldn't find it easily) BUT enforce a **44×44px hit area** (SC 2.5.8) even if the visible dot stays small — expand the touch target with padding, keep the visual subtle (opacity ~0.4). The math-gate screen (`parent-math-question` / `parent-math-input` / `Submit`) renders in the **Data Room skin**, signaling the crossover to grown-up mode. Style the number input properly (Lexend, `--pd-*`, visible focus).

**ParentDashboard — Clean Data Room (the stark split).** This is a different application's worth of restyle:
- Surface `--pd-bg`, panels `--pd-panel`, `--pd-line` hairlines, `--pd-ink` text. No cream, no playful color, `--radius-pd` (tighter).
- H1 "Starter Village — Progress" in Lexend 700; a calm subhead with last-updated.
- The table gets real structure: sticky header, zebra rows via `--pd-line`, `tabular-nums` on Accuracy and Attempts, right-aligned numerics. Replace the raw status string with a **status pill** using verified `--status-*` colors. Add a compact **accuracy progress bar** per row (`--pd-accent` fill on a `--pd-line` track) — treat data viz as part of the system, not an afterthought. Keep `dashboard-row-<itemId>` testids and the existing columns (Item, Status, Accuracy, Attempts, Last Played). Keep the `Close` button (accessible name "Close").
- Keep the existing "Phase 2" helper note, restyled as a muted footnote.

---

## 8. PWA Icon / Splash / Manifest

- **App icon:** a single hero **voxel cube** (iso, three shaded faces) on a cream `--surface` field, with a bold Andika **"A"** on the top face (letters are the first thing the child learns). Maskable-safe: keep the cube within the safe zone, cream bleed to edges. Produce `icon-192.png`, `icon-512.png`, `icon-maskable-512.png` from a **vector master** (SVG) so it stays crisp — see §10 on why we are NOT generating raster art through the image pipeline.
- **Splash:** cream background, the voxel cube centered, wordmark "Victor's Block Quest" in Andika below. Matches the Remotion splash target.
- **Manifest updates** (`vite.config.ts` VitePWA): `theme_color: "#3D8577"` (teal-pine, the brand's "chrome" color), `background_color: "#FBF3E4"` (cream). Keep `display: standalone`, `orientation: landscape`.

---

## 9. Accessibility Floor (VERIFIED by a11y-architect — WCAG 2.2)

Non-negotiable minimums for pre-reader child + adult parent on tablet.

**Contrast — verified ratios:**

| Pairing | Ratio | Verdict |
|---|---|---|
| cocoa `--ink` on cream `--surface` | 11.89:1 | AAA — universal text/symbol color |
| cocoa on butter `--bt-400` | 8.47:1 | AAA |
| raw terracotta `--tc-500` on cream | 2.68:1 | **FAIL at every size — FILL ONLY** |
| raw teal-pine `--tp-500` on cream | 3.95:1 | Large/UI only (3:1); FAILS as body text |
| raw butter `--bt-400` on cream | 1.40:1 | **Never as text/icon on cream; needs a border even as a shape** |
| white on `--terracotta-ink` #C1502F | 4.71:1 | AA — use for terracotta buttons/chips carrying text |
| `--teal-ink` #2E6B5E on cream | 5.63:1 | AA |
| white on `--teal-ink` #2E6B5E | 6.21:1 | AA |

**Hard color rules (decision records — honor exactly):**
1. **Terracotta `--tc-500` is fill-only, full stop.** No text/icon/status label in raw terracotta, any size. Text on a terracotta surface routes through `--terracotta-ink` (white text) or cocoa ink at ≥24px.
2. **Teal-pine `--tp-500` is large-text/UI-only.** Any body/small text or small icon uses `--teal-ink` (#2E6B5E) instead.
3. **Butter never touches cream without a border.** As a shape on cream it needs a `--ink`/`--terracotta-ink` outline; never butter text on cream.
4. **Never use color as the sole instruction channel.** Narration and prompts identify by symbol ("find the A"), never "tap the red one." Status = color + shape + (parent side) text label, always together — never color alone, even temporarily.

**Mastery status — verified on BOTH cream and parent off-white, CVD-safe (use `--status-*` tokens from §1):**

| Status | Hex | Cream | Parent | Non-color cue (required) |
|---|---|---|---|---|
| new | #4B5563 | 6.85:1 | 6.9:1 | outline-only / empty ring |
| practicing | #B45309 | 4.55:1 | 4.71:1 | half-filled ring |
| nearly_mastered | #2E6B5E | 5.63:1 | 5.95:1 | three-quarter ring |
| mastered | #15803D | 4.55:1 | 4.80:1 | filled ring + check/star glyph |

**Coloring-canvas swatches:** the 6 crayon hexes are exempt as content (the fill IS the meaning), but (1) every dot needs a **2px solid cocoa-ink ring** independent of fill so pastels don't vanish into cream, and (2) the selected state is **ring + scale-pop + checkmark badge — never color-only** (red/pink and violet/pink are CVD-confusable at swatch scale).

**Target sizes (sized for pre-reader motor precision, above the 24px SC 2.5.8 floor):**

| Element | Floor | Spacing |
|---|---|---|
| Discover symbol (if tappable) | 120×120px | — |
| Find-it choice tiles | ≥96×96px (whole tile = hit area) | ≥24px gutter |
| Match-it tiles | ≥88×88px | ≥20px gutter |
| Coloring palette dots | ≥56×56px visible + 64px hit-slop | 12–16px gap |
| Voxel map nodes | ≥64×64px (72px if adjacent on the iso grid) | ≥16px between nodes |
| Parent-gate hold button | **≥44×44px hit area** (visual may stay subtle). Give it a ≥3:1 idle-visible ring + a **progress-ring that fills as the 3s hold advances** — do NOT leave it a silent invisible box. Size is the wrong child-proofing mechanism; the 3s hold + math question already child-proof it. |
| Parent math-gate keys | ≥48×48px | ≥8px |

**Focus-visible (halo+ring — single-accent rings failed 3:1 on the brand fills; apply identically to every interactive element on both surfaces):**
```css
:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px var(--focus-inner), 0 0 0 5px var(--focus-outer);
}
[data-surface="parent"] :focus-visible {
  box-shadow: 0 0 0 2px var(--pd-bg), 0 0 0 5px var(--focus-outer);
}
```

**Reduced motion:** under `prefers-reduced-motion: reduce`, **kill springs/overshoot entirely** (don't just shorten) — swap to a static state-change + a non-motion success cue (`outline: 3px solid var(--teal-ink)`), and **cut particle/brick bursts entirely** (don't reduce count). Gate the JS spring config on `matchMedia('(prefers-reduced-motion: reduce)')` too, not only CSS.

**Structural a11y (do not skip):**
- **Per-node `lang`:** set `lang="en"` / `lang="vi"` on the specific text nodes and narration cues, not one top-level attribute — this app leans on audio as the primary instruction channel for pre-readers.
- **Multi-sensory instructions:** every spoken instruction fires a **simultaneous visual highlight/pulse** on the target (deaf/HoH children).
- **Parent dashboard must allow OS text scaling / pinch-zoom** (no `user-scalable=no`) and reflow at 400% zoom. The kid game-canvas screens may claim the "essential layout" exception; the parent data view may not.
- **Landscape lock** (if enforced) must be documented as a deliberate "essential" exception so future portrait additions aren't silently broken.

---

## 10. Art Direction Decision — NO photographic/DALL-E hero assets

This is a faceless block-world kids' game. It needs an **app icon, splash, and voxel block system** — all of which are **best authored as crisp, offline-friendly vector/CSS (SVG + CSS 3D)**, not raster generation. Reasons this is the right call (not a shortcut):
- **PWA + offline:** vector art is tiny, cached trivially, and razor-sharp on the S10 Ultra's high-DPI panel. Generated raster block art would be heavier and blurrier when scaled to icon/splash sizes.
- **Consistency:** the map cubes, choice cubes, reward cubes, and the icon must be the *same* voxel system. One `VoxelTile` primitive + one SVG icon master guarantees that; independently-generated images would drift.
- **IP safety:** hand-authored generic cubes carry zero risk of a model echoing Minecraft/Roblox textures.
- **The image pipeline is the wrong tool here:** the ChatGPT/Lens `generate_image` path is built for John/Lavie/Victor face-forward brand photography with face-similarity verification — it would fail/loop on a faceless abstract icon. Lens is correctly reserved for photographic, people-in-shot marketing content, which this project does not have.

**Therefore:** NEO builds the voxel system and the icon/splash as SVG/CSS from this spec. If, later, John wants a painterly illustrated zone-map background (Alphabet Forest etc. in future phases), that is a separate art task — and even then, an illustrated (non-photographic) approach routed through a design/illustration tool fits better than the photographic Lens path. No Lens assets are generated for this slice.

---

## 11. Definition of Done (design acceptance)

- [ ] Cream Storybook Dusk palette live across all kid screens; parent dashboard in the distinct Data Room skin.
- [ ] Andika on all symbols/headings, Lexend on all UI/dashboard, self-hosted, working offline.
- [ ] Map is the isometric voxel trail with locked zone gateways (reads as "start of a bigger world"), not a uniform grid.
- [ ] Voxel cubes have real 3-face depth; one `VoxelTile` primitive drives map + choices + rewards.
- [ ] Snap & Stack motion on load, correct/wrong answers, and saves; `prefers-reduced-motion` respected.
- [ ] All kid tap targets ≥ 44px; parent-gate ≥ 44px hit area; focus-visible everywhere.
- [ ] PWA icon/splash are the crisp voxel-cube vector; manifest theme/background colors updated.
- [ ] Create-it swatches show a selected state and are ≥ 44px.
- [ ] **All 41 unit tests + 2 e2e tests still pass; no test contract weakened.**
- [ ] Every §9 verified-accessibility rule honored: `-ink` tokens for all text, fill-only brand colors respected, verified status colors + shape cues, target-size floors, halo+ring focus, reduced-motion kill, per-node `lang`, multi-sensory instructions, parent-dashboard zoom/reflow.
