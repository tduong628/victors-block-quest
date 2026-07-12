import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Object3D, InstancedMesh } from "three";
import { P3 } from "../materials/palette3d";
import { createToonMaterial } from "../materials/toon";
import { getGlyphCubePositions } from "./glyphGeometry";
import { useMonumentDiscover } from "./useMonumentDiscover";
import { snapSpring, brickPop, prefersReducedMotion } from "../../lib/animation";

// snapSpring/brickPop are typed as framer-motion's `Transition` union, which does not
// statically guarantee the spring variant carries `stiffness` even though the frozen
// src/lib/animation.ts constants always do (`{ type: "spring", stiffness: ..., ... }`) — cast
// narrowly here rather than widening the two `?? fallback` reads inline everywhere they're used.
const SNAP_SPRING_STIFFNESS = (snapSpring as { stiffness?: number }).stiffness ?? 320;
const BRICK_POP_STIFFNESS = (brickPop as { stiffness?: number }).stiffness ?? 400;

export interface LetterMonumentProps {
  itemId: string;
  glyphChar: string;
  position: { x: number; z: number };
  sessionId: string;
  playerPosition: { x: number; z: number };
}

const dummy = new Object3D();
const CUBE_SCALE = 0.5;

export default function LetterMonument({
  itemId,
  glyphChar,
  position,
  sessionId,
  playerPosition,
}: LetterMonumentProps) {
  const targetCubes = useMemo(() => getGlyphCubePositions(glyphChar), [glyphChar]);
  const glyphMat = createToonMaterial(P3.glyph);
  const plinthMat = createToonMaterial(P3.plinth);
  const meshRef = useRef<InstancedMesh>(null);
  const timeRef = useRef(0);

  const { phase } = useMonumentDiscover(itemId, sessionId, playerPosition, position);
  const reducedMotion = prefersReducedMotion();

  // Dispersed rest positions — a loose scattered cloud above the plinth (DESIGN_SPEC_3D.md §7.4).
  const dispersedCubes = useMemo(
    () =>
      targetCubes.map((_, i) => ({
        x: (Math.sin(i * 12.9) * 3) % 3,
        y: 3 + (i % 4) * 0.3,
        z: (Math.cos(i * 7.3) * 3) % 3,
      })),
    [targetCubes]
  );

  useFrame((_state, delta) => {
    if (!meshRef.current) return;
    timeRef.current += delta;

    const assembled = phase === "assembling" || phase === "discovered";
    const instant = reducedMotion; // reduced motion: appear already-assembled, no fly-in overshoot

    targetCubes.forEach((target, i) => {
      const rest = dispersedCubes[i];
      let x = rest.x;
      let y = rest.y;
      let z = rest.z;

      if (assembled) {
        if (instant) {
          x = target.x;
          y = target.y;
          z = target.z;
        } else {
          // Snap & Stack feel, reused from the existing 2D motion system (not reinvented).
          const t = Math.min(1, (timeRef.current - i * 0.02) * SNAP_SPRING_STIFFNESS / 320);
          x = rest.x + (target.x - rest.x) * t;
          y = rest.y + (target.y - rest.y) * t;
          z = rest.z + (target.z - rest.z) * t;
        }
      } else if (!instant) {
        y += Math.sin(timeRef.current * 1.5 + i) * 0.05; // slow bob while dispersed
      }

      dummy.position.set(x, y, z);
      dummy.scale.setScalar(CUBE_SCALE);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;

    if (phase === "discovered" && !instant) {
      const glow = 0.3 + Math.sin(timeRef.current * BRICK_POP_STIFFNESS / 400) * 0.1;
      glyphMat.emissive.set(P3.glow);
      glyphMat.emissiveIntensity = Math.max(0, glow);
    }
  });

  return (
    <group position={[position.x, 0, position.z]} name="letter-monument">
      <mesh position={[0, 0.15, 0]} material={plinthMat}>
        <boxGeometry args={[1.5, 0.3, 1]} />
      </mesh>
      <instancedMesh ref={meshRef} args={[undefined, undefined, targetCubes.length]} material={glyphMat}>
        <boxGeometry args={[1, 1, 1]} />
      </instancedMesh>
    </group>
  );
}
