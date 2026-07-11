import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import StarterVillageMap from "./StarterVillageMap";
import { starterVillagePack } from "../data/lessonPacks/starter-village";

vi.mock("../data/db", () => ({
  getAllMastery: vi.fn().mockResolvedValue([
    { itemId: "letter-A", status: "mastered", totalAttempts: 6, correctAttempts: 6, sessionsWithAttempt: ["s1", "s2"], lastPlayedMs: 0, lastCorrectMs: 0 },
  ]),
}));
vi.mock("./LessonRunner", () => ({
  default: ({ onLessonComplete }: any) => (
    <button onClick={() => onLessonComplete({ itemId: "letter-B", activitiesCorrect: 5, activitiesTotal: 5 })}>
      finish-lesson
    </button>
  ),
}));

describe("StarterVillageMap", () => {
  it("renders 10 nodes and shows letter-A's mastered badge from live data", async () => {
    render(<StarterVillageMap pack={starterVillagePack} sessionId="s1" />);
    expect(await screen.findAllByTestId(/^village-node-/)).toHaveLength(10);
    expect(screen.getByTestId("village-node-letter-A")).toHaveTextContent(/mastered/i);
  });

  // Regression for the visual bug found via live browser inspection: the DOM-assertion tests
  // above pass even when every node is rendered with opacity: 0 (present, correctly labelled,
  // and clickable, but visually invisible), because they never look at computed style. Framer
  // Motion drives its spring animations by writing directly to each element's inline `style`
  // (not real CSS @keyframes), so jsdom + real timers CAN observe the resolved opacity here —
  // this asserts on that inline style rather than trusting DOM presence/text alone.
  it("animates every node's opacity to 1 after the drop-and-snap entrance settles", async () => {
    const { container } = render(<StarterVillageMap pack={starterVillagePack} sessionId="s1" />);
    await screen.findAllByTestId(/^village-node-/);

    await waitFor(
      () => {
        const nodes = container.querySelectorAll('[data-testid^="village-node-"]');
        expect(nodes).toHaveLength(10);
        nodes.forEach((node) => {
          expect(getComputedStyle(node).opacity).toBe("1");
        });
      },
      // 900ms is a deliberately tight deadline: the fixed entrance settles well under this
      // (~500-600ms observed), but the pre-fix implementation (uncapped index * 0.05 delay
      // stacked behind snapSpring's ~700-900ms settle time) could take up to ~1.5s for the
      // last node, so this bound is what actually distinguishes fixed from broken — a looser
      // timeout would pass against the old code too and prove nothing.
      { timeout: 900, interval: 25 }
    );
  });

  it("opens LessonRunner on tap and returns to the map after lesson completion", async () => {
    render(<StarterVillageMap pack={starterVillagePack} sessionId="s1" />);
    await waitFor(() => screen.getAllByTestId(/^village-node-/));
    fireEvent.click(screen.getByTestId("village-node-letter-B"));
    expect(await screen.findByText("finish-lesson")).toBeInTheDocument();
    fireEvent.click(screen.getByText("finish-lesson"));
    await waitFor(() => expect(screen.queryByText("finish-lesson")).not.toBeInTheDocument());
  });
});
