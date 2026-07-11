import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import FindItActivity from "./FindItActivity";
import { starterVillagePack } from "../../data/lessonPacks/starter-village";

// NOTE: the vi.mock factory below intentionally uses inline literal item objects rather than
// referencing the `starterVillagePack` import — vi.mock factories are hoisted above all import
// statements, so referencing an outer-scope import binding here throws a TDZ ReferenceError
// ("Cannot access '__vi_import_N__' before initialization") once FindItActivity.tsx imports
// pickDistractors. These literals mirror the real letter-B/letter-D starter-village items exactly.
vi.mock("../../data/pickDistractors", () => ({
  pickDistractors: vi.fn().mockResolvedValue([
    {
      id: "letter-B", kind: "letter", symbolUpper: "B", symbolLower: "b",
      audioEn: "/audio/en_letter-B.mp3", audioVi: "/audio/vi_letter-B.mp3",
      viLabel: "chữ B", distractorPoolIds: ["letter-A", "letter-D"],
    },
    {
      id: "letter-D", kind: "letter", symbolUpper: "D", symbolLower: "d",
      audioEn: "/audio/en_letter-D.mp3", audioVi: "/audio/vi_letter-D.mp3",
      viLabel: "chữ D", distractorPoolIds: ["letter-B", "letter-A"],
    },
  ]),
}));
vi.mock("../../data/db", () => ({ recordAttempt: vi.fn().mockResolvedValue({}) }));

describe("FindItActivity", () => {
  const target = starterVillagePack.items.find((i) => i.id === "letter-A")!;

  it("shows the target among 3 choices (1 correct + 2 distractors) and calls onComplete(true) on a correct tap", async () => {
    const onComplete = vi.fn();
    render(
      <FindItActivity item={target} allItems={starterVillagePack.items} sessionId="s1" onComplete={onComplete} />
    );
    await waitFor(() => expect(screen.getAllByRole("button", { name: /^[A-Za-z0-9]$/ })).toHaveLength(3));
    fireEvent.click(screen.getByRole("button", { name: "A" }));
    await waitFor(() => expect(onComplete).toHaveBeenCalledWith(true));
  });

  it("calls onComplete(false) on an incorrect tap", async () => {
    const onComplete = vi.fn();
    render(
      <FindItActivity item={target} allItems={starterVillagePack.items} sessionId="s1" onComplete={onComplete} />
    );
    await waitFor(() => expect(screen.getAllByRole("button", { name: /^[A-Za-z0-9]$/ })).toHaveLength(3));
    fireEvent.click(screen.getByRole("button", { name: "B" }));
    await waitFor(() => expect(onComplete).toHaveBeenCalledWith(false));
  });
});
