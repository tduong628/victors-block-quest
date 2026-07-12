import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import "fake-indexeddb/auto";
import WorldCanvas from "./WorldCanvas";

vi.mock("../audio/manifest", () => ({
  getItemAudio: vi.fn().mockReturnValue({ en: { src: "/audio/en_letter-A.mp3" }, vi: { src: "/audio/vi_letter-A.mp3" } }),
  playSequential: vi.fn().mockResolvedValue(undefined),
}));

// jsdom does not implement ResizeObserver (verified directly), and @react-three/fiber's
// <Canvas> depends on it via react-use-measure — mounting a real Canvas via plain
// @testing-library/react render() (as the second test below does, unlike the
// @react-three/test-renderer-based component tests elsewhere in this codebase) throws
// "This browser does not support ResizeObserver" without this stub. A no-op stub is
// sufficient: this smoke test only asserts DOM presence, it never needs real resize behavior.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
if (typeof window.ResizeObserver === "undefined") {
  window.ResizeObserver = ResizeObserverStub;
}

describe("WorldCanvas", () => {
  afterEach(() => vi.restoreAllMocks());

  it("renders the fallback message when WebGL is unavailable", () => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
    render(<WorldCanvas sessionId="s1" />);
    expect(screen.getByText(/3d graphics/i)).toBeInTheDocument();
  });

  it("renders the joystick overlay and canvas host when WebGL is available", () => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({} as RenderingContext);
    render(<WorldCanvas sessionId="s1" />);
    expect(screen.getByTestId("joystick-base")).toBeInTheDocument();
    expect(screen.getByTestId("world-canvas-host")).toBeInTheDocument();
  });
});
