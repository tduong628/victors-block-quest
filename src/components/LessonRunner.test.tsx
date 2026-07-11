import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import LessonRunner from "./LessonRunner";
import { starterVillagePack } from "../data/lessonPacks/starter-village";

vi.mock("./activities/DiscoverActivity", () => ({
  default: ({ onComplete }: any) => <button onClick={onComplete}>discover-done</button>,
}));
vi.mock("./activities/FindItActivity", () => ({
  default: ({ onComplete }: any) => <button onClick={() => onComplete(true)}>find-it-done</button>,
}));
vi.mock("./activities/MatchItActivity", () => ({
  default: ({ onComplete }: any) => <button onClick={() => onComplete(true)}>match-it-done</button>,
}));
vi.mock("./activities/CreateItActivity", () => ({
  default: ({ onComplete }: any) => <button onClick={onComplete}>create-it-done</button>,
}));
vi.mock("./activities/ChallengeActivity", () => ({
  default: ({ onComplete }: any) => <button onClick={() => onComplete(true)}>challenge-done</button>,
}));

describe("LessonRunner", () => {
  it("runs Discover first, Challenge last, and calls onLessonComplete after all 5 activities finish", async () => {
    const onLessonComplete = vi.fn();
    const item = starterVillagePack.items.find((i) => i.id === "letter-A")!;
    render(
      <LessonRunner item={item} pack={starterVillagePack} sessionId="s1" onLessonComplete={onLessonComplete} />
    );

    expect(screen.getByText("discover-done")).toBeInTheDocument();
    fireEvent.click(screen.getByText("discover-done"));

    // three middle activities in some order — click whichever renders each time, 3 times
    for (let i = 0; i < 3; i++) {
      const btn = await screen.findByText(/-done$/);
      expect(btn.textContent).not.toBe("discover-done");
      expect(btn.textContent).not.toBe("challenge-done");
      fireEvent.click(btn);
    }

    expect(await screen.findByText("challenge-done")).toBeInTheDocument();
    fireEvent.click(screen.getByText("challenge-done"));

    await waitFor(() => expect(onLessonComplete).toHaveBeenCalledOnce());
    const result = onLessonComplete.mock.calls[0][0];
    expect(result.itemId).toBe("letter-A");
    expect(result.activitiesTotal).toBe(5);
  });
});
