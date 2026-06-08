import type { Object3D } from "three";
import * as THREE from "three";
import type { AnatomyLayerId } from "./figoHitMapping";

type Rule = { re: RegExp; id: AnatomyLayerId };

/** Имена мешей GLB (латиница / типичные суффиксы DCC) → слой анатомии для подсказок. */
const RULES: Rule[] = [
  { re: /\b(cervix|cervical|шейк)\b/i, id: "cervix" },
  { re: /\b(endo(metr)?|lining|cavity|mucosa)\b/i, id: "endometrium" },
  { re: /\b(junct|\bjz\b|junctional|transition)\b/i, id: "junctional_zone" },
  { re: /\b(myometrium|myo|muscle)\b/i, id: "myometrium" },
  { re: /\b(subseros)\b/i, id: "subserosa" },
  { re: /\b(serosa|capsule|serous)\b/i, id: "serosa" },
];

export function inferAnatomyLayerFromMeshName(name: string): AnatomyLayerId | null {
  const n = name.trim();
  if (!n) return null;
  for (const r of RULES) {
    if (r.re.test(n)) return r.id;
  }
  return null;
}

export function applyAnatomyLayersUserData(root: Object3D): void {
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (!mesh.isMesh) return;
    const layer = inferAnatomyLayerFromMeshName(mesh.name);
    if (layer) mesh.userData.anatomyLayerId = layer;
  });
}
