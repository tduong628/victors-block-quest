import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import MatchItActivity from "./MatchItActivity";
import { starterVillagePack } from "../../data/lessonPacks/starter-village";

vi.mock("../../data/db", () => ({ recordAttempt: vi.fn().mockResolvedValue({}) }));

describe("MatchItActivity — letters", () => {
  const item = starterVillagePack.items.find((i) => i.id === "letter-A")!;

  it("shows the uppercase prompt and calls onComplete(true) when the matching lowercase is tapped", async () => {
    const onComplete = vi.fn();
    render(<MatchItActivity item={item} sessionId="s1" onComplete={onComplete} />);
    expect(screen.getByTestId("match-prompt")).toHaveTextContent("A");
    fireEvent.click(screen.getByRole("button", { name: "a" }));
    await waitFor(() => expect(onComplete).toHaveBeenCalledWith(true));
  });
});
