import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Object3D, InstancedMesh } from "three";
import { P3 } from "../materials/palette3d";
import { createToonMaterial } from "../materials/toon";
import { WORLD_BOUND } from "../rig/collision";

const PLATEAU_SIZE = WORLD_BOUND * 2 + 4;
const FENCE_POST_COUNT = 28;
const TREE_COUNT = 4;
const CLOUD_COUNT = 3;

const dummy = new Object3D(); // reused scratch object — no per-frame allocations (DESIGN_SPEC_3D.md §6)

// B1 Toy Village Green: a bounded grassy plateau with a fence marking the AABB bound, a path
// to the monument, sparse instanced trees, and drifting cloud billboards. Kept sparse on
// purpose — perf headroom first (DESIGN_SPEC_3D.md §7.2).
export default function WorldDressing() {
  const grassMat = createToonMaterial(P3.grass);
  const fenceMat = createToonMaterial(P3.fence);
  const pathMat = createToonMaterial(P3.path);
  const foliageMat = createToonMaterial(P3.foliage);
  const trunkMat = createToonMaterial(P3.trunk);
  const cloudMat = createToonMaterial(P3.cloud);

  const fenceRef = useRef<InstancedMesh>(null);
  const treesRef = useRef<InstancedMesh>(null);
  const cloudsRef = useRef<InstancedMesh>(null);

  const fencePositions = useMemo(() => {
    const positions: [number, number, number][] = [];
    for (let i = 0; i < FENCE_POST_COUNT; i++) {
      const angle = (i / FENCE_POST_COUNT) * Math.PI * 2;
      positions.push([Math.cos(angle) * WORLD_BOUND, 0.5, Math.sin(angle) * WORLD_BOUND]);
    }
    return positions;
  }, []);

  const treePositions = useMemo(
    () =>
      Array.from({ length: TREE_COUNT }, (_, i) => {
        const angle = (i / TREE_COUNT) * Math.PI * 2 + 0.6;
        const radius = WORLD_BOUND * 0.6;
        return [Math.cos(angle) * radius, 0.6, Math.sin(angle) * radius] as [number, number, number];
      }),
    []
  );

  useFrame(() => {
    if (fenceRef.current) {
      fencePositions.forEach((pos, i) => {
        dummy.position.set(...pos);
        dummy.updateMatrix();
        fenceRef.current!.setMatrixAt(i, dummy.matrix);
      });
      fenceRef.current.instanceMatrix.needsUpdate = true;
    }
    if (treesRef.current) {
      treePositions.forEach((pos, i) => {
        dummy.position.set(...pos);
        dummy.updateMatrix();
        treesRef.current!.setMatrixAt(i, dummy.matrix);
      });
      treesRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} material={grassMat}>
        <planeGeometry args={[PLATEAU_SIZE, PLATEAU_SIZE, 8, 8]} />
      </mesh>
      <mesh position={[0, 0.01, -WORLD_BOUND / 2]} rotation={[-Math.PI / 2, 0, 0]} material={pathMat}>
        <planeGeometry args={[1.5, WORLD_BOUND]} />
      </mesh>
      <instancedMesh ref={fenceRef} args={[undefined, undefined, FENCE_POST_COUNT]} material={fenceMat}>
        <cylinderGeometry args={[0.08, 0.08, 1]} />
      </instancedMesh>
      <instancedMesh ref={treesRef} args={[undefined, undefined, TREE_COUNT]} material={foliageMat}>
        <coneGeometry args={[0.5, 1.2, 6]} />
      </instancedMesh>
      {Array.from({ length: CLOUD_COUNT }, (_, i) => (
        <mesh key={i} position={[i * 6 - 6, 8, -10]} material={cloudMat}>
          <boxGeometry args={[1.5, 0.5, 1]} />
        </mesh>
      ))}
      <mesh position={[0, -0.01, 0]}>
        <ringGeometry args={[WORLD_BOUND - 0.1, WORLD_BOUND + 0.1, 32]} />
        <meshBasicMaterial color={P3.fence} />
      </mesh>
    </group>
  );
}
