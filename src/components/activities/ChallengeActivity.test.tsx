import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import ChallengeActivity from "./ChallengeActivity";
import { starterVillagePack } from "../../data/lessonPacks/starter-village";

vi.mock("phaser", () => ({
  default: {
    AUTO: 0,
    Game: vi.fn().mockImplementation(() => ({
      scene: { start: vi.fn() },
      destroy: vi.fn(),
    })),
    Scene: class {},
  },
}));

describe("ChallengeActivity", () => {
  it("mounts a canvas host div for Phaser to attach to", () => {
    const item = starterVillagePack.items.find((i) => i.id === "letter-A")!;
    render(
      <ChallengeActivity item={item} allItems={starterVillagePack.items} sessionId="s1" onComplete={vi.fn()} />
    );
    expect(screen.getByTestId("challenge-canvas-host")).toBeInTheDocument();
  });
});
