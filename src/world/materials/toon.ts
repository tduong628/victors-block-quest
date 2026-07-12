import * as THREE from "three";

// A tiny 3x1px gradient ramp shared by every material — this is what gives flat-shaded
// low-poly geometry its "sunlit top / soft shadow" read at near-zero GPU cost (no shadow
// maps, no PBR — see DESIGN_SPEC_3D.md §2 and §6 for why this matters on a tablet).
let sharedGradientMap: THREE.DataTexture | null = null;

function getGradientMap(): THREE.DataTexture {
  if (sharedGradientMap) return sharedGradientMap;
  const data = new Uint8Array([64, 64, 64, 160, 160, 160, 255, 255, 255]); // shadow, mid, lit
  const texture = new THREE.DataTexture(data, 3, 1, THREE.RGBFormat);
  texture.magFilter = THREE.NearestFilter;
  texture.needsUpdate = true;
  sharedGradientMap = texture;
  return sharedGradientMap;
}

export function createToonMaterial(hue: string): THREE.MeshToonMaterial {
  return new THREE.MeshToonMaterial({ color: hue, gradientMap: getGradientMap() });
}
