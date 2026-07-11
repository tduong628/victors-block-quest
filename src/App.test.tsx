// src/App.test.tsx
import "fake-indexeddb/auto";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import App from "./App";

// App now renders StarterVillageMap -> LessonRunner -> ChallengeActivity, which imports the real
// "phaser" package. Importing real Phaser under jsdom crashes at module-load time (its
// CanvasFeatures device-detection calls canvas.getContext("2d") synchronously, which jsdom does
// not implement — see src/game/ChallengeScene.test.ts for the same fix applied there). This test
// only asserts the app shell renders, so mocking phaser here is behavior-preserving.
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

describe("App", () => {
  it("renders the app shell without crashing", () => {
    render(<App />);
    expect(screen.getByTestId("app-shell")).toBeInTheDocument();
  });
});
