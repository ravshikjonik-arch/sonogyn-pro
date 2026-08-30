import type {
  StructuredCaseDocument,
  StructuredCaseSectionId,
  StructuredProtocolDraft,
  StructuredProtocolSectionId,
  StructuredSectionContent,
} from "@repo/types";
import {
  STRUCTURED_CASE_SECTION_IDS,
  STRUCTURED_PROTOCOL_SECTION_IDS,
  emptyStructuredSection,
} from "@repo/types";

export type SectionDef = {
  id: StructuredCaseSectionId | StructuredProtocolSectionId;
  title: string;
  hint: string;
  richText?: boolean;
  readOnly?: boolean;
};

export const CASE_SECTION_DEFS: SectionDef[] = [
  {
    id: "study_area",
    title: "1. Область исследования",
    hint: "Матка, яичники, МЖ, щитовидная железа и т.д.",
    richText: true,
  },
  {
    id: "clinical_summary",
    title: "2. Краткая клиническая информация",
    hint: "Без идентифицирующих данных: возрастная группа, жалобы, анамнез.",
    richText: true,
  },
  {
    id: "deidentified_images",
    title: "3. Обезличенные изображения",
    hint: "Ссылки на ключевые кадры из галереи или DICOM viewer.",
    richText: true,
  },
  {
    id: "us_findings",
    title: "4. Ультразвуковые признаки",
    hint: "Эхоструктура, контуры, васкуляризация, дополнительные признаки.",
    richText: true,
  },
  {
    id: "measurements",
    title: "5. Измерения",
    hint: "Размеры образований, толщина эндометрия, объёмы.",
    richText: true,
  },
  {
    id: "calculator_result",
    title: "6. Результат калькулятора или классификации",
    hint: "Вставка из O-RADS, BI-RADS, TI-RADS, FIGO — только чтение.",
    richText: false,
  },
  {
    id: "preliminary_conclusion",
    title: "7. Предварительное заключение",
    hint: "Черновик интерпретации; не является диагнозом.",
    richText: true,
  },
  {
    id: "differential",
    title: "8. Дифференциальный ряд",
    hint: "Альтернативные диагнозы с обоснованием.",
    richText: true,
  },
  {
    id: "colleague_question",
    title: "9. Вопрос коллегам",
    hint: "Что именно хотите обсудить?",
    richText: true,
  },
  {
    id: "confirmation_method",
    title: "10. Метод подтверждения",
    hint: "МРТ, биопсия, динамическое наблюдение.",
    richText: true,
  },
  {
    id: "final_diagnosis",
    title: "11. Окончательный диагноз",
    hint: "Подтверждает лечащий врач после верификации.",
    richText: true,
  },
  {
    id: "educational_comment",
    title: "12. Образовательный комментарий",
    hint: "Для студентов и ординаторов: ключевые learning points.",
    richText: true,
  },
  {
    id: "sources",
    title: "13. Источники",
    hint: "Гайдлайны, КР, ссылки на шкалы.",
    richText: true,
  },
];

export const PROTOCOL_SECTION_DEFS: SectionDef[] = [
  {
    id: "description",
    title: "Описание",
    hint: "Описание органов и находок.",
    richText: true,
  },
  {
    id: "measurements",
    title: "Измерения",
    hint: "Биометрия, размеры, объёмы.",
    richText: true,
  },
  {
    id: "structured_findings",
    title: "Структурированные признаки",
    hint: "IOTA, O-RADS-признаки, дополнительные маркеры.",
    richText: true,
  },
  {
    id: "classification_category",
    title: "Категория классификации",
    hint: "Вставка из калькулятора — без ручного изменения категории.",
    richText: false,
  },
  {
    id: "conclusion",
    title: "Заключение",
    hint: "Финальное заключение подтверждает врач.",
    richText: true,
  },
  {
    id: "recommendations",
    title: "Рекомендации",
    hint: "Тактика, сроки контроля, направления.",
    richText: true,
  },
  {
    id: "scale_source",
    title: "Источник используемой шкалы",
    hint: "ACR O-RADS, BI-RADS, TI-RADS и версия.",
    richText: true,
  },
  {
    id: "algorithm_meta",
    title: "Дата и версия медицинского алгоритма",
    hint: "Видны пользователю для аудита.",
    richText: false,
  },
];

export function ensureCaseSections(
  partial: Partial<Record<StructuredCaseSectionId, StructuredSectionContent>>,
): StructuredCaseDocument["sections"] {
  const out = {} as StructuredCaseDocument["sections"];
  for (const id of STRUCTURED_CASE_SECTION_IDS) {
    out[id] = partial[id] ?? emptyStructuredSection();
  }
  return out;
}

export function ensureProtocolSections(
  partial: Partial<Record<StructuredProtocolSectionId, StructuredSectionContent>>,
): StructuredProtocolDraft["sections"] {
  const out = {} as StructuredProtocolDraft["sections"];
  for (const id of STRUCTURED_PROTOCOL_SECTION_IDS) {
    out[id] = partial[id] ?? emptyStructuredSection();
  }
  return out;
}
