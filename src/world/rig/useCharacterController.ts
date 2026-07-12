import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { JoystickVector } from "./useJoystick";
import { clampToBounds } from "./collision";

export const MAX_SPEED = 6; // world units/sec
const ACCEL = 24; // units/sec^2 toward target velocity — feel-tuned, not physics

function clampDelta(delta: number, maxDelta: number): number {
  return Math.max(-maxDelta, Math.min(maxDelta, delta));
}

export function stepVelocity(
  current: { x: number; z: number },
  joystick: JoystickVector,
  deltaSec: number
): { x: number; z: number } {
  const targetX = joystick.x * MAX_SPEED;
  const targetZ = joystick.z * MAX_SPEED;
  const maxDelta = ACCEL * deltaSec;
  return {
    x: current.x + clampDelta(targetX - current.x, maxDelta),
    z: current.z + clampDelta(targetZ - current.z, maxDelta),
  };
}

export function speedNorm(velocity: { x: number; z: number }): number {
  return Math.min(1, Math.hypot(velocity.x, velocity.z) / MAX_SPEED);
}

const HEADING_DEADZONE = 0.01;

export function headingFromVelocity(velocity: { x: number; z: number }, fallbackHeading: number): number {
  if (Math.hypot(velocity.x, velocity.z) < HEADING_DEADZONE) return fallbackHeading;
  return Math.atan2(velocity.x, velocity.z);
}

export interface CharacterState {
  position: { x: number; z: number };
  heading: number;
  speedNorm: number;
}

// Thin useFrame wrapper around the pure functions above — this hook itself is not unit
// tested directly (it requires an R3F render loop); the pure functions it calls are, per
// DESIGN_SPEC_3D.md §10's testing strategy. Covered by Task 12's WorldCanvas mount test.
export function useCharacterController(joystickVector: JoystickVector): CharacterState {
  const stateRef = useRef<CharacterState>({ position: { x: 0, z: 0 }, heading: 0, speedNorm: 0 });
  const velocityRef = useRef({ x: 0, z: 0 });

  useFrame((_state, delta) => {
    velocityRef.current = stepVelocity(velocityRef.current, joystickVector, delta);
    const nextX = stateRef.current.position.x + velocityRef.current.x * delta;
    const nextZ = stateRef.current.position.z + velocityRef.current.z * delta;
    const clamped = clampToBounds(nextX, nextZ);
    stateRef.current = {
      position: clamped,
      heading: headingFromVelocity(velocityRef.current, stateRef.current.heading),
      speedNorm: speedNorm(velocityRef.current),
    };
  });

  return stateRef.current;
}
