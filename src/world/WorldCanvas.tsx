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
