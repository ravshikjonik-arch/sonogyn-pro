import { wrapClinicalSupportBundle } from "@/lib/ai/safety";
import type { UsVisionAnalysisResult } from "@/lib/ai/us-vision/types";
import type { AgentArtifact } from "@/lib/ai/types";
import type { OrchestratorContext } from "@/lib/ai/types";

/** Vision + multimodal hook — подключается к /api/ai/analyze results. */
export async function runUltrasoundAnalysisAgent(
  ctx: OrchestratorContext,
  vision?: UsVisionAnalysisResult | null,
): Promise<AgentArtifact> {
  if (vision) {
    const bundle = wrapClinicalSupportBundle({
      summary: vision.studySummary,
      findings: vision.frames.flatMap((f) =>
        f.findings.map((detail) => ({
          title: f.planeGuess ?? "Кадр УЗИ",
          detail,
          confidence: f.confidence,
          evidenceGrade: f.confidence >= 0.7 ? "moderate" as const : "low" as const,
        })),
      ),
      followUpSuggestions: vision.recommendations,
      additionalTestsSuggestions: [],
      citations: [
        { label: "ISUOG practice standards" },
        { label: "ACR O-RADS" },
        { label: "ACR BI-RADS" },
      ],
    });

    return {
      agent: "ultrasound_analysis",
      bundle,
      hypotheses: [
        {
          rank: 1,
          statement: vision.impression,
          rationale: vision.disclaimer,
          confidence: Math.max(...vision.frames.map((f) => f.confidence ?? 0.5), 0.5),
        },
      ],
      warnings: vision.frames.flatMap((f) => f.scanErrors),
    };
  }

  void ctx;

  const bundle = wrapClinicalSupportBundle({
    summary:
      "Автоматический анализ изображения пока не выполнен (MVP). После подключения моделей здесь появятся измерения, сегментации и выделение подозрительных зон.",
    findings: [
      {
        title: "Статус конвейера",
        detail:
          "Ожидается препроцессинг (качество кадра, ориентация), затем извлечение биометрии и маркеров допплеровской гемодинамики.",
        confidence: 0.15,
        evidenceGrade: "unknown",
      },
    ],
    followUpSuggestions: [
      "Подтвердите качество исследования и корректность пресетов (OB/GYN).",
      "При необходимости добавьте дополнительные серии (допплер, длинная ось шейки матки).",
    ],
    additionalTestsSuggestions: [
      "Клинический контекст и лабораторные данные для интерпретации (например, при подозрении на ФРП или преэклампсию).",
    ],
    citations: [],
  });

  return {
    agent: "ultrasound_analysis",
    bundle,
    hypotheses: [
      {
        rank: 1,
        statement: "Требуется подключение модели компьютерного зрения.",
        rationale: "Без инференса гипотезы по изображению не генерируются.",
        confidence: 0.1,
      },
    ],
    warnings: [],
  };
}
