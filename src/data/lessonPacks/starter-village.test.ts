import { describe, it, expect } from "vitest";
import { starterVillagePack, lessonPackSchema } from "./starter-village";

describe("starterVillagePack", () => {
  it("validates against the lesson pack schema", () => {
    expect(() => lessonPackSchema.parse(starterVillagePack)).not.toThrow();
  });

  it("contains exactly 10 items: letters A-E and numbers 0-4", () => {
    const ids = starterVillagePack.items.map((i) => i.id).sort();
    expect(ids).toEqual([
      "letter-A", "letter-B", "letter-C", "letter-D", "letter-E",
      "number-0", "number-1", "number-2", "number-3", "number-4",
    ]);
  });

  it("every letter item has a lowercase symbol; every number item does not", () => {
    for (const item of starterVillagePack.items) {
      if (item.kind === "letter") expect(item.symbolLower).toBeTruthy();
      if (item.kind === "number") expect(item.symbolLower).toBeUndefined();
    }
  });

  it("every item has at least 2 distractor pool entries pointing at other valid item ids", () => {
    const validIds = new Set(starterVillagePack.items.map((i) => i.id));
    for (const item of starterVillagePack.items) {
      expect(item.distractorPoolIds.length).toBeGreaterThanOrEqual(2);
      for (const d of item.distractorPoolIds) {
        expect(validIds.has(d)).toBe(true);
        expect(d).not.toBe(item.id);
      }
    }
  });

  it("every item's audioEn/audioVi paths follow the en_<id>.mp3 / vi_<id>.mp3 convention", () => {
    for (const item of starterVillagePack.items) {
      expect(item.audioEn).toBe(`/audio/en_${item.id}.mp3`);
      expect(item.audioVi).toBe(`/audio/vi_${item.id}.mp3`);
    }
  });
});
