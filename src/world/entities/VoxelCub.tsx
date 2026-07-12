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
    // NOTE: intentionally `name`, not `data-testid` — R3F's applyProps treats any dashed prop
    // as a pierced nested-property path (e.g. "rotation-x" -> object.rotation.x), so
    // "data-testid" is parsed as instance.data.testid and crashes on undefined `instance.data`
    // (verified empirically: @react-three/test-renderer throws "Cannot read properties of
    // undefined (reading 'testid')" on mount). `name` is a plain Object3D field, has no dash,
    // and is the standard R3F way to tag a node for test lookup.
    <group ref={groupRef} name="voxel-cub">
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
