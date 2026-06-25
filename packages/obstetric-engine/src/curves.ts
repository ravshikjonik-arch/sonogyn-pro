import acCurve from "@repo/medical-reference-curves/biometry/ac.json";
import bpdCurve from "@repo/medical-reference-curves/biometry/bpd.json";
import flCurve from "@repo/medical-reference-curves/biometry/fl.json";
import hcCurve from "@repo/medical-reference-curves/biometry/hc.json";
import hlCurve from "@repo/medical-reference-curves/biometry/hl.json";
import ofdCurve from "@repo/medical-reference-curves/biometry/ofd.json";
import cerebellumCurve from "@repo/medical-reference-curves/brain/cerebellum_transverse.json";
import cisternaCurve from "@repo/medical-reference-curves/brain/cisterna_magna.json";
import lateralVentricleCurve from "@repo/medical-reference-curves/brain/lateral_ventricle.json";

import type { ReferenceCurveJson } from "./types";

export const BIOMETRY_CURVES = {
  bpd: bpdCurve as ReferenceCurveJson,
  ofd: ofdCurve as ReferenceCurveJson,
  hc: hcCurve as ReferenceCurveJson,
  ac: acCurve as ReferenceCurveJson,
  fl: flCurve as ReferenceCurveJson,
  hl: hlCurve as ReferenceCurveJson,
} as const;

export const BRAIN_CURVES = {
  lateral_ventricle: lateralVentricleCurve as ReferenceCurveJson,
  cisterna_magna: cisternaCurve as ReferenceCurveJson,
  cerebellum_transverse: cerebellumCurve as ReferenceCurveJson,
} as const;

export type BiometryCurveId = keyof typeof BIOMETRY_CURVES;
export type BrainCurveId = keyof typeof BRAIN_CURVES;

export function getBiometryCurve(id: BiometryCurveId): ReferenceCurveJson {
  return BIOMETRY_CURVES[id];
}

export function getBrainCurve(id: BrainCurveId): ReferenceCurveJson {
  return BRAIN_CURVES[id];
}
