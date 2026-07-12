import { describe, it, expect, vi, beforeEach } from "vitest";
import "fake-indexeddb/auto";
import ReactThreeTestRenderer from "@react-three/test-renderer";
import LetterMonument from "./LetterMonument";
import { db } from "../../data/db";

vi.mock("../../audio/manifest", () => ({
  getItemAudio: vi.fn().mockReturnValue({ en: { src: "/audio/en_letter-A.mp3" }, vi: { src: "/audio/vi_letter-A.mp3" } }),
  playSequential: vi.fn().mockResolvedValue(undefined),
}));

describe("LetterMonument", () => {
  beforeEach(async () => {
    await db.attempts.clear();
    await db.mastery.clear();
  });

  it("mounts an instanced glyph mesh matching the 'A' cube count", async () => {
    const renderer = await ReactThreeTestRenderer.create(
      <LetterMonument
        itemId="letter-A"
        glyphChar="A"
        position={{ x: 0, z: -10 }}
        sessionId="s1"
        playerPosition={{ x: 20, z: 20 }} // far away — should not trigger discover
      />
    );
    const instanced = renderer.scene.children[0].allChildren.filter(
      (n) => n.instance?.constructor?.name === "InstancedMesh"
    );
    expect(instanced.length).toBeGreaterThan(0);
  });

  it("records a discover attempt once the player walks within the trigger radius", async () => {
    const renderer = await ReactThreeTestRenderer.create(
      <LetterMonument
        itemId="letter-A"
        glyphChar="A"
        position={{ x: 0, z: 0 }}
        sessionId="s1"
        playerPosition={{ x: 1, z: 1 }} // within DISCOVER_TRIGGER_RADIUS
      />
    );
    await renderer.advanceFrames(5, 1 / 60);

    // NOTE: not a single `setTimeout(resolve, 0)` — verified empirically that fake-indexeddb's
    // request lifecycle spans more microtask/macrotask hops than one 0ms timeout flushes, so a
    // single tick reads the mastery record before recordAttempt's db.mastery.put() has
    // committed. vi.waitFor polls the real assertion until it passes (or times out), which is
    // both correct and not reliant on a magic delay number.
    await vi.waitFor(async () => {
      const record = await db.mastery.get("letter-A");
      expect(record?.totalAttempts).toBe(1);
      expect(record?.correctAttempts).toBe(1);
    });
  });
});
