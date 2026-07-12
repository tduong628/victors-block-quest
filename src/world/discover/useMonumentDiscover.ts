import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { distanceTo } from "../rig/collision";
import { getItemAudio, playSequential } from "../../audio/manifest";
import { recordAttempt } from "../../data/db";

export const DISCOVER_TRIGGER_RADIUS = 4;

export function shouldTriggerDiscover(
  playerX: number,
  playerZ: number,
  monumentX: number,
  monumentZ: number,
  alreadyDiscovered: boolean
): boolean {
  if (alreadyDiscovered) return false;
  return distanceTo(playerX, playerZ, monumentX, monumentZ) <= DISCOVER_TRIGGER_RADIUS;
}

export type DiscoverPhase = "dispersed" | "assembling" | "discovered";

// E3 Block-Build Monument sequence (DESIGN_SPEC_3D.md §7.4): proximity trigger -> assemble
// -> glow -> speak EN then VI via the EXISTING audio pipeline -> recordAttempt. No new
// mastery logic — this calls the same frozen functions the 2D app uses.
export function useMonumentDiscover(
  itemId: string,
  sessionId: string,
  playerPosition: { x: number; z: number },
  monumentPosition: { x: number; z: number }
): { phase: DiscoverPhase } {
  const [phase, setPhase] = useState<DiscoverPhase>("dispersed");
  const firingRef = useRef(false);

  useFrame(() => {
    if (firingRef.current || phase !== "dispersed") return;
    const trigger = shouldTriggerDiscover(
      playerPosition.x,
      playerPosition.z,
      monumentPosition.x,
      monumentPosition.z,
      false
    );
    if (!trigger) return;

    firingRef.current = true;
    setPhase("assembling");

    (async () => {
      const { en, vi } = getItemAudio(itemId);
      await playSequential([en, vi]);
      await recordAttempt(itemId, "discover", true, sessionId);
      setPhase("discovered");
    })();
  });

  return { phase };
}
