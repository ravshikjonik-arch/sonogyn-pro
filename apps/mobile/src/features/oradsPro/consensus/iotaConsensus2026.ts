import type { IotaColorScore, IotaLesionType, OradsInput, OradsResult, UnilocularSubtype } from "../types";

export const IOTA_CONSENSUS_2026 = {
  title:
    "Updated Consensus Opinion on terms, definitions and measurements to describe sonographic features of adnexal tumors",
  group: "International Ovarian Tumor Analysis (IOTA) Group",
  published: "2026-04-08",
  doi: "10.1002/uog.70191",
  sourceUrl: "https://obgyn.onlinelibrary.wiley.com/doi/10.1002/uog.70191",
  scope:
    "Structured terms, definitions and measurements for IOTA modified benign descriptors, ADNEX model and two-step strategy.",
} as const;

type DescriptorStatus = "matched" | "not_matched" | "needs_expert_review" | "insufficient";

export type IotaConsensusResult = {
  versionLabel: string;
  readiness: "complete" | "incomplete";
  missingFields: string[];
  modifiedBenignDescriptor: {
    status: DescriptorStatus;
    label: string;
    note: string;
  };
  adnexVariables: Array<{
    key: string;
    label: string;
    value: string;
    complete: boolean;
  }>;
  updatedTerms: Array<{
    term: string;
    value: string;
    definition: string;
    complete: boolean;
  }>;
  twoStepStrategy: {
    step1: string;
    step2: string;
    route: string;
  };
  harmonizedCategory: string;
  clinicalNote: string;
  sourceUrl: string;
};

const benignSubtypeLabels: Partial<Record<UnilocularSubtype, string>> = {
  simple_cyst: "паттерн простой однокамерной кисты",
  hemorrhagic: "типичный паттерн геморрагической кисты",
  endometrioma: "типичный паттерн эндометриомы",
  dermoid: "типичный паттерн дермоида/тератомы",
  paraovarian: "паттерн параовариальной кисты",
  peritoneal_inclusion: "паттерн перитонеальной инклюзионной кисты",
  hydrosalpinx: "паттерн гидросальпинкса",
};

const lesionTypeLabels: Record<IotaLesionType, string> = {
  unilocular_cyst: "Однокамерная киста",
  unilocular_solid_cyst: "Однокамерно-солидное образование",
  multilocular_cyst: "Многокамерная киста",
  multilocular_solid_cyst: "Многокамерно-солидное образование",
  solid_tumor: "Солидная опухоль",
  not_classifiable: "Не классифицируется",
};

const colorScoreLabels: Record<IotaColorScore, string> = {
  "1": "1 - цветовой сигнал отсутствует",
  "2": "2 - минимальный цветовой сигнал",
  "3": "3 - умеренный цветовой сигнал",
  "4": "4 - выраженный цветовой сигнал",
};

function fmtBool(value?: boolean) {
  if (value === true) return "да";
  if (value === false) return "нет";
  return "не заполнено";
}

function fmtSize(input: OradsInput) {
  const values = [input.lengthMm, input.widthMm, input.heightMm].filter(
    (v): v is number => typeof v === "number" && Number.isFinite(v) && v > 0
  );
  if (values.length === 0) return "не заполнено";
  return `${values.join(" x ")} мм`;
}

function fmtMm(value?: number) {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? `${value} мм` : "не заполнено";
}

function deriveLesionType(input: OradsInput): IotaLesionType | undefined {
  if (input.iotaLesionType) return input.iotaLesionType;
  if (input.structure === "unilocular") return input.solidComponent ? "unilocular_solid_cyst" : "unilocular_cyst";
  if (input.structure === "multilocular") return input.solidComponent ? "multilocular_solid_cyst" : "multilocular_cyst";
  if (input.structure === "solid") return "solid_tumor";
  return undefined;
}

function getMissingFields(input: OradsInput) {
  const missing: string[] = [];
  if (!input.localization) missing.push("локализация");
  if (!input.menopause) missing.push("менопаузальный статус");
  if (!input.lesionKind) missing.push("физиологическое или нефизиологическое образование");
  if (input.lesionKind === "nonphysiological" && !input.structure) missing.push("структура образования");
  if (!input.lengthMm || !input.widthMm || !input.heightMm) missing.push("измерения в трёх плоскостях");
  if (!input.bloodFlow && !input.iotaColorScore) missing.push("цветовой допплер / цветовой балл");
  if (input.solidComponent && !input.largestSolidDiameterMm) missing.push("диаметр наибольшего солидного компонента");
  if (input.solidComponent && !input.papillaryProjectionCount) missing.push("количество папиллярных проекций");
  if (!input.iotaCenterType) missing.push("тип центра");
  return missing;
}

function evaluateModifiedBenignDescriptor(input: OradsInput): IotaConsensusResult["modifiedBenignDescriptor"] {
  if (input.localization === "extraovarian") {
    return {
      status: "needs_expert_review",
      label: "Вне зоны овариально-аднексального калькулятора",
      note: "Используйте локальный протокол или экспертную гинекологическую УЗ-оценку.",
    };
  }

  if (input.lesionKind === "physiological") {
    return {
      status: "matched",
      label: "Физиологическая находка у пациентки в пременопаузе",
      note: "Считать физиологическим паттерном только при соответствующем цикле и менопаузальном контексте.",
    };
  }

  if (input.structure === "unilocular" && input.unilocularSubtype && benignSubtypeLabels[input.unilocularSubtype]) {
    const atypical = input.solidComponent || input.bloodFlow === "moderate" || input.bloodFlow === "marked";
    return {
      status: atypical ? "needs_expert_review" : "matched",
      label: benignSubtypeLabels[input.unilocularSubtype] ?? "кандидат на доброкачественный дескриптор",
      note: atypical
        ? "У кандидата на доброкачественный дескриптор есть атипичные сосудистые/солидные признаки; нужна экспертная оценка или ADNEX."
        : "Совместимо с модифицированным доброкачественным дескриптором при типичной морфологии.",
    };
  }

  if (!input.structure) {
    return {
      status: "insufficient",
      label: "Дескриптор нельзя оценить",
      note: "Заполните структуру и измерения перед применением дескрипторов IOTA.",
    };
  }

  return {
    status: "not_matched",
    label: "Модифицированный доброкачественный дескриптор не совпал",
    note: "Перейдите к структурированной модели риска / двухэтапной оценке.",
  };
}

function descriptorStatusRu(status: DescriptorStatus) {
  if (status === "matched") return "доброкачественный дескриптор";
  if (status === "needs_expert_review") return "нужна экспертная оценка";
  if (status === "insufficient") return "данных недостаточно";
  return "дескриптор не совпал";
}

function menopauseRu(value?: OradsInput["menopause"]) {
  if (value === "pre") return "пременопауза";
  if (value === "post") return "постменопауза";
  return "не заполнено";
}

function centerRu(value?: OradsInput["iotaCenterType"]) {
  if (value === "oncology") return "онкологический центр";
  if (value === "other") return "другой центр";
  return "не заполнено";
}

function bloodFlowRu(value?: OradsInput["bloodFlow"]) {
  if (value === "none") return "нет кровотока";
  if (value === "minimal") return "минимальный кровоток";
  if (value === "moderate") return "умеренный кровоток";
  if (value === "marked") return "выраженный кровоток";
  return "не заполнено";
}

function papillaryCountRu(value?: OradsInput["papillaryProjectionCount"]) {
  if (!value) return "не заполнено";
  return value === "4plus" ? ">=4" : value;
}

export function evaluateIotaConsensus2026(input: OradsInput, orads: OradsResult): IotaConsensusResult {
  const missingFields = getMissingFields(input);
  const benignDescriptor = evaluateModifiedBenignDescriptor(input);
  const lesionType = deriveLesionType(input);
  const highRiskFlag = !!input.ascites || !!input.peritonealNodules || orads.category >= 4;
  const markedVascularity = input.iotaColorScore === "4" || input.bloodFlow === "marked";
  const papillaryHighCount = input.papillaryProjectionCount === "4plus";
  const solidComponentMeetsIota = (input.largestSolidDiameterMm ?? 0) >= 3 || !!input.solidComponent;
  const shouldUseAdnex =
    input.lesionKind === "nonphysiological" &&
    benignDescriptor.status !== "matched" &&
    input.localization !== "extraovarian";

  const route = highRiskFlag
    ? "Маршрут высокой настороженности: экспертное УЗИ / гинекологический онкологический маршрут."
    : shouldUseAdnex
      ? "Неопределённый маршрут: заполнить термины IOTA, затем применить ADNEX или экспертную двухэтапную стратегию."
      : benignDescriptor.status === "matched"
        ? "Маршрут доброкачественного дескриптора: сопоставить с клиникой и следовать локальному протоколу наблюдения."
        : "Маршрут дозаполнения данных: внесите недостающие дескрипторы перед финальной стратификацией риска.";

  return {
    versionLabel: `Обновлённый консенсус IOTA ${IOTA_CONSENSUS_2026.published} · DOI ${IOTA_CONSENSUS_2026.doi}`,
    readiness: missingFields.length === 0 ? "complete" : "incomplete",
    missingFields,
    modifiedBenignDescriptor: benignDescriptor,
    adnexVariables: [
      { key: "ageContext", label: "Контекст пациентки", value: menopauseRu(input.menopause), complete: !!input.menopause },
      { key: "lesionType", label: "Тип образования", value: lesionType ? lesionTypeLabels[lesionType] : "не заполнено", complete: !!lesionType },
      { key: "maxDiameter", label: "Максимальный диаметр образования", value: fmtSize(input), complete: !!input.lengthMm && !!input.widthMm && !!input.heightMm },
      { key: "largestSolid", label: "Наибольший солидный компонент", value: fmtMm(input.largestSolidDiameterMm), complete: !solidComponentMeetsIota || !!input.largestSolidDiameterMm },
      { key: "locules", label: "Более 10 камер кисты?", value: lesionType === "solid_tumor" ? "нет (солидная опухоль)" : fmtBool(input.cystLoculesOver10), complete: lesionType === "solid_tumor" || typeof input.cystLoculesOver10 === "boolean" },
      { key: "papillary", label: "Количество папиллярных проекций", value: papillaryCountRu(input.papillaryProjectionCount), complete: !solidComponentMeetsIota || !!input.papillaryProjectionCount },
      { key: "shadows", label: "Акустические тени", value: fmtBool(input.acousticShadows), complete: typeof input.acousticShadows === "boolean" },
      { key: "ascites", label: "Асцит", value: fmtBool(input.ascites), complete: true },
      { key: "doppler", label: "Цветовой балл", value: input.iotaColorScore ? colorScoreLabels[input.iotaColorScore] : bloodFlowRu(input.bloodFlow), complete: !!input.iotaColorScore || !!input.bloodFlow },
      { key: "center", label: "Тип центра", value: centerRu(input.iotaCenterType), complete: !!input.iotaCenterType },
    ],
    updatedTerms: [
      {
        term: "Солидный компонент",
        value: solidComponentMeetsIota ? "есть / кандидат" : "не заполнено или отсутствует",
        definition: "IOTA 2026: солидный компонент должен иметь хотя бы один диаметр >=3 мм; меньшая солидная ткань трактуется как неровность стенки, а не как солидный компонент.",
        complete: typeof input.solidComponent === "boolean" || !!input.largestSolidDiameterMm,
      },
      {
        term: "Папиллярная проекция",
        value: papillaryCountRu(input.papillaryProjectionCount),
        definition: "Солидная ткань, выступающая в полость кисты, высотой >=3 мм. Укажите 0, 1, 2, 3 или >=4; поверхность оцените как гладкую или неровную.",
        complete: !solidComponentMeetsIota || !!input.papillaryProjectionCount,
      },
      {
        term: "Неровная солидная опухоль",
        value: input.solidType === "irregular" || markedVascularity || papillaryHighCount ? "есть подозрительная морфология" : "не отмечено",
        definition: "Неровность включает острые углы (<90°), дольчатость/спикулы, неровную внутреннюю стенку с солидными выступами или неправильный контур солидной опухоли.",
        complete: true,
      },
      {
        term: "Асцит",
        value: fmtBool(input.ascites),
        definition: "Жидкость вне дугласова пространства; включает жидкость выше дна матки или жидкость в кармане Моррисона при трансабдоминальном УЗИ.",
        complete: true,
      },
    ],
    twoStepStrategy: {
      step1: "Шаг 1: проверить, является ли модифицированный доброкачественный дескриптор типичным и полным.",
      step2: "Шаг 2: если образование не является очевидно доброкачественным, использовать структурированные переменные IOTA/ADNEX и экспертный маршрут.",
      route,
    },
    harmonizedCategory: `O-RADS ${orads.category} + IOTA: ${descriptorStatusRu(benignDescriptor.status)}`,
    clinicalNote:
      "Приложение хранит структурированную реализацию консенсуса. Оно не воспроизводит полный текст Wiley и должно быть сверено с официальным документом перед клиническим запуском.",
    sourceUrl: IOTA_CONSENSUS_2026.sourceUrl,
  };
}

export function buildIotaConsensusReportText(consensus: IotaConsensusResult) {
  return [
    `IOTA 2026: ${consensus.harmonizedCategory}`,
    `Источник: ${consensus.versionLabel}`,
    `Готовность: ${consensus.readiness === "complete" ? "заполнено" : "неполно"}${consensus.missingFields.length ? ` (не хватает: ${consensus.missingFields.join(", ")})` : ""}`,
    `Модифицированный доброкачественный дескриптор: ${consensus.modifiedBenignDescriptor.label} — ${consensus.modifiedBenignDescriptor.note}`,
    `Переменные ADNEX: ${consensus.adnexVariables.map((v) => `${v.label}: ${v.value}`).join("; ")}`,
    `Обновлённые термины: ${consensus.updatedTerms.map((t) => `${t.term}: ${t.value}`).join("; ")}`,
    `Двухэтапный маршрут: ${consensus.twoStepStrategy.route}`,
    `Ссылка: ${consensus.sourceUrl}`,
  ].join("\n");
}
