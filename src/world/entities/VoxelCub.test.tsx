import { describe, it, expect } from "vitest";
import ReactThreeTestRenderer from "@react-three/test-renderer";
import VoxelCub from "./VoxelCub";

describe("VoxelCub", () => {
  it("mounts a group containing mesh primitives, under the perf budget (<500 tris means <~15 primitive meshes for M1's simple boxes)", async () => {
    const renderer = await ReactThreeTestRenderer.create(
      <VoxelCub position={{ x: 0, z: 0 }} heading={0} speedNorm={0} />
    );
    const meshes = renderer.scene.children[0].allChildren.filter((n) => n.type === "Mesh");
    expect(meshes.length).toBeGreaterThan(0);
    expect(meshes.length).toBeLessThan(15);
  });
});
