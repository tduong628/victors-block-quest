import { useEffect } from "react";
import { useJoystick, type JoystickVector } from "../rig/useJoystick";
import { P3 } from "../materials/palette3d";

export interface JoystickProps {
  onVectorChange: (vector: JoystickVector) => void;
}

// Fixed bottom-left virtual stick, DOM overlay (not inside the R3F canvas). Base ~120px,
// thumb >=44px hit area (DESIGN_SPEC_3D.md §5.1 target-size floor).
export default function Joystick({ onVectorChange }: JoystickProps) {
  const { vector, onPointerDown, onPointerMove, onPointerUp } = useJoystick();

  useEffect(() => {
    onVectorChange(vector);
  }, [vector, onVectorChange]);

  return (
    <div
      data-testid="joystick-base"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
      style={{
        position: "fixed",
        bottom: 24,
        left: 24,
        width: 120,
        height: 120,
        borderRadius: "50%",
        background: `${P3.surface}B3`,
        border: `2px solid ${P3.ink}`,
        touchAction: "none",
      }}
    >
      <div
        data-testid="joystick-thumb"
        style={{
          position: "absolute",
          left: `${50 + vector.x * 35}%`,
          top: `${50 + vector.z * 35}%`,
          transform: "translate(-50%, -50%)",
          width: 44,
          height: 44,
          borderRadius: "50%",
          background: P3.hudAction,
        }}
      />
    </div>
  );
}
