import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

vi.mock("phaser", () => ({
  default: {
    AUTO: 0,
    Scale: { FIT: "FIT", CENTER_BOTH: "CENTER_BOTH" },
    Game: vi.fn().mockImplementation(() => ({
      scene: { start: vi.fn() },
      destroy: vi.fn(),
    })),
    Scene: class {},
  },
}));

import Phaser from "phaser";
import ChallengeActivity from "./ChallengeActivity";
import { starterVillagePack } from "../../data/lessonPacks/starter-village";

describe("ChallengeActivity", () => {
  it("mounts a canvas host div for Phaser to attach to", () => {
    const item = starterVillagePack.items.find((i) => i.id === "letter-A")!;
    render(
      <ChallengeActivity item={item} allItems={starterVillagePack.items} sessionId="s1" onComplete={vi.fn()} />
    );
    expect(screen.getByTestId("challenge-canvas-host")).toBeInTheDocument();
  });

  it("configures Phaser Scale Manager for canvas input mapping", async () => {
    const item = starterVillagePack.items.find((i) => i.id === "letter-A")!;
    render(
      <ChallengeActivity item={item} allItems={starterVillagePack.items} sessionId="s1" onComplete={vi.fn()} />
    );

    await waitFor(() => expect(vi.mocked(Phaser.Game)).toHaveBeenCalled());

    expect(vi.mocked(Phaser.Game).mock.calls[0][0]).toEqual(
      expect.objectContaining({
        scale: {
          mode: Phaser.Scale.FIT,
          autoCenter: Phaser.Scale.CENTER_BOTH,
        },
      })
    );
  });
});
