import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import ParentGate from "./ParentGate";

describe("ParentGate", () => {
  it("shows a math question only after holding the gate button, and unlocks only on the correct answer", async () => {
    vi.useFakeTimers();
    const onUnlock = vi.fn();
    render(<ParentGate onUnlock={onUnlock} holdMs={100} />);

    expect(screen.queryByTestId("parent-math-question")).not.toBeInTheDocument();

    fireEvent.mouseDown(screen.getByTestId("parent-gate-hold"));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(150);
    });
    expect(screen.getByTestId("parent-math-question")).toBeInTheDocument();

    const question = screen.getByTestId("parent-math-question").textContent ?? "";
    const match = question.match(/(\d+)\s*\+\s*(\d+)/);
    expect(match).not.toBeNull();
    const [, a, b] = match!;
    const correctAnswer = String(Number(a) + Number(b));

    fireEvent.change(screen.getByTestId("parent-math-input"), { target: { value: "0" } });
    fireEvent.click(screen.getByRole("button", { name: /submit/i }));
    expect(onUnlock).not.toHaveBeenCalled();

    fireEvent.change(screen.getByTestId("parent-math-input"), { target: { value: correctAnswer } });
    fireEvent.click(screen.getByRole("button", { name: /submit/i }));
    expect(onUnlock).toHaveBeenCalledOnce();

    vi.useRealTimers();
  });

  it("does not show the math question if the hold is released early", () => {
    vi.useFakeTimers();
    render(<ParentGate onUnlock={vi.fn()} holdMs={3000} />);
    fireEvent.mouseDown(screen.getByTestId("parent-gate-hold"));
    vi.advanceTimersByTime(500);
    fireEvent.mouseUp(screen.getByTestId("parent-gate-hold"));
    vi.advanceTimersByTime(3000);
    expect(screen.queryByTestId("parent-math-question")).not.toBeInTheDocument();
    vi.useRealTimers();
  });

  // Regression test for a real bug found via live-browser getBoundingClientRect
  // inspection: the math-question screen was a plain document-flow div, so when
  // it rendered as a sibling AFTER a taller-than-viewport map component, it landed
  // far below the fold and was invisible to a parent who just completed the hold.
  //
  // IMPORTANT jsdom limitation, verified empirically before relying on this: jsdom's
  // getComputedStyle() does NOT resolve Tailwind-generated utility CSS in this project
  // (confirmed by importing src/index.css directly into a probe test and reading
  // getComputedStyle(el).position/.top/.zIndex on a `fixed inset-0 z-50` element -
  // all three came back as empty strings, not real values). jsdom has no layout engine
  // and does not run Vite's PostCSS/Tailwind pipeline against arbitrary test-rendered
  // markup, so this test CANNOT prove the element is actually viewport-anchored in a
  // real browser - that guarantee still depends on manual/E2E verification. What this
  // test CAN prove, and does prove: the rendered element carries the specific className
  // tokens (`fixed`, `inset-0`, a `z-*` layer) that take it out of document flow, so a
  // future regression that silently drops `fixed`/`inset-0` back to a flow-positioned
  // div (as the original bug did) will fail this test immediately.
  it("renders the math-question overlay with viewport-anchored positioning classes, not document-flow classes", async () => {
    vi.useFakeTimers();
    render(<ParentGate onUnlock={vi.fn()} holdMs={100} />);

    fireEvent.mouseDown(screen.getByTestId("parent-gate-hold"));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(150);
    });

    const overlay = screen.getByTestId("parent-math-question").closest('[data-surface="parent"]');
    expect(overlay).not.toBeNull();
    const classList = Array.from(overlay!.classList);

    expect(classList).toContain("fixed");
    expect(classList).toContain("inset-0");
    expect(classList.some((c) => /^z-\d+$/.test(c))).toBe(true);
    // Guard against the exact regression: a bare `h-full` flow div with no
    // fixed/absolute escape hatch, which is what shipped the original bug.
    expect(classList).not.toContain("h-full");

    vi.useRealTimers();
  });
});
