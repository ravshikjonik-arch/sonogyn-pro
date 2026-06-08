/**
 * Строки модуля IDEA (RU). При подключении next-intl — заменить на `t()` из словаря.
 */
export const ideaMessagesRu = {
  "idea.title": "IDEA — глубокий эндометриоз (структурированное УЗИ)",
  "idea.subtitle":
    "Рабочий лист по концепции International Deep Endometriosis Analysis (IDEA) для документирования признаков глубокого инфильтрирующего эндометриоза",
  "idea.disclaimer":
    "Учебно-справочный и вспомогательный инструмент. Не является диагнозом и не заменяет заключение врача. Интерпретация результатов и клинические решения — в компетенции лечащего специалиста в соответствии с клиническими рекомендациями и локальными протоколами (в т.ч. МЗ РФ / ДЗМ при необходимости).",
  "stepper.step1": "Матка и придатки",
  "stepper.step2": "Мягкие маркеры и подвижность",
  "stepper.step3": "Признак скольжения",
  "stepper.step4": "Узлы глубокого эндометриоза",
  "actions.next": "Далее",
  "actions.back": "Назад",
  "actions.generate": "Проверить и сформировать отчёт",
  "actions.loadDemo": "Загрузить демо-кейс",
  "actions.clearDraft": "Очистить черновик",
  "export.json": "Скачать JSON",
  "export.clipboard": "Копировать JSON",
  "export.pdf": "Скачать PDF",
  "export.fhir": "Копировать FHIR (JSON)",
  "panel.evidence": "Диагностическая точность (справочно)",
  "live.preview": "Предпросмотр отчёта",
  "clinical.module": "Клинический модуль",
} as const;

export type IdeaMessageKey = keyof typeof ideaMessagesRu;

export function t(key: IdeaMessageKey): string {
  return ideaMessagesRu[key];
}
