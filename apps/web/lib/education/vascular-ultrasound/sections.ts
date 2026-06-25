import type { VascularSectionId } from "./types";

export type VascularSection = {
  id: VascularSectionId;
  number: number;
  title: string;
  subtitle: string;
  kulikovChapter: string;
  blocks: { heading: string; items: string[] }[];
  checklist?: string[];
  pitfalls?: string[];
};

export const VASCULAR_US_SECTIONS: VascularSection[] = [
  {
    id: "hemodynamics",
    number: 1,
    title: "Сосудистая гемодинамика",
    subtitle: "Основы кровотока и сопротивления",
    kulikovChapter: "Глава 1",
    blocks: [
      {
        heading: "Ключевые понятия",
        items: [
          "Ламинарный vs турбулентный поток; спектральное расширение при стенозе.",
          "RI = (PSV − EDV) / PSV; PI = (PSV − MDV) / TAMV.",
          "Артериальное сопротивление vs венозная низкорезистентная картина.",
          "Постстенотическая турбулентность и «parvus-tardus» дистально.",
        ],
      },
    ],
    pitfalls: ["Интерпретация RI без учёта уровня исследования и кардиального статуса."],
  },
  {
    id: "pathology",
    number: 2,
    title: "Сосудистая патология",
    subtitle: "Типовые гемодинамические нарушения",
    kulikovChapter: "Глава 2",
    blocks: [
      {
        heading: "Паттерны",
        items: [
          "Стенотический кровоток: локальное ↑ PSV, турбулентность, ↓ дистальный поток.",
          "Коллатеральный обход при окклюзии.",
          "Тромбоз vs эмболия; диссекция; экстравазальная компрессия.",
          "Гемодинамическая значимость ≠ только морфология.",
        ],
      },
    ],
  },
  {
    id: "equipment",
    number: 3,
    title: "Аппаратура и режимы",
    subtitle: "B-mode · допплер · дуплекс · триплекс",
    kulikovChapter: "Глава 3",
    blocks: [
      {
        heading: "Режимы",
        items: [
          "PW/CW спектр: угол ≤60°, минимальный sample volume.",
          "Color box — только целевая зона; scale/PRF без aliasing.",
          "Артефакты: shadowing от кальция, mirror, переполнение.",
        ],
      },
    ],
    checklist: ["Угол коррекции", "PRF", "Wall filter", "Gain", "Depth"],
  },
  {
    id: "extracranial",
    number: 4,
    title: "Экстракраниальные сосуды",
    subtitle: "БЦА · позвоночные · подключичные",
    kulikovChapter: "Глава 4",
    blocks: [
      {
        heading: "Методика (§4.3)",
        items: [
          "Пациент лёжа, без валиков; голова по средней линии, ~15° в контралатеральную сторону.",
          "АД на обеих руках до начала — обязательно.",
          "ТИМ — дистальный 1 см ОСА; PSV ВСА ≤125 см/с; асимметрия <30%.",
          "Стеноз: ECST (поперечное сечение) + NASCET при ≥50%; допплер с коррекцией угла.",
        ],
      },
      {
        heading: "Клинический модуль",
        items: [
          "Полный протокол §4.8, 33 шаблона заключения §4.9 — вкладка «Глава 4 · БЦА» в /assistant/vascular.",
          "Калькулятор стеноза по табл. 4.1 (Grant/SVU).",
        ],
      },
    ],
    checklist: [
      "АД справа/слева",
      "ОСА: ТИМ, бляшки, PSV",
      "ВСА: PSV, EDV, ICA/CCA, % стеноза (метод!)",
      "ПА, ПКА, направление потока",
      "ВЯВ/ПВ: диаметр, Vmax, рефлюкс",
      "Пробы: манжета, НСА, Вальсальва — по показаниям",
    ],
    pitfalls: ["Оценка стеноза только по B-mode без допплера", "Пропуск subclavian steal"],
  },
  {
    id: "tcd",
    number: 5,
    title: "Транскраниальное УЗД",
    subtitle: "TCD · intracranial velocities",
    kulikovChapter: "Глава 5",
    blocks: [
      {
        heading: "Методика (§5.3)",
        items: [
          "СМА M1: к датчику, 50–55 мм; ПМА — от датчика; ЗМА — 65–75 мм.",
          "Suboccipital: V4 ПА + ОА; orbital — глазная артерия.",
          "PSV СМА ≤155 см/с; RI 0,45–0,6; асимметрия <30%.",
        ],
      },
      {
        heading: "Клинический модуль",
        items: [
          "Протокол §5.8, заключение §5.9 — вкладка «Глава 5 · TCD».",
          "Калькулятор Lindegaard; TIBI при инсульте — AI-режим.",
        ],
      },
    ],
    checklist: [
      "СМА/ПМА/ЗМА: Vps, TAMX, RI обе стороны",
      "ПА, ОА (suboccipital)",
      "Базальная вена — Vmax, фазность",
      "Пробы: ОСА, CO₂, поворот — по показаниям",
      "Lindegaard при SAH",
    ],
    pitfalls: ["Спутать гиперперфузию и вазоспазм без сравнения с ВСА", "Игнорировать венозную систему"],
  },
  {
    id: "lower-limb-arteries",
    number: 6,
    title: "Артерии нижних конечностей",
    subtitle: "Стеноз · окклюзия · критическая ишемия",
    kulikovChapter: "Глава 6",
    blocks: [
      {
        heading: "Методика (§6.3)",
        items: [
          "Маршрут: ОБА → ПБА/ГБА → ПкА → ЗББА/ПББА/МБА; подвздошные — по показаниям.",
          "ЛПИ 0,9–1,3; при диабете/кальцинозе — ППИ <0,7.",
          "Monophasic дистально — проксимальный stenosis; ИПС ≥2,0 (табл. 6.1).",
        ],
      },
      {
        heading: "Клинический модуль",
        items: ["Протокол §6.7, заключение §6.8 — вкладка «Глава 6 · АНК»."],
      ],
      },
    ],
    checklist: ["ОБА–берцовые: PSV, RI", "ЛПИ/ППИ", "Коллатерали"],
  },
  {
    id: "lower-limb-veins",
    number: 7,
    title: "Вены нижних конечностей",
    subtitle: "ТГВ · рефлюкс · хроническая венозная недостаточность",
    kulikovChapter: "Глава 7",
    blocks: [
      {
        heading: "Компрессия",
        items: [
          "Non-compressibility — ключ к острому тромбозу.",
          "Эхогенность, флотация, реканализация.",
          "Рефлюкс >0.5 s — значимый (сегмент указать).",
        ],
      },
    ],
  },
  {
    id: "upper-limb",
    number: 8,
    title: "Сосуды верхних конечностей",
    subtitle: "Subclavian steal · thrombosis",
    kulikovChapter: "Глава 8",
    blocks: [
      {
        heading: "Пробы",
        items: ["Adson", "hyperabduction", "направление VA при arm stress"],
      },
    ],
  },
  {
    id: "abdominal-aorta",
    number: 9,
    title: "Аорта и висцеральные ветви",
    subtitle: "AAA · renal artery stenosis",
    kulikovChapter: "Глава 9",
    blocks: [
      {
        heading: "Измерения",
        items: [
          "Аорта: max outer-to-outer diameter.",
          "Renal RAR = PSV renal / PSV aorta; PSV thresholds по протоколу.",
        ],
      },
    ],
  },
  {
    id: "teaching-mode",
    number: 10,
    title: "Режим преподавателя",
    subtitle: "Ординатор · самопроверка",
    kulikovChapter: "Методика",
    blocks: [
      {
        heading: "Команды",
        items: [
          "«Обучение» — лекция по выбранной главе.",
          "«Разбери случай» — пошаговый разбор с DDx.",
          "«Экзамен» — 12 вопросов самопроверки.",
        ],
      },
    ],
  },
];

export function getVascularSection(id: VascularSectionId) {
  return VASCULAR_US_SECTIONS.find((s) => s.id === id);
}
