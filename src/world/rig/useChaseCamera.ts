import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import type * as THREE from "three";
import { prefersReducedMotion } from "../../lib/animation";

// D3 Snappy Arcade Chase — DESIGN_SPEC_3D.md §5.3. Amplitude caps and the reduced-motion
// kill switch are non-negotiable (the player is 3 years old — nausea risk is real).
export const BASE_FOV = 55;
export const KICK_FOV = 62; // capped swing per the spec's "<= ~7 degrees" safety note
const CAMERA_DAMPING = 0.08;
const BOUNCE_AMPLITUDE = 0.06; // small, per spec's "conservative" bounce note
const BASE_OFFSET = { x: 0, y: 4.5, z: 7 };

export function computeFov(speedNorm: number, reducedMotion: boolean): number {
  if (reducedMotion) return BASE_FOV;
  return BASE_FOV + (KICK_FOV - BASE_FOV) * speedNorm;
}

export function dampTowards(current: number, target: number, dampingFactor: number): number {
  return current + (target - current) * dampingFactor;
}

export interface ChaseCameraTarget {
  position: { x: number; z: number };
  heading: number;
  speedNorm: number;
}

// Thin useFrame wrapper — the pure math above is what's unit tested (DESIGN_SPEC_3D.md §10).
// This hook itself needs a live R3F camera and is covered by Task 12's WorldCanvas mount test.
export function useChaseCamera(target: ChaseCameraTarget): void {
  const { camera } = useThree();
  const bounceTimeRef = useRef(0);

  useFrame((_state, delta) => {
    const reducedMotion = prefersReducedMotion();
    const fov = computeFov(target.speedNorm, reducedMotion);
    if ("fov" in camera && camera.fov !== fov) {
      (camera as THREE.PerspectiveCamera).fov = fov;
      (camera as THREE.PerspectiveCamera).updateProjectionMatrix();
    }

    const desiredX = target.position.x + BASE_OFFSET.x;
    const desiredZ = target.position.z + BASE_OFFSET.z;
    let desiredY = BASE_OFFSET.y;

    if (!reducedMotion) {
      bounceTimeRef.current += delta;
      desiredY += Math.sin(bounceTimeRef.current * 6) * BOUNCE_AMPLITUDE * target.speedNorm;
    }

    const damping = reducedMotion ? 1 : CAMERA_DAMPING;
    camera.position.x = dampTowards(camera.position.x, desiredX, damping);
    camera.position.y = dampTowards(camera.position.y, desiredY, damping);
    camera.position.z = dampTowards(camera.position.z, desiredZ, damping);
    camera.lookAt(target.position.x, 1, target.position.z);
  });
}
