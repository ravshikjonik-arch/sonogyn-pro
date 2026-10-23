/**
 * Дерево решений мастера номограмм (данные без UI).
 * Поток: категория → показатель → срок/КТР → значение → (опционально) баллы трисомий.
 */
import type { NomogramCategory } from "./types";

export type NomogramDecisionNodeId =
  | "start_category"
  | "pick_nomogram"
  | "enter_ga"
  | "enter_crl"
  | "enter_value"
  | "trisomy_score";

export type NomogramDecisionOption = {
  id: string;
  labelRu: string;
  /** Следующий шаг мастера */
  next?: NomogramDecisionNodeId;
  /** Для start_category — категория номограмм */
  category?: NomogramCategory;
  /** Конечный шаг до ввода данных */
  terminalBeforeInput?: boolean;
};

export type NomogramDecisionNode = {
  id: NomogramDecisionNodeId;
  questionRu: string;
  helpRu?: string;
  options?: NomogramDecisionOption[];
  /** Динамический список номограмм по выбранной category (UI) */
  dynamicNomogramList?: boolean;
  /** Поля ввода на шаге */
  inputs?: Array<"ga_weeks" | "ga_days" | "crl_mm" | "measurement">;
};

export const NOMOGRAM_DECISION_TREE: Record<NomogramDecisionNodeId, NomogramDecisionNode> = {
  start_category: {
    id: "start_category",
    questionRu: "Какой блок номограммы нужен?",
    helpRu: "Выберите триместр или модальность — далее список показателей из датасета «Номограммы» (Медведев, Алтынник и др.).",
    options: [
      { id: "cat_first", labelRu: "I триместр (11–14 нед)", category: "first_trimester", next: "pick_nomogram" },
      {
        id: "cat_feto",
        labelRu: "Фетометрия II/III триместра",
        category: "second_third_trimester",
        next: "pick_nomogram",
      },
      { id: "cat_doppler", labelRu: "Допплерометрия", category: "doppler", next: "pick_nomogram" },
      { id: "cat_fluid", labelRu: "Жидкостные показатели", category: "fluid", next: "pick_nomogram" },
      { id: "cat_neuro", labelRu: "Нейросонография", category: "neurosonography", next: "pick_nomogram" },
      { id: "cat_echo", labelRu: "Эхокардиография плода", category: "fetal_echo", next: "pick_nomogram" },
      {
        id: "cat_trisomy",
        labelRu: "Балльная оценка риска трисомий (18–24 нед)",
        next: "trisomy_score",
      },
    ],
  },
  pick_nomogram: {
    id: "pick_nomogram",
    questionRu: "Какой показатель сравниваем с номограммой?",
    helpRu: "У каждого показателя свой id и источник — см. поле source в результате.",
    dynamicNomogramList: true,
    options: [{ id: "picked", labelRu: "Выбран показатель", next: "enter_ga" }],
  },
  enter_ga: {
    id: "enter_ga",
    questionRu: "Срок беременности на момент исследования",
    helpRu: "Для осей «нед+дни» введите недели и дни; для оси «недели» — целые или дробные недели.",
    inputs: ["ga_weeks", "ga_days"],
    options: [{ id: "ga_ok", labelRu: "Далее", next: "enter_value" }],
  },
  enter_crl: {
    id: "enter_crl",
    questionRu: "КТР для выбора строки номограммы",
    helpRu: "Некоторые показатели I триместра привязаны к диапазону КТР, а не к календарному сроку.",
    inputs: ["crl_mm"],
    options: [{ id: "crl_ok", labelRu: "Далее", next: "enter_value" }],
  },
  enter_value: {
    id: "enter_value",
    questionRu: "Измеренное значение",
    helpRu: "Сравнение с интерполированными перцентилями или спец. порогами (DV, MCA PSV).",
    inputs: ["measurement"],
  },
  trisomy_score: {
    id: "trisomy_score",
    questionRu: "Отметьте эхографические признаки",
    helpRu: "≥ 2 баллов — показание к обсуждению пренатального кариотипирования (по таблице Медведев 2012).",
  },
};

export const NOMOGRAM_WIZARD_START: NomogramDecisionNodeId = "start_category";

/** После выбора номограммы UI решает: enter_ga или enter_crl */
export function nextInputStepForNomogram(xAxisType: "ga_weeks" | "ga_days" | "crl_range_mm"): NomogramDecisionNodeId {
  return xAxisType === "crl_range_mm" ? "enter_crl" : "enter_ga";
}

export function buildDecisionTreePath(params: {
  categoryLabel?: string;
  nomogramTitle?: string;
  gaLabel?: string;
  valueLabel?: string;
  resultSummary?: string;
}): string[] {
  const path = ["START · мастер номограмм"];
  if (params.categoryLabel) path.push(`Категория: ${params.categoryLabel}`);
  if (params.nomogramTitle) path.push(`Показатель: ${params.nomogramTitle}`);
  if (params.gaLabel) path.push(`Срок/ось: ${params.gaLabel}`);
  if (params.valueLabel) path.push(`Замер: ${params.valueLabel}`);
  if (params.resultSummary) path.push(`Итог: ${params.resultSummary}`);
  return path;
}
