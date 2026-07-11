# Remotion splash target (deferred, documented per DESIGN_SPEC.md §5)

Not built for V1 — the PWA install/launch splash is handled by the manifest's
`background_color` + icon (see `vite.config.ts`). This is the future animated
splash target if/when a native-app-style launch animation is added.

- 30fps, ~90 frames.
- A small tower of voxel blocks stacks bottom-up; each block lands with the
  same `snapSpring` easing used elsewhere in the app (`src/lib/animation.ts`).
- The wordmark "Victor's Block Quest" snaps in after the stack completes, set
  in Andika Bold on the `--surface` cream background.
- Reuses the same `VoxelTile` voxel-face shading tokens (`--voxel-top-lighten`,
  `--voxel-side-darken`, `--voxel-edge`) as the in-app voxel system and the
  `icon-master.svg` cube geometry, so the splash, icon, and in-game blocks stay
  visually identical.
