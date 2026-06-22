import type { FetalAnatomyEducationalCard, FetalAnatomyViewId } from "./types";
import { FETAL_ANATOMY_VIEWS } from "./views";

export const FETAL_ANATOMY_INTRODUCTION_CARD: FetalAnatomyEducationalCard = {
  viewId: "introduction",
  learningObjectives: [
    "Объяснить различие скринингового и диагностического УЗИ II триместра.",
    "Обосновать систематический протокол 22 срезов для снижения пропуска ВПР.",
    "Назвать 5 типичных диагностических ловушек при анатомическом сканировании.",
  ],
  keyPoints: [
    "22 среза + 2 обзора — стандарт Е.С. Емельяненко для исключения 65 ВПР.",
    "Скрининг ≠ полная диагностика: при находке — расширенный протокол / ЭхоКГ / МРТ.",
    "Порядок: обзор → позвоночник → голова → сердце → живот → таз → конечности → лицо → обзор 2.",
  ],
  clinicalPearls: [
    "Lemon + banana sign — не диагноз, а маркеры для обязательного протокола позвоночника.",
    "Пустой пузырь на view 14 — повтор через 30–60 мин до заключения об агенезии почек.",
    "Overview-2 (движение 2) — страховка от пропущенной spina bifida при «усталости чек-листа».",
  ],
  residentTips: [
    "Держите порядок срезов фиксированным — так проще не пропустить блок.",
    "Сначала B-mode всех срезов, затем color только там, где протокол требует (view 14, сердце).",
    "Документируйте «не визуализировано» vs «норма» — юридически и клинически разные вещи.",
  ],
  examinationTips: [
    "«Сколько срезов в протоколе Емельяненко?» — 22 (+ обзоры 1 и 2).",
    "«Где banana sign?» — transcerebellar, view 6.",
    "«View 14?» — мочевой пузырь + 2 артерии пуповины.",
  ],
  commonMistakes: [
    "Остановка на 4CV без LVOT/RVOT/3VT.",
    "Один срез почек вместо 13a и 13b.",
    "Ложная micrognathia на не-true profile.",
    "Пропуск overview-2 после длинного протокола.",
  ],
};

const VIEW_CARD_OVERRIDES: Partial<
  Record<FetalAnatomyViewId, Omit<FetalAnatomyEducationalCard, "viewId">>
> = {
  "view-06-transcerebellar": {
    learningObjectives: [
      "Измерить cisterna magna и transcerebellar diameter.",
      "Распознать banana sign и отличить от oblique plane.",
      "Знать критерии Dandy-Walker spectrum vs mega cisterna magna.",
    ],
    keyPoints: ["Cisterna magna 2–10 mm", "Vermis intact", "Banana = Chiari II until proven otherwise"],
    clinicalPearls: ["При banana — обязательно views 1–2 + overview-2."],
    residentTips: ["Не измеряйте cisterna magna на oblique — false dilation."],
    examinationTips: ["Banana sign = view 6."],
    commonMistakes: ["Confusing Blake pouch with Dandy-Walker without vermis assessment."],
  },
  "view-10-three-vessel-trachea": {
    learningObjectives: [
      "Идентифицировать PA, aorta, SVC и trachea на 3VT.",
      "Подозревать interrupted arch, RAA, persistent LSV.",
    ],
    keyPoints: ["PA слева и smallest", "Trachea posterior hyperechoic", "Vessel arrangement = arch anomalies"],
    clinicalPearls: ["3VT — лучший срез для 22q11-маркеров (IAA, RAA, PLSVC)."],
    residentTips: ["Сначала найдите trachea — ориентир для сосудов."],
    examinationTips: ["3VT исключает arch anomalies, не только TGA."],
    commonMistakes: ["Пропуск RAA при «нормальном» 4CV."],
  },
  "view-14-bladder-arteries": {
    learningObjectives: [
      "Показать bladder + 2 umbilical arteries on color.",
      "Связать absent bladder с BRA vs empty bladder.",
    ],
    keyPoints: ["2A lateral to bladder", "SUA = one artery", "Absent bladder + oligohydramnios → BRA/LUTO"],
    clinicalPearls: ["BRA: flat adrenals, empty fossae — не только «нет пузыря»."],
    residentTips: ["Пустой пузырь — walk, drink, rescan."],
    examinationTips: ["View 14 = bladder + 2UA."],
    commonMistakes: ["Confusing iliac arteries with umbilical."],
  },
};

function defaultCardFromView(viewId: FetalAnatomyViewId): FetalAnatomyEducationalCard {
  const view = FETAL_ANATOMY_VIEWS.find((v) => v.id === viewId)!;
  const override = VIEW_CARD_OVERRIDES[viewId];
  return {
    viewId,
    learningObjectives: override?.learningObjectives ?? [
      `Получить срез: ${view.titleRu}.`,
      `Назвать ключевые landmarks: ${view.keyLandmarks.slice(0, 3).join(", ")}.`,
      `Перечислить ВПР, исключаемые на этом срезе (${view.excludesAnomalyIds.length}).`,
    ],
    keyPoints: override?.keyPoints ?? view.normalAnatomy.slice(0, 4),
    clinicalPearls: override?.clinicalPearls ?? [view.clinicalSignificance],
    residentTips: override?.residentTips ?? view.howToObtain.slice(0, 2),
    examinationTips: override?.examinationTips ?? [`View ${view.number}: ${view.plane}`],
    commonMistakes: override?.commonMistakes ?? view.commonMistakes,
  };
}

export const FETAL_ANATOMY_EDUCATIONAL_CARDS: FetalAnatomyEducationalCard[] = [
  FETAL_ANATOMY_INTRODUCTION_CARD,
  ...FETAL_ANATOMY_VIEWS.map((v) => defaultCardFromView(v.id)),
];

export function getEducationalCard(viewId: FetalAnatomyViewId | "introduction"): FetalAnatomyEducationalCard | undefined {
  return FETAL_ANATOMY_EDUCATIONAL_CARDS.find((c) => c.viewId === viewId);
}
