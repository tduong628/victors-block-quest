# Accessibility Exceptions

DESIGN_SPEC.md §9 requires that any deliberate deviation from a WCAG 2.2
success criterion be documented as an intentional "essential" exception,
scoped narrowly, and never allowed to silently expand. This file is that
record.

## 1. Landscape orientation lock (kid game canvas only)

**What:** `vite.config.ts`'s `VitePWA` manifest sets `orientation: "landscape"`
for the installed PWA.

**Which SC this touches:** WCAG 2.2 SC 1.3.4 (Orientation) generally requires
content not to restrict view/operation to a single display orientation.

**Why this is essential, not a shortcut:** DESIGN_SPEC.md §0 and §4 name
tablet landscape (~1600×1000, e.g. a Samsung S10 Ultra installed as a
home-screen PWA) as the primary and only designed target for the **kid
game-canvas screens** — the isometric village map, the five activities, and
`ChallengeScene`'s Phaser canvas. These are spatial, canvas-driven layouts
(absolute-positioned voxel nodes along an iso trail, a Phaser game surface)
that do not have a meaningful portrait equivalent without a full separate
layout system. SC 1.3.4 explicitly permits an orientation restriction "if a
specific display orientation is essential" — this qualifies under that
carve-out for the child-facing surfaces.

**Scope — what this exception covers and what it does NOT cover:**
- Covers: `StarterVillageMap`, `LessonRunner`, and all five activity
  components (`DiscoverActivity`, `FindItActivity`, `MatchItActivity`,
  `CreateItActivity`, `ChallengeActivity`) while a lesson/activity is active.
- Does **not** cover `ParentGate`'s math-question screen or
  `ParentDashboard`. Per DESIGN_SPEC.md §9: "the parent data view may not"
  claim this exception. Both parent-facing screens are built with fluid
  flex/overflow layout (no fixed-orientation assumptions, no
  `user-scalable=no`, no viewport `maximum-scale`) so they remain usable if a
  parent rotates the device to portrait or zooms to 400%.
- `index.html`'s viewport meta tag is
  `width=device-width, initial-scale=1.0` with no `user-scalable=no` and no
  `maximum-scale` — OS-level pinch-zoom and text scaling are never blocked,
  on any screen, kid or parent.

**Do not silently expand this exception.** If a future phase adds a
portrait-capable kid surface (§4's documented `<768px` portrait fallback for
the village map already exists as CSS, independent of the manifest lock) or
any new parent-facing screen, re-read this file first — new parent surfaces
inherit the "must reflow, must not lock orientation" rule by default, not
the kid-surface exception.

## 2. Coloring-canvas swatch hexes (content, not UI chrome)

Documented for completeness, not new to Phase C: the six crayon colors on
`CreateItActivity`'s canvas (`#f87171 #fbbf24 #34d399 #38bdf8 #a78bfa
#f472b6`) are exempt from the Storybook Dusk brand palette because they are
the child's paint content, not interface chrome (DESIGN_SPEC.md §2). The
swatch *buttons* selecting those colors are not exempt from anything — they
carry the full §9 target-size, ring, and non-color-selected-state
requirements.
