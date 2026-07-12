// src/App.test.tsx
import "fake-indexeddb/auto";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
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

vi.mock("./audio/manifest", () => ({
  getItemAudio: vi.fn().mockReturnValue({ en: { src: "/audio/en_letter-A.mp3" }, vi: { src: "/audio/vi_letter-A.mp3" } }),
  playSequential: vi.fn().mockResolvedValue(undefined),
}));

// jsdom does not implement ResizeObserver, and @react-three/fiber's real <Canvas> depends on
// it via react-use-measure when mounted through plain @testing-library/react render() (unlike
// @react-three/test-renderer-based component tests elsewhere in this codebase). A no-op stub
// is sufficient for this smoke test, which never needs real resize behavior.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
if (typeof window.ResizeObserver === "undefined") {
  window.ResizeObserver = ResizeObserverStub;
}

describe("App", () => {
  it("renders the app shell without crashing", () => {
    render(<App />);
    expect(screen.getByTestId("app-shell")).toBeInTheDocument();
  });
});

describe("App — Milestone 1 3D world entry", () => {
  afterEach(() => vi.restoreAllMocks());

  it("renders the 3D world canvas host as the default screen", () => {
    // Force the WebGL-available path — jsdom's real getContext("webgl"/"webgl2") throws
    // "Not implemented" and isWebGLAvailable() catches that and returns false, which would
    // otherwise render WorldFallback instead of the Canvas host this test looks for.
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({} as RenderingContext);
    render(<App />);
    expect(screen.getByTestId("app-shell")).toBeInTheDocument();
    expect(screen.getByTestId("world-canvas-host")).toBeInTheDocument();
  });
});
