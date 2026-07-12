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
