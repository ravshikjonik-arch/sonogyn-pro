import type { ObgynNosologyCard } from "./index";

/** Текст маршрута для вставки в протокол УЗИ / карту пациентки. */
export function buildAssistantProtocolText(card: ObgynNosologyCard): string {
  const lines: string[] = [
    `Помощник врача · ${card.code} · ${card.title}`,
    `Группа: ${card.group}`,
    "",
    card.dailyUse,
    "",
    "1. Лабораторные анализы:",
    ...card.laboratoryWorkup.map((x) => `• ${x}`),
    "",
    "2. Инструментальные исследования:",
    ...card.instrumentalInvestigations.map((x) => `• ${x}`),
    "",
    "3. УЗИ — зафиксировать:",
    ...card.ultrasoundFocus.map((x) => `• ${x}`),
    "",
    "4. Лечение и тактика:",
    ...card.treatmentRoute.map((x) => `• ${x}`),
    "",
    "Чеклист приёма:",
    ...card.visitChecklist.map((x) => `• ${x}`),
    "",
    "Дифференциальная диагностика:",
    ...card.diagnostics.map((x) => `• ${x}`),
    "",
    "Красные флаги:",
    ...card.redFlags.map((x) => `• ${x}`),
    "",
    "Структура протокола:",
    ...card.protocolTemplate.map((x) => `• ${x}`),
    "",
    "Маршрутизация:",
    ...card.routing.map((x) => `• ${x}`),
    "",
    `Источник: ${card.sourceNote}`,
    "",
    "Не является диагнозом. Решение принимает лечащий врач.",
  ];
  return lines.join("\n");
}
