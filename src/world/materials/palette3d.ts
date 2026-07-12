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
