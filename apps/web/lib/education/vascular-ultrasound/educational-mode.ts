import type { VascularEducationalCard } from "./types";

export const VASCULAR_US_EDUCATIONAL_CARDS: VascularEducationalCard[] = [
  {
    id: "extracranial",
    learningObjectives: [
      "Выполнить протокол БЦА по стандартным точкам.",
      "Градировать стеноз по допплеру и морфологии.",
      "Сформировать заключение без противоречий.",
    ],
    keyPoints: [
      "ICA/CCA ratio и PSV — основные допплер-критерии.",
      "ИМТ — маркер раннего атеросклероза.",
      "Функциональные пробы при подозрении на steal.",
    ],
    residentTips: [
      "Начинайте с longitudinal ОСА, затем bifurcation.",
      "Документируйте side-by-side при асимметрии.",
    ],
    examPearls: [
      "Ulcerated plaque ↑ embolic risk.",
      "Near-occlusion может давать low PSV — не пропустить.",
    ],
    faq: [
      {
        q: "Когда направлять к хирургу?",
        a: "Симптomatic carotid stenosis ≥50% или asymptomatic ≥70% — по актуальным рекомендациям и MDT.",
      },
    ],
  },
  {
    id: "lower-limb-veins",
    learningObjectives: ["Компрессионная венография всеми сегментами", "Классификация тромбоза по эchogenicity"],
    keyPoints: ["Non-compressibility = acute DVT until proven otherwise"],
    residentTips: ["Сжимайте каждые 1–2 см", "CFV и SFJ обязательны"],
    examPearls: ["Chronic thrombus: synechiae, recanalization"],
    faq: [{ q: "БПВ тромбоз — всегда ли антикоагуляция?", a: "По протоколу клиники; оценить проксимальность и CDE." }],
  },
  {
    id: "teaching-mode",
    learningObjectives: ["Структурировать ответ по 5 блокам", "Не выдумывать цифры"],
    keyPoints: ["DDx минимум 3", "QC перед заключением"],
    residentTips: ["Пишите «не визуализировано», а не «норма» без сканирования"],
    examPearls: ["Знать velocity thresholds для ICA stenosis"],
    faq: [{ q: "Главный источник методологии модуля?", a: "Куликов В.П., 2015 + международные consensus documents." }],
  },
];

export function getEducationalCard(id: VascularEducationalCard["id"]) {
  return VASCULAR_US_EDUCATIONAL_CARDS.find((c) => c.id === id);
}
