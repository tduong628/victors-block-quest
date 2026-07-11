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
});
