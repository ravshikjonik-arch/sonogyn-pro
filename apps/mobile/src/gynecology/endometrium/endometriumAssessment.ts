/**
 * Эндометрий — ISUOG (Van den Bosch), КР РФ, тактика очагов и тамоксифена.
 * Учебный CDS; окончательное решение — врач.
 */

export const ENDOMETRIUM_SOURCE =
  "ISUOG Practice Guidelines (Van den Bosch et al.); КР РФ (гиперплазия эндометрия, РЭ тела матки); адаптация M.N. Bulanov.";

export type PatientContext =
  | "premenopause"
  | "postmenopause_no_hrt"
  | "postmenopause_continuous_hrt"
  | "postmenopause_cyclic_hrt"
  | "on_tamoxifen";

export type FluidInCavity = "none" | "anechoic" | "hypoechoic" | "hemorrhagic";

export type IudType = "none" | "copper" | "lng";

export type EndometriumAssessmentInput = {
  /** Двойной слой M-эхо, мм (округлить до 0,1) */
  thicknessMm?: number;
  /** При жидкости — сумма двух слоёв */
  layer1Mm?: number;
  layer2Mm?: number;
  fluidInCavity: FluidInCavity;
  /** Внутриматочное образование (полип и др.) */
  focalLesionPresent: boolean;
  focalLesionDiameterMm?: number;
  intracavitaryMyomaPresent: boolean;
  structureHomogeneous: boolean;
  echogenicInclusions: boolean;
  patientContext: PatientContext;
  cycleDay?: number;
  iudType: IudType;
  aubPresent: boolean;
  onTamoxifen: boolean;
  /** Очаг: сосуды */
  multipleVesselsIrregular?: boolean;
  multipleVesselsNoBranching?: boolean;
  unevenContour?: boolean;
  riskFactorsPresent?: boolean;
  /** Тамоксифен + AUB */
  tamoxifenThinHomogeneous?: boolean;
  tamoxifenThickenedInhomogeneous?: boolean;
  /** После СГС */
  sonoThickenedDiffuse?: boolean;
  sonoFocalChanges?: boolean;
  conclusionDraft?: string;
};

export const defaultEndometriumInput: EndometriumAssessmentInput = {
  fluidInCavity: "none",
  focalLesionPresent: false,
  intracavitaryMyomaPresent: false,
  structureHomogeneous: true,
  echogenicInclusions: false,
  patientContext: "premenopause",
  iudType: "none",
  aubPresent: false,
  onTamoxifen: false,
};

export type ThresholdLevel = "ok" | "watch" | "alert" | "na";

export type ThicknessAssessment = {
  effectiveMm: number | null;
  level: ThresholdLevel;
  isuogNote: string;
  krRfNote: string;
  ecRiskHint?: string;
};

export type TacticResult = {
  action: string;
  rationale: string;
  level: "urgent" | "planned" | "observe" | "none";
};

const ISUOG_MEASUREMENT_RULES = [
  "Видна вся полость матки; матка >½ экрана.",
  "Толщина — в сагиттали, где максимальна, двойной слой (оба слоя).",
  "Калиперы перпендикулярно средней линии эндометрия, на границе с миометрием.",
  "Запись в мм, округление до 0,1 мм.",
  "При жидкости в полости — измерить оба слоя и сложить.",
  "При внутриматочном образовании: в толщину входят диаметр образования в сагиттали + передний и задний слои эндометрия.",
  "Чётко идентифицированная внутриматочная миома в толщину не включается.",
  "Образование описать в 3 линейных размерах (мм, 0,1).",
  "При образовании общая толщина менее важна, чем детальное описание очага.",
  "Эхогенность жидкости в полости указать (анэхогенная / гипоэхогенная / геморрагическая).",
];

function round01(v: number) {
  return Math.round(v * 10) / 10;
}

export function computeEffectiveThicknessMm(input: EndometriumAssessmentInput): number | null {
  if (input.focalLesionPresent && input.focalLesionDiameterMm && input.focalLesionDiameterMm > 0) {
    const layers = (input.layer1Mm ?? 0) + (input.layer2Mm ?? 0);
    if (layers > 0) return round01(layers + input.focalLesionDiameterMm);
  }
  if (input.fluidInCavity !== "none") {
    const l1 = input.layer1Mm;
    const l2 = input.layer2Mm;
    if (l1 != null && l2 != null && l1 > 0 && l2 > 0) return round01(l1 + l2);
  }
  if (input.thicknessMm != null && input.thicknessMm > 0) return round01(input.thicknessMm);
  return null;
}

export function assessThickness(input: EndometriumAssessmentInput): ThicknessAssessment {
  const mm = computeEffectiveThicknessMm(input);
  if (mm == null) {
    return {
      effectiveMm: null,
      level: "na",
      isuogNote: "Введите толщину эндометрия для оценки порогов.",
      krRfNote: "",
    };
  }

  const ctx = input.onTamoxifen ? "on_tamoxifen" : input.patientContext;
  let level: ThresholdLevel = "ok";
  let isuog = "";
  let kr = "";
  let ecRisk: string | undefined;

  if (ctx === "on_tamoxifen") {
    return {
      effectiveMm: mm,
      level: "na",
      isuogNote:
        "При тамоксифене порог толщины эндометрия не установлен. Оценка только при аномальном маточном кровотечении (AUB).",
      krRfNote: "КР РФ / ISUOG: плановое сканирование без AUB не показано.",
    };
  }

  if (ctx === "postmenopause_no_hrt" || ctx === "postmenopause_continuous_hrt") {
    const limit = 4;
    if (mm > 5) {
      level = "alert";
      kr = `Постменопауза: M-эхо ${mm} мм > 5 мм — исключить неопластический процесс (КР РФ).`;
      if (input.aubPresent) ecRisk = "При AUB и M-эхо >5 мм риск РЭ ~7,3% (ориентир КР).";
      else if (mm <= 4) ecRisk = "При M-эхo 3–4 мм риск РЭ <1%; при <5 мм и AUB — ~0,07%.";
    } else if (mm > limit) {
      level = "watch";
      kr = `Постменопауза: M-эхо ${mm} мм > ${limit} мм (порог ISUOG без ЗГТ / непрерывная ЗГТ).`;
    } else {
      isuog = `Постменопауза: M-эхо ${mm} мм ≤ ${limit} мм — в пределах ожидаемого (ISUOG).`;
    }
  }

  if (ctx === "postmenopause_cyclic_hrt") {
    const limit = 7;
    if (mm > 7) {
      level = "alert";
      kr = `Циклическая ЗГТ: M-эхo ${mm} мм > 7 мм (после кровотечения отмены) — исключить неоплазию.`;
    } else if (mm > limit) {
      level = "watch";
      kr = `Циклическая ЗГТ: M-эхo ${mm} мм — выше порога ${limit} мм, нужна клиническая корреляция.`;
    } else {
      isuog = `Циклическая ЗГТ: M-эхo ${mm} мм ≤ ${limit} мм.`;
    }
  }

  if (ctx === "premenopause") {
    isuog = "В пременопаузе порог толщины для исключения рака не применяют; важнее структура и очаг.";
    if (input.cycleDay != null && input.cycleDay >= 5 && input.cycleDay <= 7) {
      if (mm > 8 && !input.structureHomogeneous) {
        level = "watch";
        kr = `5–7 д.ц.: M-эхo ${mm} мм >7–8 мм + неоднородность — подозрение на гиперплазию (КР РФ).`;
      }
    }
    if (mm > 12) {
      level = level === "alert" ? "alert" : "watch";
      kr = [kr, `1-я фаза: M-эхo ${mm} мм > 12 мм — исключить неопластический процесс (КР РФ).`]
        .filter(Boolean)
        .join(" ");
    }
  }

  if (input.iudType === "lng") {
    isuog = [isuog, "ВМС с левоноргестрелом: эндометрий обычно тонкий, гиперэхогенный."].filter(Boolean).join(" ");
  } else if (input.iudType === "copper") {
    isuog = [isuog, "Медная ВМС: циклические изменения эндометрия могут сохраняться."].filter(Boolean).join(" ");
  }

  return {
    effectiveMm: mm,
    level,
    isuogNote: isuog || "См. контекст пациентки.",
    krRfNote: kr,
    ecRiskHint: ecRisk,
  };
}

export function evaluateFocalLesionTactic(input: EndometriumAssessmentInput): TacticResult {
  if (!input.focalLesionPresent && !input.aubPresent) {
    return { action: "Очаг не описан", rationale: "Заполните при наличии находки.", level: "none" };
  }

  if (input.aubPresent) {
    return {
      action: "Хирургическая гистероскопия",
      rationale: "AUB при очаговом образовании эндометрия — рекомендовано удаление/биопсия (ISUOG).",
      level: "urgent",
    };
  }

  if (input.multipleVesselsIrregular || input.multipleVesselsNoBranching) {
    return {
      action: "Хирургическая гистероскопия",
      rationale: "Асимптомный полип: множественные сосуды (± нерегулярное ветвление) — показание к удалению (ISUOG).",
      level: "planned",
    };
  }

  if (input.unevenContour) {
    return {
      action: "Хирургическая гистероскопия",
      rationale: "Неровный контур внутриматочного образования — показание (ISUOG).",
      level: "planned",
    };
  }

  if (input.riskFactorsPresent) {
    return {
      action: "Хирургическая гистероскопия",
      rationale: "Факторы риска при очаге — склонность к активному ведению (ISUOG).",
      level: "planned",
    };
  }

  return {
    action: "Наблюдение / консультирование",
    rationale:
      "Без AUB и без тревожных sono-признаков: выжидательная тактика, контроль УЗИ, при сомнениях — СГС (ISUOG).",
    level: "observe",
  };
}

export function evaluateTamoxifenTactic(input: EndometriumAssessmentInput): TacticResult {
  if (!input.onTamoxifen) {
    return { action: "—", rationale: "Пациентка не на тамоксифене.", level: "none" };
  }

  if (!input.aubPresent) {
    return {
      action: "Сканирование не проводится (планово)",
      rationale: "Без AUB рутинный УЗ-скрининг эндометрия на СМЭР не показан (ISUOG, КР РФ).",
      level: "none",
    };
  }

  if (input.tamoxifenThinHomogeneous) {
    return { action: "Наблюдение", rationale: "AUB + тонкий однородный эндометрий.", level: "observe" };
  }

  if (input.sonoFocalChanges) {
    return {
      action: "Оперативная гистероскопия",
      rationale: "После введения жидкости — очаговые изменения.",
      level: "urgent",
    };
  }

  if (input.sonoThickenedDiffuse) {
    return {
      action: "Офисная аспирация / биопсия",
      rationale: "Диффузно утолщённый эндометрий на СГС.",
      level: "planned",
    };
  }

  if (input.tamoxifenThickenedInhomogeneous) {
    return {
      action: "Соногистерография (введение жидкости)",
      rationale: "AUB + утолщённый/неоднородный эндометрий — следующий шаг по алгоритму.",
      level: "planned",
    };
  }

  return {
    action: "Соногистерография / биопсия по находке",
    rationale: "AUB на тамоксифене — дообследование по протоколу центра.",
    level: "planned",
  };
}

export function buildEndometriumProtocol(input: EndometriumAssessmentInput): string {
  const thickness = assessThickness(input);
  const focal = evaluateFocalLesionTactic(input);
  const tam = evaluateTamoxifenTactic(input);
  const eff = thickness.effectiveMm;

  const lines: string[] = [
    "УЗИ · ЭНДОМЕТРИЙ (алгоритм ISUOG / КР РФ)",
    ENDOMETRIUM_SOURCE,
    "",
    "ИЗМЕРЕНИЕ M-ЭХО (ISUOG)",
    ...ISUOG_MEASUREMENT_RULES.map((r) => `• ${r}`),
    "",
    eff != null ? `Эффективная толщина эндометрия: ${eff} мм.` : "Толщина: не рассчитана.",
  ];

  if (input.fluidInCavity !== "none") {
    const fluidRu =
      input.fluidInCavity === "anechoic"
        ? "анэхогенная"
        : input.fluidInCavity === "hypoechoic"
          ? "гипоэхогенная"
          : "геморрагическая";
    lines.push(`Жидкость в полости: ${fluidRu}.`);
    if (input.layer1Mm && input.layer2Mm) {
      lines.push(`Слои: ${input.layer1Mm} + ${input.layer2Mm} мм.`);
    }
  }

  if (input.focalLesionPresent) {
    lines.push(
      `Внутриматочное образование: да${input.focalLesionDiameterMm ? `, диаметр в сагиттали ${input.focalLesionDiameterMm} мм` : ""}.`,
    );
  }
  if (input.intracavitaryMyomaPresent) {
    lines.push("Внутриматочная миома: идентифицирована (не включена в суммарную толщину).");
  }

  lines.push(
    "",
    "КОНТЕКСТ",
    `Статус: ${contextLabel(input.patientContext)}`,
    input.cycleDay ? `День цикла: ${input.cycleDay}` : "",
    `ВМС: ${iudLabel(input.iudType)}`,
    `AUB: ${input.aubPresent ? "да" : "нет"}`,
    `Тамоксифен: ${input.onTamoxifen ? "да" : "нет"}`,
    "",
    "ПОРОГИ / КОММЕНТАРИИ",
    thickness.isuogNote,
    thickness.krRfNote,
    thickness.ecRiskHint ?? "",
    "",
    "ТАКТИКА · ОЧАГОВОЕ ОБРАЗОВАНИЕ (ISUOG)",
    `${focal.action}. ${focal.rationale}`,
  );

  if (input.onTamoxifen) {
    lines.push("", "ТАКТИКА · ТАМОКСИФЕН / СМЭР", `${tam.action}. ${tam.rationale}`);
  }

  lines.push(
    "",
    "ЗАКЛЮЧЕНИЕ (черновик врача)",
    input.conclusionDraft?.trim() || "—",
    "",
    "Не является диагнозом. Решение принимает лечащий врач.",
  );

  return lines.filter((l) => l !== "").join("\n");
}

function contextLabel(c: PatientContext): string {
  const map: Record<PatientContext, string> = {
    premenopause: "Пременопауза",
    postmenopause_no_hrt: "Постменопауза без ЗГТ",
    postmenopause_continuous_hrt: "Постменопауза, непрерывная ЗГТ",
    postmenopause_cyclic_hrt: "Постменопауза, циклическая ЗГТ",
    on_tamoxifen: "Приём тамоксифена",
  };
  return map[c];
}

function iudLabel(i: IudType): string {
  if (i === "copper") return "медь";
  if (i === "lng") return "левоноргестрел";
  return "нет";
}

export const endometriumFormOptions = {
  patientContext: [
    { value: "premenopause", label: "Пременопауза" },
    { value: "postmenopause_no_hrt", label: "Постменопауза, без ЗГТ" },
    { value: "postmenopause_continuous_hrt", label: "Постменопауза, непрерывная ЗГТ" },
    { value: "postmenopause_cyclic_hrt", label: "Постменопауза, циклическая ЗГТ (после кровотечения)" },
  ] as const,
  fluidInCavity: [
    { value: "none", label: "Жидкости нет" },
    { value: "anechoic", label: "Анэхогенная" },
    { value: "hypoechoic", label: "Гипоэхогенная" },
    { value: "hemorrhagic", label: "Геморрагическая" },
  ] as const,
  iudType: [
    { value: "none", label: "Нет ВМС" },
    { value: "copper", label: "ВМС медь" },
    { value: "lng", label: "ВМС ЛНГ" },
  ] as const,
};
