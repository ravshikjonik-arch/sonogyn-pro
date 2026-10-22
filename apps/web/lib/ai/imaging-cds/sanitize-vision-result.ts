import type { UsVisionAnalysisResult } from "@/lib/ai/us-vision/types";

const CATEGORY_IN_SCORECARD = /\b(O-RADS|BI-RADS|BIRADS)\s*[0-6][ABC]?\b/i;

/**
 * Vision layer must not feed final categories into rule engines.
 * Strip frame-level orads/birads and category-like scorecards; keep narrative findings.
 */
export function sanitizeVisionForRuleEngine(vision: UsVisionAnalysisResult): UsVisionAnalysisResult {
  const frames = vision.frames.map((frame) => {
    const { birads: _b, orads: _o, ...rest } = frame;
    return {
      ...rest,
      findings: [
        ...rest.findings,
        ...(frame.scanErrors?.length ? [`scanErrors: ${frame.scanErrors.join("; ")}`] : []),
      ],
    };
  });

  let scorecard = vision.scorecard ?? null;
  if (scorecard && CATEGORY_IN_SCORECARD.test(scorecard)) {
    scorecard = "Признаки по снимку требуют подтверждения врачом; категория — только из калькулятора.";
  }

  let impression = vision.impression;
  if (CATEGORY_IN_SCORECARD.test(impression)) {
    impression = impression.replace(CATEGORY_IN_SCORECARD, "категория не назначена автоматически");
  }

  return {
    ...vision,
    frames,
    scorecard,
    impression,
    pipeline: `${vision.pipeline}+cds-sanitize`,
  };
}
