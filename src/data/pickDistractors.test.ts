import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach } from "vitest";
import { pickDistractors } from "./pickDistractors";
import { db, recordAttempt } from "./db";
import { starterVillagePack } from "./lessonPacks/starter-village";

describe("pickDistractors", () => {
  beforeEach(async () => {
    await db.attempts.clear();
    await db.mastery.clear();
  });

  it("returns `count` distractors, none of which is the target item", async () => {
    const target = starterVillagePack.items.find((i) => i.id === "letter-A")!;
    const distractors = await pickDistractors(target, starterVillagePack.items, 3);
    expect(distractors).toHaveLength(3);
    expect(distractors.every((d) => d.id !== target.id)).toBe(true);
  });

  it("prioritizes items the learner recently got wrong when confused with the target", async () => {
    const target = starterVillagePack.items.find((i) => i.id === "letter-A")!;
    // simulate Victor repeatedly mis-tapping letter-B when shown letter-A
    await recordAttempt("letter-A", "find_it", false, "s1", 1000);
    await db.attempts.add({ itemId: "letter-B", activityType: "find_it", correct: false, timestampMs: 1000, sessionId: "s1" });
    const distractors = await pickDistractors(target, starterVillagePack.items, 2);
    expect(distractors.map((d) => d.id)).toContain("letter-B");
  });
});
