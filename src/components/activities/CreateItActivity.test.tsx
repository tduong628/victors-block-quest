import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import CreateItActivity from "./CreateItActivity";
import type { LessonItem } from "../../types/lesson";

vi.mock("../../data/artwork", () => ({ saveArtwork: vi.fn().mockResolvedValue({}) }));

const item: LessonItem = {
  id: "letter-A", kind: "letter", symbolUpper: "A", symbolLower: "a",
  audioEn: "/audio/en_letter-A.mp3", audioVi: "/audio/vi_letter-A.mp3",
  viLabel: "chữ A", distractorPoolIds: ["letter-B"],
};

describe("CreateItActivity", () => {
  it("shows a color palette and a Save button, and calls onComplete after saving", async () => {
    const onComplete = vi.fn();
    render(<CreateItActivity item={item} onComplete={onComplete} />);
    expect(screen.getByTestId("create-canvas")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /save/i }));
    // handleSave awaits saveArtwork() before calling onComplete(), so the callback fires on a
    // microtask after the click — waitFor lets that resolve before asserting.
    await waitFor(() => expect(onComplete).toHaveBeenCalled());
  });
});
