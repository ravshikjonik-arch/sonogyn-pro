import { generatedObgynIndex, type ObgynIndexEntry } from "./obgynAssistantGeneratedIndex";
import importedGynecology from "./obgynAssistantImportedGynecology.json";
import importedObstetrics from "./obgynAssistantImportedObstetrics.json";

export type ObgynAssistantMode = "gynecology" | "obstetrics";

export type ObgynNosologyCard = {
  id: string;
  mode: ObgynAssistantMode;
  code: string;
  title: string;
  aliases: string[];
  group: string;
  dailyUse: string;
  visitChecklist: string[];
  ultrasoundFocus: string[];
  /** Обобщённые рекомендации по дообследованию (можно дублировать ключевые пункты из блоков ниже). */
  diagnostics: string[];
  /** Лабораторные анализы — как в типичной выписке из документа. */
  laboratoryWorkup: string[];
  /** Инструментальные исследования поверх УЗИ — МРТ, эндоскопия и т.д. */
  instrumentalInvestigations: string[];
  /** Лечение, наблюдение, маршрутизация терапии. */
  treatmentRoute: string[];
  redFlags: string[];
  protocolTemplate: string[];
  routing: string[];
  /** Консультации специалистов — блок из базы помощника врача-гинеколога. */
  specialistConsultations?: string[];
  /** Позиции «не рекомендуем» из клинических рекомендаций в документе. */
  notRecommended?: string[];
  sourceNote: string;
  depth: "expanded" | "index";
};

export const obgynAssistantMeta = {
  source: "Помощник врача-гинеколога",
  architecture:
    "Нозология → приём → анализы → инструментальная диагностика → УЗИ → лечение → красные флаги → протокол → маршрут.",
} as const;

function groupForIndex(entry: ObgynIndexEntry) {
  if (entry.mode === "obstetrics") {
    if (entry.code.startsWith("O0")) return "Ранняя беременность и потери";
    if (entry.code.startsWith("O2")) return "Беременность и метаболические состояния";
    if (entry.code.startsWith("O8") || entry.code.startsWith("Z39")) return "Роды и послеродовый период";
    if (entry.code.startsWith("O9")) return "Осложнения беременности/послеродового периода";
    return "Акушерство";
  }

  if (/^(A|B)/.test(entry.code)) return "Инфекции";
  if (/^(D25|D26|D27|D28)/.test(entry.code)) return "Доброкачественные образования";
  if (/^E/.test(entry.code)) return "Эндокринология и обмен";
  if (/^N8[0-9]/.test(entry.code)) return "Матка, яичники, тазовое дно";
  if (/^N9[0-9]/.test(entry.code)) return "Цикл, менопауза, фертильность";
  if (/^N6[0-9]/.test(entry.code)) return "Молочная железа";
  if (/^Z/.test(entry.code)) return "Консультации и наблюдение";
  return "Гинекология";
}

function genericCardFromIndex(entry: ObgynIndexEntry): ObgynNosologyCard {
  const doctor = entry.mode === "gynecology" ? "гинеколога" : "акушера";
  return {
    id: `${entry.mode}-${entry.code}-${entry.title}`.toLowerCase().replace(/[^a-zа-яё0-9]+/gi, "-"),
    mode: entry.mode,
    code: entry.code,
    title: entry.title,
    aliases: [entry.code, entry.title],
    group: groupForIndex(entry),
    dailyUse: "Базовая нозология из полного индекса документа. Откройте карточку на приеме, чтобы не потерять МКБ и быстро собрать структуру описания.",
    visitChecklist: [
      "Уточнить жалобы, срок/цикл/беременность, анамнез и факторы риска.",
      "Проверить, есть ли острое состояние, боль, кровотечение, температура или нестабильность.",
      "Сопоставить нозологию с текущей задачей врача: диагностика, УЗИ, наблюдение, направление.",
    ],
    ultrasoundFocus: [
      "Описать орган-мишень и ключевые измерения по профилю нозологии.",
      "Отметить структурные изменения, свободную жидкость, объемные образования и динамику.",
      "При беременности указать локализацию, срок, жизнеспособность/рост плода и акушерские риски по ситуации.",
    ],
    diagnostics: [
      "Лабораторные и инструментальные тесты выбирать по клинической картине и локальному протоколу.",
      "При неопределенной картине планировать контроль, динамику или экспертный уровень диагностики.",
    ],
    laboratoryWorkup: [
      "ОАК; СРБ или прокальцитонин — при подозрении на воспаление.",
      "Биохимия и базовые маркеры по профилю нозологии и перед госпитализацией.",
      "Гормональный профиль, онкомаркеры, инфекционный скрининг — строго по показаниям.",
      "БХГ при репродуктивном возрасте и подозрении на беременность.",
    ],
    instrumentalInvestigations: [
      "УЗИ органов малого таза / молочных желез / забрюшинного пространства — по локализации процесса.",
      "Рентген/КТ/МРТ — при необходимости уточнения топографии или исключения осложнений.",
      "Эндоскопические методы и биопсия — по клиническим рекомендациям.",
    ],
    treatmentRoute: [
      "Этиопатогенетическая и симптоматическая терапия по клиническим рекомендациям и формуляру ЛП.",
      "Хирургическое лечение или малоинвазивные методы — при наличии показаний после дообследования.",
      "Диспансерное наблюдение и контрольные визиты — интервал по тяжести и динамике.",
    ],
    redFlags: [
      "Острая боль, гемодинамическая нестабильность, обильное кровотечение.",
      "Беременность неясной локализации, подозрение на внематочную беременность или инфекционное осложнение.",
      "Подозрение на онкопроцесс или быстрое ухудшение состояния.",
    ],
    protocolTemplate: [
      `МКБ: ${entry.code}. ${entry.title}.`,
      "Жалобы и клинический контекст: __.",
      "УЗИ/осмотр: ключевые находки по органу-мишени, размеры, структура, динамика.",
      "Заключение: признаки соответствуют/не соответствуют указанной нозологии; дальнейшая тактика по клинике.",
    ],
    routing: [
      `Маршрут ${doctor}: определить срочность, необходимость УЗ-контроля, лабораторного подтверждения или консультации смежного специалиста.`,
      "При красных флагах - срочный очный осмотр/стационар.",
    ],
    sourceNote: "Карточка автоматически создана из полного нозологического индекса документа. Для этой позиции пока нет расширенной экспертной карточки.",
    depth: "index",
  };
}

const importedAssistantCards: ObgynNosologyCard[] = [
  ...(importedGynecology as ObgynNosologyCard[]),
  ...(importedObstetrics as ObgynNosologyCard[]),
];

const importedCodesByMode = new Set(
  importedAssistantCards.map((card) => `${card.mode}:${card.code}`),
);

export const obgynAssistantCards: ObgynNosologyCard[] = [
  ...importedAssistantCards,
  ...generatedObgynIndex
    .filter((entry) => !importedCodesByMode.has(`${entry.mode}:${entry.code}`))
    .map(genericCardFromIndex),
];

export function getAssistantCards(mode: ObgynAssistantMode) {
  return obgynAssistantCards.filter((card) => card.mode === mode);
}

const cardsByModeCode = new Map(
  obgynAssistantCards.map((card) => [`${card.mode}:${card.code.toUpperCase()}`, card] as const),
);

/** Путь к полноэкранному маршруту нозологии (клик по карточке). */
export function assistantCardHref(mode: ObgynAssistantMode, code: string) {
  return `/assistant/${mode}/${encodeURIComponent(code)}`;
}

export function getAssistantCardByCode(mode: ObgynAssistantMode, code: string): ObgynNosologyCard | null {
  const normalized = code.trim().toUpperCase();
  return cardsByModeCode.get(`${mode}:${normalized}`) ?? null;
}
