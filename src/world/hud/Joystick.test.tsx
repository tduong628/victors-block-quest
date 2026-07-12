import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeAll } from "vitest";
import Joystick from "./Joystick";

describe("Joystick", () => {
  beforeAll(() => {
    // jsdom does not implement PointerEvent (verified: typeof window.PointerEvent === "undefined"
    // in this project's jsdom 25.0.1), so fireEvent.pointerDown/pointerMove fall back to a
    // generic Event that drops clientX/clientY entirely, producing NaN through the vector math.
    // MouseEvent carries the same clientX/clientY/pointerId-relevant fields our code reads, and
    // the codebase already has local per-file jsdom-gap polyfills of this shape
    // (see CreateItActivity.test.tsx's setPointerCapture guard) rather than a global shim.
    if (typeof window.PointerEvent === "undefined") {
      // @ts-expect-error jsdom has no PointerEvent constructor to satisfy the real type here.
      window.PointerEvent = window.MouseEvent;
    }
  });

  it("has a >=44px thumb hit area (target-size floor) and reports vector changes on drag", () => {
    const onVectorChange = vi.fn();
    render(<Joystick onVectorChange={onVectorChange} />);
    const base = screen.getByTestId("joystick-base");
    expect(base).toBeInTheDocument();

    fireEvent.pointerDown(base, { clientX: 100, clientY: 100 });
    fireEvent.pointerMove(base, { clientX: 130, clientY: 100 });
    expect(onVectorChange).toHaveBeenCalled();
    const lastCall = onVectorChange.mock.calls[onVectorChange.mock.calls.length - 1][0];
    expect(lastCall.magnitude).toBeGreaterThan(0);
  });
});
