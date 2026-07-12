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
