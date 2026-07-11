import { describe, it, expect } from "vitest";
import { scoreCollectible } from "./scoreCollectible";

describe("scoreCollectible", () => {
  it("is true when the collected id matches the target id", () => {
    expect(scoreCollectible("letter-A", "letter-A")).toBe(true);
  });
  it("is false when the collected id does not match", () => {
    expect(scoreCollectible("letter-A", "letter-B")).toBe(false);
  });
});
