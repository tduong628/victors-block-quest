import { useState } from "react";
import { P3 } from "./materials/palette3d";
import WorldDressing from "./entities/WorldDressing";
import VoxelCub from "./entities/VoxelCub";
import LetterMonument from "./discover/LetterMonument";
import { useCharacterController } from "./rig/useCharacterController";
import { useChaseCamera } from "./rig/useChaseCamera";
import type { JoystickVector } from "./rig/useJoystick";

export interface SceneProps {
  sessionId: string;
  joystickVector?: JoystickVector;
}

const MONUMENT_POSITION = { x: 0, z: -10 };
const ZERO_VECTOR: JoystickVector = { x: 0, z: 0, magnitude: 0 };

// Owns the single frame-tick chain: joystick -> controller -> cub/camera (DESIGN_SPEC_3D.md
// §7.1/§8). Milestone 1 assembles exactly one monument (letter A) per the approved phasing.
export default function Scene({ sessionId, joystickVector = ZERO_VECTOR }: SceneProps) {
  const character = useCharacterController(joystickVector);
  useChaseCamera(character);

  return (
    <>
      {/* Unlit gradient skydome — DESIGN_SPEC_3D.md §2, never drei's <Sky> (too heavy). */}
      <mesh scale={[-1, 1, 1]}>
        <sphereGeometry args={[80, 16, 16]} />
        <meshBasicMaterial color={P3.skyTop} side={2} />
      </mesh>
      <WorldDressing />
      <VoxelCub position={character.position} heading={character.heading} speedNorm={character.speedNorm} />
      <LetterMonument
        itemId="letter-A"
        glyphChar="A"
        position={MONUMENT_POSITION}
        sessionId={sessionId}
        playerPosition={character.position}
      />
    </>
  );
}
