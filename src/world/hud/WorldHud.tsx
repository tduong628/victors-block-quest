import { P3 } from "../materials/palette3d";

export interface WorldHudProps {
  activeLang: "en" | "vi" | null;
}

// Mirrors the 2D Discover's bilingual dot cue (DESIGN_SPEC_3D.md §3) — purely visual,
// no new logic, fires in sync with whatever the audio pipeline is actually playing.
export default function WorldHud({ activeLang }: WorldHudProps) {
  return (
    <div style={{ position: "fixed", top: 16, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 8 }}>
      <span
        data-testid="hud-dot-en"
        data-active={activeLang === "en"}
        style={{
          width: 10,
          height: 10,
          borderRadius: "50%",
          background: activeLang === "en" ? P3.hudAction : `${P3.ink}40`,
        }}
      />
      <span
        data-testid="hud-dot-vi"
        data-active={activeLang === "vi"}
        style={{
          width: 10,
          height: 10,
          borderRadius: "50%",
          background: activeLang === "vi" ? P3.hudAction : `${P3.ink}40`,
        }}
      />
    </div>
  );
}
