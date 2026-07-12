import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import WorldFallback, { isWebGLAvailable } from "./WorldFallback";

describe("isWebGLAvailable", () => {
  afterEach(() => vi.restoreAllMocks());

  it("returns true when the canvas can produce a webgl context", () => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({} as RenderingContext);
    expect(isWebGLAvailable()).toBe(true);
  });

  it("returns false when getContext returns null for webgl", () => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
    expect(isWebGLAvailable()).toBe(false);
  });
});

describe("WorldFallback", () => {
  it("renders a legible message, never a blank screen", () => {
    render(<WorldFallback />);
    expect(screen.getByText(/3d graphics/i)).toBeInTheDocument();
  });
});
