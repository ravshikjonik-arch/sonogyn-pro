import { wrapClinicalSupportBundle } from "@/lib/ai/safety";
import type { AgentArtifact } from "@/lib/ai/types";
import type { OrchestratorContext } from "@/lib/ai/types";

/** Placeholder CV + multimodal fusion hook — wire to MedSAM/ViT/UNet services later. */
export async function runUltrasoundAnalysisAgent(
  ctx: OrchestratorContext,
): Promise<AgentArtifact> {
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
