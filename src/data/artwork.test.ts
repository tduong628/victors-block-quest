import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach } from "vitest";
import { db } from "./db";
import { saveArtwork, getArtworkForItem } from "./artwork";

describe("artwork storage", () => {
  beforeEach(async () => {
    await db.artwork.clear();
  });

  it("saves and retrieves artwork for an item", async () => {
    await saveArtwork("letter-A", "data:image/png;base64,AAA");
    const saved = await getArtworkForItem("letter-A");
    expect(saved).toHaveLength(1);
    expect(saved[0].dataUrl).toBe("data:image/png;base64,AAA");
  });
});
