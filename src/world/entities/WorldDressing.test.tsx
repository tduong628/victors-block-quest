import { describe, it, expect } from "vitest";
import ReactThreeTestRenderer from "@react-three/test-renderer";
import WorldDressing from "./WorldDressing";

describe("WorldDressing", () => {
  it("mounts without crashing and includes at least one instanced mesh (perf: instance repeats, DESIGN_SPEC_3D.md §6)", async () => {
    const renderer = await ReactThreeTestRenderer.create(<WorldDressing />);
    // NOTE: not `n.type === "InstancedMesh"` — in three@0.185.1, InstancedMesh no longer sets
    // `this.type = "InstancedMesh"` (only the `isInstancedMesh` boolean flag); it inherits
    // Mesh's `this.type = "Mesh"`, so every Mesh-family node reports type "Mesh" regardless of
    // subclass (verified empirically). constructor.name is what actually distinguishes them.
    const instanced = renderer.scene.children[0].allChildren.filter(
      (n) => n.instance?.constructor?.name === "InstancedMesh"
    );
    expect(instanced.length).toBeGreaterThan(0);
  });
});
