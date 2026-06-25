import crlCurve from "../../reference-curves/crl.json";
import dvCurve from "../../reference-curves/dv.json";
import fhrCurve from "../../reference-curves/fhr.json";
import mapCurve from "../../reference-curves/map.json";
import msdCurve from "../../reference-curves/msd.json";
import nasalBoneCurve from "../../reference-curves/nasal_bone.json";
import ntCurve from "../../reference-curves/nt.json";
import trCurve from "../../reference-curves/tricuspid_regurgitation.json";
import utaCurve from "../../reference-curves/uta.json";
import ysdCurve from "../../reference-curves/ysd.json";

import type { ReferenceCurveJson } from "./types";

export const REFERENCE_CURVES = {
  msd: msdCurve as ReferenceCurveJson,
  ysd: ysdCurve as ReferenceCurveJson,
  crl: crlCurve as ReferenceCurveJson,
  nt: ntCurve as ReferenceCurveJson,
  dv: dvCurve as ReferenceCurveJson,
  fhr: fhrCurve as ReferenceCurveJson,
  uta: utaCurve as ReferenceCurveJson,
  map: mapCurve as ReferenceCurveJson,
  nasal_bone: nasalBoneCurve as unknown as ReferenceCurveJson,
  tricuspid_regurgitation: trCurve as unknown as ReferenceCurveJson,
} as const;

export type CurveId = keyof typeof REFERENCE_CURVES;

export function getCurve(id: CurveId): ReferenceCurveJson {
  return REFERENCE_CURVES[id];
}
