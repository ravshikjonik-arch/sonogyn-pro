import type { LnRadsCategory } from "../types";

export type LnRadsCategoryMeta = {
  code: LnRadsCategory;
  label: string;
  definitionRu: string;
  ultrasoundCriteria: string[];
  typicalMorphology: string;
  typicalVascularity: string;
  differentialDiagnosis: string[];
  malignancyRisk: string;
  managementRu: string;
  biopsyRecommended: boolean;
  followUpRu: string;
  suspicionLevel: "none" | "low" | "intermediate" | "suspicious" | "high";
};

export const LN_RADS_VERSION =
  "LN-RADS US v1.0 (SonoGyn Pro) — морфология, ЦДК, L/S, elastography/CEUS; синтез EFSUMB/WFUMB/ATA/AIUM/SRU/ESR";

export const LN_RADS_CATEGORIES: LnRadsCategoryMeta[] = [
  {
    code: 1,
    label: "LN-RADS 1",
    definitionRu: "Нормальный лимфатический узел.",
    ultrasoundCriteria: [
      "Овальная форма, L/S > 2",
      "Тонкая однородная кора (< 3 мм)",
      "Сохранён эхогенный хилус",
      "Чёткая капсула",
      "Hilar vascularity на ЦДК",
    ],
    typicalMorphology: "Овальный, тонкая кора, центральный hilum",
    typicalVascularity: "Hilar / central — нормальный паттерн",
    differentialDiagnosis: ["Норма", "Реактивный узел при минимальной реакции"],
    malignancyRisk: "≈0%",
    managementRu: "Без биопсии. Рутинное наблюдение по клиническим показаниям.",
    biopsyRecommended: false,
    followUpRu: "Повтор только при изменении клиники.",
    suspicionLevel: "none",
  },
  {
    code: 2,
    label: "LN-RADS 2",
    definitionRu: "Реактивный / доброкачественный лимфатический узел.",
    ultrasoundCriteria: [
      "Овальная или слегка округлая форма",
      "Сохранён hilum (может быть сжат при реактивной гиперплазии)",
      "Кора умеренно утолщена, но однородна",
      "Hilar или mixed flow без периферического доминирования",
    ],
    typicalMorphology: "Овальный/слегка округлый, hilum сохранён, реактивная кора",
    typicalVascularity: "Hilar > mixed; без chaotic/peripheral dominance",
    differentialDiagnosis: [
      "Реактивная лимфаденопатия",
      "Острый/хронический лимфаденит",
      "Инфекционный мононucleosis",
      "Cat-scratch disease",
      "Sarcoidosis (ранняя стадия)",
    ],
    malignancyRisk: "<5%",
    managementRu: "Биопсия не требуется при типичной картине. Лечение воспалительного процесса, контроль 4–12 нед.",
    biopsyRecommended: false,
    followUpRu: "Клинический контроль; повтор УЗИ при персистенции > 4–8 нед.",
    suspicionLevel: "low",
  },
  {
    code: 3,
    label: "LN-RADS 3",
    definitionRu: "Неопределённый лимфатический узел.",
    ultrasoundCriteria: [
      "L/S 1.5–2 или округление без других злокачественных признаков",
      "Hilum сжат/смещён, но не полностью утрачен",
      "Focal/eccentric cortical thickening",
      "Mixed vascularity",
      "Размер > 10 мм (шейные) / > 15 мм (аксиллярные) без явной злокачественности",
    ],
    typicalMorphology: "Промежуточная форма, частичное сохранение архитектуры",
    typicalVascularity: "Mixed, displaced hilar flow",
    differentialDiagnosis: [
      "Реактивный vs ранняя метастаза",
      "Лимфома (ранняя)",
      "TBC lymphadenitis",
      "Kikuchi disease",
      "Castleman disease",
    ],
    malignancyRisk: "5–20%",
    managementRu: "Корреляция с первичным очагом, CEUS/elastography, контроль 4–6 нед. или FNA по клинике.",
    biopsyRecommended: false,
    followUpRu: "Короткий интервал наблюдения или таргетная биопсия при высоком a priori риске.",
    suspicionLevel: "intermediate",
  },
  {
    code: 4,
    label: "LN-RADS 4",
    definitionRu: "Подозрительный лимфатический узел.",
    ultrasoundCriteria: [
      "Округлая форма (L/S < 1.5)",
      "Потеря hilum или eccentric cortical thickening",
      "Peripheral / penetrating vascularity",
      "Микрокальцинаты, partial necrosis",
      "Нечёткие/lobulated контуры",
    ],
    typicalMorphology: "Round/lobulated, hilum absent/compressed, focal cortex",
    typicalVascularity: "Peripheral, penetrating, mixed with loss of hilar pattern",
    differentialDiagnosis: [
      "Метастаз (ЩЖ, МЖ, ГYN, HNSCC, melanoma)",
      "Лимфома",
      "Tuberculous lymphadenitis",
      "Metastatic papillary thyroid carcinoma",
    ],
    malignancyRisk: "20–80%",
    managementRu: "FNA/core biopsy узла. Стадирование. Корреляция с первичным очагом (ATA для ЩЖ, BI-RADS для МЖ).",
    biopsyRecommended: true,
    followUpRu: "Биопсия и онкомаршрут при подтверждении.",
    suspicionLevel: "suspicious",
  },
  {
    code: 5,
    label: "LN-RADS 5",
    definitionRu: "Высокоподозрительный / злокачественный лимфатический узел.",
    ultrasoundCriteria: [
      "Spiculated / infiltrated margins",
      "Полная замена архитектуры, markedly hypoechoic",
      "Extensive necrosis / cystic degeneration",
      "Chaotic vascularity, definite ECE",
      "Matting, conglomerates",
    ],
    typicalMorphology: "Spiculated, hilum absent, architecture replaced",
    typicalVascularity: "Chaotic, peripheral, avascular necrotic zones",
    differentialDiagnosis: [
      "Метастаз (высокая вероятность)",
      "High-grade lymphoma",
      "Anaplastic carcinoma metastasis",
      "TBC (necrotic form — дифференцировать)",
    ],
    malignancyRisk: ">80%",
    managementRu: "Срочная FNA/core biopsy, PET-CT/staging, MDT. Для ЩЖ — ATA Level VI/VII suspicious nodes.",
    biopsyRecommended: true,
    followUpRu: "Онкологический маршрут без отсрочки.",
    suspicionLevel: "high",
  },
];

export function categoryMeta(code: LnRadsCategory): LnRadsCategoryMeta {
  return LN_RADS_CATEGORIES.find((c) => c.code === code) ?? LN_RADS_CATEGORIES[0]!;
}
