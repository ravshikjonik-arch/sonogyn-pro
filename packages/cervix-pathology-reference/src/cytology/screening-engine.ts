import type {
  BethesdaAssistInput,
  BethesdaAssistResult,
  CytologyScreeningInput,
  CytologyScreeningRecommendation,
} from "./types";

const DISCLAIMER =
  "Алгоритм является образовательной и справочной поддержкой врача и не заменяет клиническое решение. Сверяйте тактику с действующими КР МЗ РФ и ASCCP 2019.";

function finalize(
  rec: CytologyScreeningRecommendation,
  input: CytologyScreeningInput,
): CytologyScreeningRecommendation {
  const actionsNow = [...rec.actionsNow];

  if (input.pregnant) {
    if (rec.colposcopyNeeded || rec.riskLevel === "high") {
      actionsNow.push("Беременность: кольпоскопия/биопсия по показаниям; excision отложить без инвазии");
    } else {
      actionsNow.push("Беременность: тактику согласовать с акушером");
    }
  }

  return { ...rec, actionsNow };
}

function postTreatmentSurveillance(
  input: CytologyScreeningInput,
  hpv: NonNullable<CytologyScreeningInput["hpvStatus"]>,
): CytologyScreeningRecommendation {
  return finalize(
    {
      summary: "После excision: персистентный HPV+",
      actionsNow: ["HPV ± цитология через 12 мес", "Кольпоскопия при HPV16/18+ или ASC-US+ на контроле"],
      nextScreeningMonths: 12,
      hpvTestNeeded: true,
      colposcopyNeeded: hpv === "16-positive" || hpv === "18-positive",
      repeatCytologyMonths: 12,
      referSpecialist: false,
      riskLevel: "moderate",
      disclaimer: DISCLAIMER,
      guidelineRefs: ["ASCCP 2019 post-treatment"],
    },
    input,
  );
}

export function recommendCytologyScreening(input: CytologyScreeningInput): CytologyScreeningRecommendation {
  const actionsNow: string[] = [];
  let colposcopyNeeded = false;
  let hpvTestNeeded = false;
  let nextScreeningMonths: number | null = 36;
  let riskLevel: "low" | "moderate" | "high" = "low";

  const cytology = input.cytology ?? null;
  const hpv = input.hpvStatus ?? "unknown";
  const hpvPositive =
    hpv === "positive" || hpv === "16-positive" || hpv === "18-positive";

  if (cytology === "unsatisfactory") {
    return finalize(
      {
        summary: "Неадекватный материал",
        actionsNow: ["Повторить забор через 2–4 мес", "Проверить технику (слизь, ЗТ, фиксация)"],
        nextScreeningMonths: null,
        hpvTestNeeded: false,
        colposcopyNeeded: false,
        repeatCytologyMonths: 3,
        referSpecialist: false,
        riskLevel: "moderate",
        disclaimer: DISCLAIMER,
        guidelineRefs: ["Bethesda unsatisfactory"],
      },
      input,
    );
  }

  if (cytology === "hsil" || cytology === "ais" || cytology === "carcinoma") {
    colposcopyNeeded = true;
    actionsNow.push("Кольпоскопия и биопсия");
    if (cytology === "carcinoma") actionsNow.push("Срочное направление к онкогинекологу");
    return finalize(
      {
        summary: `Высокий риск: ${cytology.toUpperCase()}`,
        actionsNow,
        nextScreeningMonths: null,
        hpvTestNeeded: false,
        colposcopyNeeded: true,
        repeatCytologyMonths: null,
        referSpecialist: true,
        riskLevel: "high",
        disclaimer: DISCLAIMER,
        guidelineRefs: ["ASCCP 2019", "КР РШМ МЗ РФ"],
      },
      input,
    );
  }

  if (cytology === "agc" || cytology === "asc-h") {
    colposcopyNeeded = true;
    actionsNow.push("Кольпоскопия");
    if (cytology === "agc") actionsNow.push("ECC ± sampling эндометрия");
    return finalize(
      {
        summary: cytology === "agc" ? "AGC — расширенное обследование" : "ASC-H — кольпоскопия",
        actionsNow,
        nextScreeningMonths: null,
        hpvTestNeeded: false,
        colposcopyNeeded: true,
        repeatCytologyMonths: null,
        referSpecialist: cytology === "agc",
        riskLevel: "high",
        disclaimer: DISCLAIMER,
        guidelineRefs: ["ASCCP 2019"],
      },
      input,
    );
  }

  if (cytology === "lsil") {
    colposcopyNeeded = input.age >= 25;
    actionsNow.push(input.age >= 25 ? "Кольпоскопия" : "Наблюдение или кольпоскопия по протоколу <25");
    return finalize(
      {
        summary: "LSIL",
        actionsNow,
        nextScreeningMonths: 12,
        hpvTestNeeded: false,
        colposcopyNeeded,
        repeatCytologyMonths: 12,
        referSpecialist: false,
        riskLevel: "moderate",
        disclaimer: DISCLAIMER,
        guidelineRefs: ["ASCCP 2019"],
      },
      input,
    );
  }

  if (cytology === "asc-us") {
    hpvTestNeeded = true;
    if (hpvPositive) {
      colposcopyNeeded = true;
      riskLevel = "moderate";
      actionsNow.push("Кольпоскопия (ASC-US + HPV+)");
    } else if (hpv === "negative") {
      actionsNow.push("Повтор co-test через 3 года (≥30) или 1 год");
      nextScreeningMonths = input.age >= 30 ? 36 : 12;
    } else {
      actionsNow.push("Выполнить HPV-test для triage");
    }
    return finalize(
      {
        summary: "ASC-US",
        actionsNow,
        nextScreeningMonths,
        hpvTestNeeded,
        colposcopyNeeded,
        repeatCytologyMonths: null,
        referSpecialist: false,
        riskLevel,
        disclaimer: DISCLAIMER,
        guidelineRefs: ["ASCCP 2019"],
      },
      input,
    );
  }

  if (cytology === "nilm" || !cytology) {
    if (input.priorExcision && hpvPositive) {
      return postTreatmentSurveillance(input, hpv);
    }

    if (hpvPositive) {
      colposcopyNeeded = true;
      riskLevel = "moderate";
      actionsNow.push("NILM + HPV+ → кольпоскопия / genotyping");
      return finalize(
        {
          summary: "NILM + HPV+",
          actionsNow,
          nextScreeningMonths: 12,
          hpvTestNeeded: false,
          colposcopyNeeded: true,
          repeatCytologyMonths: null,
          referSpecialist: false,
          riskLevel,
          disclaimer: DISCLAIMER,
          guidelineRefs: ["ASCCP 2019"],
        },
        input,
      );
    }

    actionsNow.push("Плановый скрининг по национальной программе");
    if (input.age < 25 && !input.sexuallyActive) {
      actionsNow.push("Скрининг обычно с 25 лет (или раньше по протоколу)");
    }
    if (input.hivPositive || input.immunodeficient) {
      nextScreeningMonths = 12;
      actionsNow.push("Иммунодефицит/HIV — укороченный интервал");
      riskLevel = "moderate";
    }
    return finalize(
      {
        summary: "Рутинный скрининг",
        actionsNow,
        nextScreeningMonths,
        hpvTestNeeded: input.age >= 30,
        colposcopyNeeded,
        repeatCytologyMonths: null,
        referSpecialist: false,
        riskLevel,
        disclaimer: DISCLAIMER,
        guidelineRefs: ["КР МЗ РФ", "WHO"],
      },
      input,
    );
  }

  return finalize(
    {
      summary: "Уточните цитологию и HPV",
      actionsNow: ["Заполните результат цитологии и HPV"],
      nextScreeningMonths: null,
      hpvTestNeeded: true,
      colposcopyNeeded: false,
      repeatCytologyMonths: null,
      referSpecialist: false,
      riskLevel: "low",
      disclaimer: DISCLAIMER,
      guidelineRefs: [],
    },
    input,
  );
}

export function interpretBethesdaAssist(input: BethesdaAssistInput): BethesdaAssistResult {
  const rec = recommendCytologyScreening({
    age: input.age,
    cytology: input.cytology,
    hpvStatus: input.hpv16Positive ? "16-positive" : input.hpv18Positive ? "18-positive" : input.hpvStatus,
    pregnant: input.pregnant,
    immunodeficient: input.immunodeficient,
    hivPositive: input.hivPositive,
    priorExcision: input.priorExcision,
  });

  const avoid: string[] = [];
  if (input.cytology === "lsil" && input.age < 25) {
    avoid.push("Не спешить с excision у молодых без CIN2+");
  }
  if (input.pregnant) {
    avoid.push("Не выполнять excision в беременности без инвазии");
  }

  const missingData: string[] = [];
  if (input.hpvStatus === "unknown") missingData.push("Статус HPV");
  if (input.cytology === "agc" && !input.colposcopyDone) missingData.push("Кольпоскопия + ECC");
  if (input.priorExcision === undefined) missingData.push("История excision (конизация/LEEP)");

  const moduleLinks: BethesdaAssistResult["moduleLinks"] = [
    { topic: "bethesda", label: "Справочник Bethesda" },
    { topic: "co-testing", label: "Ко-тестирование" },
  ];
  if (rec.colposcopyNeeded) moduleLinks.push({ topic: "algorithms", label: "Цепочка до гистологии" });

  return {
    interpretation: rec.summary,
    riskLevel: rec.riskLevel === "high" ? "high" : rec.riskLevel === "moderate" ? "moderate" : "low",
    nextSteps: rec.actionsNow,
    explainToPatient: buildPatientExplanation(input),
    avoid,
    missingData,
    moduleLinks,
    disclaimer: rec.disclaimer,
  };
}

function buildPatientExplanation(input: BethesdaAssistInput): string {
  switch (input.cytology) {
    case "nilm":
      return "Результат в пределах нормы. Плановое наблюдение по графику скрининга.";
    case "asc-us":
      return "Обнаружены небольшие изменения клеток; часто это проходит само. Нужен дополнительный анализ на ВПЧ или осмотр под увеличением.";
    case "lsil":
      return "Низкая степень изменений; часто связана с ВПЧ. Врач назначит осмотр шейки под увеличением.";
    case "hsil":
      return "Выраженные изменения; требуется уточнение под увеличением и, возможно, биопсия. Это не означает рак, но важно не откладывать.";
    case "agc":
      return "Изменения железистого эпителия — нужен расширенный осмотр.";
    case "unsatisfactory":
      return "Мазок не удалось оценить; нужно повторить сбор материала.";
    default:
      return "Обсудите результат с лечащим врачом; следуйте назначенному обследованию.";
  }
}
