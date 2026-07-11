import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import DiscoverActivity from "./DiscoverActivity";
import type { LessonItem } from "../../types/lesson";

vi.mock("../../audio/manifest", () => ({
  getItemAudio: () => ({ en: { src: "/audio/en_letter-A.mp3" }, vi: { src: "/audio/vi_letter-A.mp3" } }),
  playSequential: vi.fn().mockResolvedValue(undefined),
}));

const item: LessonItem = {
  id: "letter-A", kind: "letter", symbolUpper: "A", symbolLower: "a",
  audioEn: "/audio/en_letter-A.mp3", audioVi: "/audio/vi_letter-A.mp3",
  viLabel: "chữ A", distractorPoolIds: ["letter-B", "letter-D"],
};

describe("DiscoverActivity", () => {
  it("shows the giant symbol", () => {
    render(<DiscoverActivity item={item} onComplete={vi.fn()} />);
    expect(screen.getByTestId("discover-symbol")).toHaveTextContent("A");
  });

  it("calls onComplete when the child taps Continue", () => {
    const onComplete = vi.fn();
    render(<DiscoverActivity item={item} onComplete={onComplete} />);
    fireEvent.click(screen.getByRole("button", { name: /continue/i }));
    expect(onComplete).toHaveBeenCalledOnce();
  });
});
