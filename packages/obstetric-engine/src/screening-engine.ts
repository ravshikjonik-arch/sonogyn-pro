import { assessAllBiometry, assessEfwHadlockIv } from "./biometry-engine";
import { assessAllBrain, assessBrainFindings } from "./brain-engine";
import {
  assessGrowthCategory,
  assessSkeletonFindings,
  computeSkeletonIndices,
} from "./clinical-findings";
import { gaWeeksDecimal } from "./measure";
import type { SecondThirdScreeningInput, SecondThirdScreeningOutput } from "./types";

export const OBSTETRIC_ENGINE_DISCLAIMER =
  "Референсы Medvedev 2016 / ISUOG — не идентичны Astraia. PDF Uzicenter 30–34 н. — OCR pending. Не диагноз; интерпретация — специалист.";

/** Полный расчёт II/III скрининга (этап 1: фетометрия + мозг + индексы + CDS). */
export function assessSecondThirdScreening(
  input: SecondThirdScreeningInput,
): SecondThirdScreeningOutput {
  const gaDecimal = gaWeeksDecimal(input.gaWeeks, input.gaDays ?? 0);
  const biometry = assessAllBiometry(input);
  const brain = assessAllBrain(input);
  const measurements = [...biometry, ...brain];
  const efw = assessEfwHadlockIv(input, biometry);
  const skeletonIndices = computeSkeletonIndices(input, measurements);

  const findings = [
    ...assessBrainFindings(brain),
    ...assessSkeletonFindings(biometry),
    assessGrowthCategory(efw?.percentile),
  ].filter(Boolean) as import("./types").ClinicalFinding[];

  return {
    gaWeeksDecimal: gaDecimal,
    measurements,
    efw,
    skeletonIndices,
    findings,
  };
}
