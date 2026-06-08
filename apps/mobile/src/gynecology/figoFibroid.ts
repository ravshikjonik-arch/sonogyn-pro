export type EndometriumRelation = "none" | "contact" | "intracavitary";
export type SerosaRelation = "none" | "contact" | "extracavitary";
export type FibroidLocation =
  | "anterior"
  | "posterior"
  | "fundal"
  | "cervical"
  | "other";

export type FigoFibroidInput = {
  relation_to_endometrium: EndometriumRelation;
  relation_to_serosa: SerosaRelation;
  intramural_percentage: number;
  pedunculated: boolean;
  location: FibroidLocation;
  size_mm?: string;
};

export type FigoType = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export const FIGO_FIBROID_VERSION =
  "FIGO Leiomyoma v1 (локальный алгоритм по пользовательскому ТЗ; для стандартизации описания)";

export function evaluateFigoFibroid(input: FigoFibroidInput): {
  figoType: FigoType;
  clinicalHint: string;
  decisionPath: string[];
  protocol: string;
} {
  const p = Math.max(0, Math.min(100, input.intramural_percentage || 0));
  const steps: string[] = [];
  let type: FigoType;

  if (input.location === "cervical" || input.location === "other") {
    type = 8;
    steps.push("Шеечная/другая локализация: FIGO 8");
  } else if (input.pedunculated && input.relation_to_endometrium === "intracavitary") {
    type = 0;
    steps.push("На ножке + полностью в полости: FIGO 0");
  } else if (input.relation_to_endometrium === "intracavitary") {
    if (p < 50) {
      type = 1;
      steps.push("Интракавитарный + интрамуральный компонент <50%: FIGO 1");
    } else {
      type = 2;
      steps.push("Интракавитарный + интрамуральный компонент >=50%: FIGO 2");
    }
  } else if (input.relation_to_endometrium === "contact") {
    type = 3;
    steps.push("Контакт с эндометрием при 100% интрамуральном положении: FIGO 3");
  } else if (
    input.relation_to_endometrium === "none" &&
    input.relation_to_serosa === "none"
  ) {
    type = 4;
    steps.push("Нет контакта ни с эндометрием, ни с серозой: FIGO 4");
  } else if (input.relation_to_serosa === "contact") {
    if (p >= 50) {
      type = 5;
      steps.push("Контакт с серозой + интрамуральный компонент >=50%: FIGO 5");
    } else {
      type = 6;
      steps.push("Контакт с серозой + интрамуральный компонент <50%: FIGO 6");
    }
  } else if (input.pedunculated && input.relation_to_serosa === "extracavitary") {
    type = 7;
    steps.push("Субсерозный узел на ножке вне матки: FIGO 7");
  } else {
    type = 8;
    steps.push("Нестандартная/другая локализация: FIGO 8");
  }

  const hint =
    type <= 2
      ? "Часто подходит гистероскопический подход (по клинике и размеру)."
      : type <= 4
        ? "Интрамуральные типы: тактика индивидуально, нередко лапароскопический/комбинированный подход."
        : type <= 7
          ? "Преимущественно субсерозные типы: чаще лапароскопия/лапаротомия по показаниям."
          : "FIGO 8: индивидуальное планирование тактики.";

  const locationRu =
    input.location === "anterior"
      ? "Передняя стенка"
      : input.location === "posterior"
        ? "Задняя стенка"
        : input.location === "fundal"
          ? "Дно матки"
          : input.location === "cervical"
            ? "Шейка матки"
            : "Другая";

  const endoRu =
    input.relation_to_endometrium === "intracavitary"
      ? "Интракавитарно"
      : input.relation_to_endometrium === "contact"
        ? "Контактирует"
        : "Нет контакта";
  const serosaRu =
    input.relation_to_serosa === "extracavitary"
      ? "Экстракавитарно"
      : input.relation_to_serosa === "contact"
        ? "Контактирует"
        : "Нет контакта";

  const topographyLine = [
    "Топография миоматозного узла (FIGO leiomyoma subclassification, PALM-COEIN — L):",
    `${locationRu}; к эндометрию — ${endoRu}; к серозе — ${serosaRu}; интрамуральная доля ~${p}%; тип FIGO ${type}.`,
  ].join(" ");

  const protocol = [
    topographyLine,
    "",
    `Локализация: ${locationRu}`,
    `Размеры: ${input.size_mm?.trim() || "не указаны"}`,
    `Тип FIGO: ${type}`,
    "",
    "Описание:",
    `- Отношение к эндометрию: ${endoRu}`,
    `- Отношение к серозе: ${serosaRu}`,
    `- Интрамуральный компонент: ${p}%`,
    `- Ножка: ${input.pedunculated ? "да" : "нет"}`,
    "",
    `Заключение: Миоматозный узел FIGO ${type}.`,
  ].join("\n");

  return { figoType: type, clinicalHint: hint, decisionPath: steps, protocol };
}
