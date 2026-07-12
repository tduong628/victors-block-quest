import { describe, it, expect, vi, beforeEach } from "vitest";
import "fake-indexeddb/auto";
import ReactThreeTestRenderer from "@react-three/test-renderer";
import Scene from "./Scene";
import { db } from "../data/db";

vi.mock("../audio/manifest", () => ({
  getItemAudio: vi.fn().mockReturnValue({ en: { src: "/audio/en_letter-A.mp3" }, vi: { src: "/audio/vi_letter-A.mp3" } }),
  playSequential: vi.fn().mockResolvedValue(undefined),
}));

describe("Scene", () => {
  beforeEach(async () => {
    await db.attempts.clear();
    await db.mastery.clear();
  });

  it("mounts the cub, world dressing, and the letter-A monument together without crashing", async () => {
    const renderer = await ReactThreeTestRenderer.create(<Scene sessionId="s1" />);
    // NOTE: not `renderer.scene.children[0].allChildren` — Scene's top-level output is a
    // Fragment with 4 sibling nodes (sky mesh, WorldDressing, VoxelCub, LetterMonument), not a
    // single wrapping element, so `children[0]` is only the sky mesh and its own descendants
    // (verified empirically: renderer.scene.children.length === 4). `renderer.scene.allChildren`
    // walks every top-level node's subtree, which is what "somewhere in the whole scene" means.
    const cub = renderer.scene.allChildren.find((n) => n.props?.name === "voxel-cub");
    const monument = renderer.scene.allChildren.find((n) => n.props?.name === "letter-monument");
    expect(cub).toBeDefined();
    expect(monument).toBeDefined();
  });
});
