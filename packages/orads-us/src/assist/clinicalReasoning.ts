import type { OradsHintsResult } from "../extractedToHints";
import type { OradsExtractedInput } from "../parseOradsProtocolText";
import type { OradsAssistContext } from "./resolveOradsAssistContext";

export type OradsClinicalReasoningStep = {
  title: string;
  finding: string;
  interpretation: string;
  confidence: "low" | "medium" | "high";
};

export type OradsClinicalReasoningQuestion = {
  priority: "critical" | "important" | "optional";
  question: string;
  reason: string;
};

export type OradsClinicalMemoryInsight = {
  scope: "patient" | "doctor" | "system";
  title: string;
  detail: string;
  weight: "low" | "medium" | "high";
};

export type OradsClinicalReasoningResult = {
  summary: string;
  workingCategory: string;
  reasoningSteps: OradsClinicalReasoningStep[];
  missingQuestions: OradsClinicalReasoningQuestion[];
  memoryInsights: OradsClinicalMemoryInsight[];
  safetyFlags: string[];
  nextActions: string[];
  physicianGuardrail: string;
};

function mmLabel(mm?: number): string {
  if (mm === undefined) return "размер не указан";
  if (mm >= 10) return `${Math.round(mm)} мм (${(mm / 10).toFixed(mm % 10 === 0 ? 0 : 1)} см)`;
  return `${mm} мм`;
}

function confidenceFromPresence(value: unknown): "low" | "medium" | "high" {
  return value === undefined || value === null ? "low" : "high";
}

function lesionLabel(input: OradsExtractedInput): string {
  if (input.noFocalLesion || input.lesionClass === "normal") return "фокальное образование не описано";
  if (input.lesionClass === "simple") return "простая кистозная структура";
  if (input.lesionClass === "solid") return "солидное образование";
  if (input.locularity === "multilocular") return "мультилокулярное образование";
  if (input.locularity === "bilocular") return "билокулярное образование";
  if (input.lesionClass === "nonsimple") return "непростое/сложное образование";
  if (input.structure === "cystic") return "кистозное образование";
  if (input.structure === "complex") return "сложное образование";
  return "тип образования требует уточнения";
}

function categoryLabel(categoryNumber: number | null, unresolvedCount: number): string {
  if (categoryNumber === null) {
    return unresolvedCount
      ? "категория пока не фиксируется: нужны уточняющие признаки"
      : "категория пока не фиксируется";
  }
  return `черновая категория O-RADS ${categoryNumber}`;
}

function addQuestion(
  out: OradsClinicalReasoningQuestion[],
  priority: OradsClinicalReasoningQuestion["priority"],
  question: string,
  reason: string,
): void {
  if (out.some((q) => q.question === question)) return;
  out.push({ priority, question, reason });
}

export function buildOradsClinicalReasoning(
  input: OradsExtractedInput,
  context: OradsAssistContext,
  mapped: Pick<
    OradsHintsResult,
    "categoryNumber" | "unresolvedNodes" | "ascitesModifierSuggested" | "hints"
  >,
): OradsClinicalReasoningResult {
  const steps: OradsClinicalReasoningStep[] = [];
  const questions: OradsClinicalReasoningQuestion[] = [];
  const safetyFlags: string[] = [];
  const nextActions: string[] = [
    "Сверьте извлеченные признаки с изображением/видеопетлей перед переносом в заключение.",
    "После подтверждения признаков пройдите wizard O-RADS и сохраните структурированный протокол.",
  ];

  const locFinding =
    input.localization === "extraovarian"
      ? "экстраовариальная локализация"
      : input.localization === "ovarian"
        ? "овариальная/аднексальная локализация"
        : "локализация не распознана уверенно";
  steps.push({
    title: "1. Локализация",
    finding: locFinding,
    interpretation:
      input.localization === "extraovarian"
        ? "Сначала исключите типичные внеяичниковые варианты; O-RADS применяется к аднексальным образованиям после подтверждения источника."
        : "Дальше рассуждение идет по дереву O-RADS US для аднексального образования.",
    confidence: confidenceFromPresence(input.localization),
  });

  steps.push({
    title: "2. Клинический контекст",
    finding: `${context.menopause === "post" ? "постменопауза" : "пременопауза"}${
      context.ageYears !== undefined ? `, возраст ${context.ageYears}` : ""
    }`,
    interpretation:
      context.menopauseSource === "text"
        ? "Статус менопаузы взят из описания, это повышает надежность размерных веток."
        : "Статус менопаузы задан интерфейсом; если пациентке около 50 лет и старше, его стоит подтвердить вручную.",
    confidence: context.menopauseSource === "text" ? "high" : "medium",
  });

  steps.push({
    title: "3. Морфология",
    finding: lesionLabel(input),
    interpretation:
      input.solidComponent === true
        ? "Солидный компонент переводит рассуждение в ветки, где критичны высота/количество папиллярных структур, контур и кровоток."
        : input.solidComponent === false
          ? "Солидный компонент не описан; при сложной кисте тогда ключевыми становятся локулярность, стенки/перегородки и размер."
          : "Солидный компонент не подтвержден и не исключен, поэтому итоговую категорию нельзя считать окончательной.",
    confidence: input.lesionClass || input.structure || input.locularity ? "high" : "low",
  });

  steps.push({
    title: "4. Размер и кровоток",
    finding: `размер: ${mmLabel(input.diameterMm)}; кровоток: ${input.vascularity ?? "не указан"}`,
    interpretation:
      input.vascularity === "high"
        ? "Выраженный кровоток усиливает настороженность, особенно при солидном компоненте или неровных стенках."
        : input.vascularity
          ? "Кровоток описан; используйте его как color score при прохождении соответствующей ветки."
          : "Для сложных и солидных образований кровоток/color score является критическим уточнением.",
    confidence: input.diameterMm !== undefined && input.vascularity !== undefined ? "high" : "medium",
  });

  if (!input.localization) {
    addQuestion(questions, "critical", "Образование точно исходит из яичника/придатков или внеяичниковое?", "От локализации зависит вход в дерево O-RADS.");
  }
  if (!input.menopause && context.menopauseSource !== "text") {
    addQuestion(questions, "important", "Уточнить статус менопаузы.", "Для простых кист размерные пороги отличаются в пре- и постменопаузе.");
  }
  if (context.postMenopauseHint) {
    addQuestion(questions, "critical", "Пациентка действительно в пременопаузе?", "Возраст >=50 лет при выбранной пременопаузе требует ручного подтверждения.");
    safetyFlags.push("Возраст >=50 лет: не меняем статус менопаузы автоматически, но просим врача уточнить.");
  }
  if (input.solidComponent === undefined && input.lesionClass !== "simple" && input.lesionClass !== "normal") {
    addQuestion(questions, "critical", "Есть ли солидный компонент или папиллярные структуры >=3 мм?", "Это один из главных признаков повышения категории O-RADS.");
  }
  if (input.vascularity === undefined && input.lesionClass !== "simple" && input.lesionClass !== "normal") {
    addQuestion(questions, "critical", "Оценить кровоток/color score в солидной части или перегородках.", "Без color score нельзя надежно пройти ветки сложных/солидных образований.");
  }
  if (input.contour === undefined && input.lesionClass !== "simple" && input.lesionClass !== "normal") {
    addQuestion(questions, "important", "Оценить контур стенки/солидного компонента: гладкий или неровный?", "Неровный контур повышает настороженность.");
  }
  if (input.ascites === undefined) {
    addQuestion(questions, "important", "Есть ли асцит или свободная жидкость вне физиологического объема?", "Асцит может повысить итоговую категорию до O-RADS 5.");
  }

  if (mapped.ascitesModifierSuggested) {
    safetyFlags.push("Асцит описан: после базовой категории проверьте модификатор O-RADS 5.");
  }
  if (mapped.categoryNumber !== null && mapped.categoryNumber >= 4) {
    safetyFlags.push("Категория 4-5 требует особенно аккуратной верификации признаков и маршрутизации к профильному специалисту.");
  }
  if (mapped.unresolvedNodes.length > 0) {
    safetyFlags.push("Есть незакрытые узлы дерева O-RADS: итог должен оставаться черновиком.");
  }

  if (mapped.categoryNumber !== null) {
    nextActions.unshift(`Черновик: ${categoryLabel(mapped.categoryNumber, mapped.unresolvedNodes.length)}. Подтвердите каждый ключевой признак на изображении.`);
  } else {
    nextActions.unshift("Не фиксируйте категорию: сначала ответьте на критические вопросы ниже.");
  }

  const summary = [
    lesionLabel(input),
    input.ovarySide ? `сторона: ${input.ovarySide}` : null,
    input.diameterMm !== undefined ? `макс. размер ${mmLabel(input.diameterMm)}` : null,
    mapped.categoryNumber !== null ? `черновик O-RADS ${mapped.categoryNumber}` : "категория требует уточнения",
  ]
    .filter(Boolean)
    .join("; ");

  return {
    summary,
    workingCategory: categoryLabel(mapped.categoryNumber, mapped.unresolvedNodes.length),
    reasoningSteps: steps,
    missingQuestions: questions,
    memoryInsights: [],
    safetyFlags,
    nextActions,
    physicianGuardrail:
      "Это clinical decision support: система объясняет ход рассуждения, но диагноз и категория утверждаются врачом после просмотра изображения/видеопетли.",
  };
}

export function applyOradsClinicalMemory(
  reasoning: OradsClinicalReasoningResult,
  memoryInsights: OradsClinicalMemoryInsight[],
): OradsClinicalReasoningResult {
  if (!memoryInsights.length) return reasoning;
  return {
    ...reasoning,
    memoryInsights,
    nextActions: [
      "Сначала проверьте подсказки из памяти: это прошлый опыт, а не доказательство диагноза.",
      ...reasoning.nextActions,
    ],
  };
}
