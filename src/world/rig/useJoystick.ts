import { useCallback, useRef, useState } from "react";

export interface JoystickVector {
  x: number;
  z: number;
  magnitude: number;
}

const ZERO_VECTOR: JoystickVector = { x: 0, z: 0, magnitude: 0 };

export function computeJoystickVector(
  originX: number,
  originY: number,
  pointerX: number,
  pointerY: number,
  maxRadius: number
): JoystickVector {
  const dx = pointerX - originX;
  const dy = pointerY - originY;
  const rawMagnitude = Math.hypot(dx, dy) / maxRadius;
  const magnitude = Math.min(1, rawMagnitude);
  if (magnitude === 0) return ZERO_VECTOR;

  const angle = Math.atan2(dy, dx);
  return {
    x: Math.cos(angle) * magnitude,
    z: Math.sin(angle) * magnitude, // screen "up" (negative dy) becomes negative z (forward)
    magnitude,
  };
}

export function useJoystick() {
  const [vector, setVector] = useState<JoystickVector>(ZERO_VECTOR);
  const originRef = useRef<{ x: number; y: number } | null>(null);
  const maxRadiusRef = useRef(50);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    originRef.current = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    maxRadiusRef.current = rect.width / 2;
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!originRef.current) return;
    setVector(
      computeJoystickVector(
        originRef.current.x,
        originRef.current.y,
        e.clientX,
        e.clientY,
        maxRadiusRef.current
      )
    );
  }, []);

  const onPointerUp = useCallback(() => {
    originRef.current = null;
    setVector(ZERO_VECTOR);
  }, []);

  return { vector, onPointerDown, onPointerMove, onPointerUp };
}
