import type { PreparedVisionFrame } from "@/lib/ai/us-vision/types";

export const US_VISION_DISCLAIMER_RU =
  "Черновик ИИ-ассистента. Не является диагнозом. Интерпретация и заключение — за врачом УЗИ.";

export function buildUsVisionSystemPrompt(): string {
  return `Ты ассистент врача УЗИ (акушерство-гинекология, плод, молочная железа).
Классификации — только по общепринятым схемам (ISUOG/FMF, O-RADS, BI-RADS, FIGO) и только если уверенность достаточна.
Не выдумывай биометрию в мм, если на кадре её нельзя оценить.
Ответ строго JSON на русском без markdown.`;
}

export function buildUsVisionUserPrompt(params: {
  clinicalContext: string;
  frames: PreparedVisionFrame[];
}): string {
  const frameList = params.frames
    .map((f, i) => `${i + 1}. id=${f.mediaId}, тип=${f.mediaType}, файл=${f.fileName}`)
    .join("\n");

  return `Клинический контекст кейса:
${params.clinicalContext || "Не указан — опишите только видимое на снимках."}

Кадры (по порядку изображений во вложении):
${frameList}

Для каждого кадра оцени:
- planeGuess: предполагаемая стандартная плоскость (например TT, TTP, abdomen, femur, 4-chamber, сагиттальный эндометрий, яичник, МЖ и т.д.) или «не определено»
- qualityScore: 0–1 (достаточно ли для заключения)
- findings: массив находок (кратко, по делу)
- scanErrors: возможные ошибки сканирования (не та плоскость, тень, недомер, артефакт)
- biometryHints: что можно/нельзя измерить на кадре (без выдуманных цифр)
- confidence: 0–1

Также дай studySummary, impression и recommendations (массив строк).

Формат JSON:
{
  "studySummary": "...",
  "impression": "...",
  "recommendations": ["..."],
  "frames": [
    {
      "mediaId": "uuid",
      "planeGuess": "...",
      "qualityScore": 0.0,
      "findings": ["..."],
      "scanErrors": ["..."],
      "biometryHints": ["..."],
      "confidence": 0.0
    }
  ]
}`;
}
