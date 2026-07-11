import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import ParentDashboard from "./ParentDashboard";

vi.mock("../data/db", () => ({
  getAllMastery: vi.fn().mockResolvedValue([
    { itemId: "letter-A", status: "mastered", totalAttempts: 6, correctAttempts: 6, sessionsWithAttempt: ["s1", "s2"], lastPlayedMs: 1000, lastCorrectMs: 1000 },
    { itemId: "number-0", status: "practicing", totalAttempts: 2, correctAttempts: 1, sessionsWithAttempt: ["s1"], lastPlayedMs: 900, lastCorrectMs: 900 },
  ]),
}));

describe("ParentDashboard", () => {
  it("renders a row per item with accuracy computed from correct/total attempts", async () => {
    render(<ParentDashboard onClose={vi.fn()} />);
    await waitFor(() => expect(screen.getByTestId("dashboard-row-letter-A")).toBeInTheDocument());
    expect(screen.getByTestId("dashboard-row-letter-A")).toHaveTextContent("100%");
    expect(screen.getByTestId("dashboard-row-number-0")).toHaveTextContent("50%");
  });

  it("calls onClose when the close button is tapped", async () => {
    const onClose = vi.fn();
    render(<ParentDashboard onClose={onClose} />);
    await waitFor(() => screen.getByTestId("dashboard-row-letter-A"));
    screen.getByRole("button", { name: /close/i }).click();
    expect(onClose).toHaveBeenCalledOnce();
  });
});
