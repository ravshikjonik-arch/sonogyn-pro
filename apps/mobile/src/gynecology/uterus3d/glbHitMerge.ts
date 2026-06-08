import type { Vector3 } from "three";
import {
  ANATOMY_LAYER_LABEL_RU,
  analyzeUterusHit,
  buildUterusHitFromParts,
  type AnatomyLayerId,
  type UterusHitResult,
} from "./figoHitMapping";

function representativeFigoForNamedMesh(layerId: AnatomyLayerId, pedunculated: boolean): number {
  switch (layerId) {
    case "endometrium":
      return pedunculated ? 0 : 2;
    case "junctional_zone":
      return 3;
    case "myometrium":
      return 4;
    case "subserosa":
      return 6;
    case "serosa":
      return pedunculated ? 7 : 6;
    case "cervix":
      return 8;
    default:
      return 4;
  }
}

/** Объединяет геометрическую глубину (Lathe-пространство) с именованным слоем GLB-меша. */
export function mergeGlbNamedMeshHit(
  meshLayer: AnatomyLayerId | null | undefined,
  localPoint: Vector3,
  pedunculated: boolean
): UterusHitResult {
  const geometric = analyzeUterusHit(localPoint, pedunculated);
  if (!meshLayer) return geometric;

  const figo = representativeFigoForNamedMesh(meshLayer, pedunculated);
  return buildUterusHitFromParts({
    figoType: figo,
    layerId: meshLayer,
    layerLabelRu: ANATOMY_LAYER_LABEL_RU[meshLayer],
    depth01: geometric.depth01,
    note: "именованный меш GLB",
  });
}
