/**
 * Нормы и пороги по Куликову В.П. «Основы УЗИ сосудов», гл. 4 (2015).
 * Сверять с локальным протоколом и актуальными КР.
 */

/** Табл. 4.1 — допплер-критерии стеноза ВСА (Grant E.G. et al., 2003; NASCET-ориентир). */
export const CAROTID_STENOSIS_DOPPLER_CRITERIA = [
  {
    stenosisRange: "<50%",
    psvIcaMax: 125,
    plaqueUltrasoundPercent: "<50",
    icaCcaRatioMax: 2.0,
    edvIcaMax: 40,
  },
  {
    stenosisRange: "50–69%",
    psvIcaMin: 125,
    psvIcaMax: 230,
    plaqueUltrasoundPercent: ">50",
    icaCcaRatioMin: 2.0,
    icaCcaRatioMax: 4.0,
    edvIcaMin: 40,
    edvIcaMax: 100,
  },
  {
    stenosisRange: ">70%",
    psvIcaMin: 230,
    plaqueUltrasoundPercent: ">50",
    icaCcaRatioMin: 4.0,
    edvIcaMin: 100,
  },
] as const;

export const EXTRACRANIAL_ARTERIAL_NORMS = {
  /** ТИМ ОСА: норма ≤1 мм (Куликов); >1 мм — патологически увеличена. */
  ccaImtNormalMaxMm: 1,
  /** Начальный атеросклероз: >1 и <1,5 мм. */
  ccaImtEarlyAtherosclerosisMaxMm: 1.5,
  /** Мелкая АСБ (Mannheim): локальное увеличение ТИМ 1,5–2 мм. */
  smallPlaqueImtMinMm: 1.5,
  smallPlaqueImtMaxMm: 2,
  /** PSV ВСА в норме ≤125 см/с; асимметрия <30%. */
  icaPsvNormalMaxCmS: 125,
  psvAsymmetryMaxPercent: 30,
  /** PSV ОСА в норме ≤125 см/с. */
  ccaPsvNormalMaxCmS: 125,
  /** Диаметр ПА: норма ≥3 мм; гипоплазия <2,5 мм; малый диаметр 2,5–2,9 мм. */
  vaDiameterNormalMinMm: 3,
  vaHypoplasiaMaxMm: 2.5,
  vaSmallDiameterMaxMm: 2.9,
  /** Стеноз ПА в истоке: 50–69% PSV ≥140; 70–99% PSV ≥210 см/с (Hua Y. et al.). */
  vaOriginStenosisModeratePsvCmS: 140,
  vaOriginStenosisSeverePsvCmS: 210,
  /** Глазная артерия: PSV >15 см/с; асимметрия <30%. */
  ophthalmicPsvNormalMinCmS: 15,
  /** СРПВ >12 м/с — маркер атеросклеротического поражения (ВНОК). */
  pwvAtherosclerosisThresholdMS: 12,
} as const;

export const EXTRACRANIAL_VENOUS_NORMS = {
  /** Флебэктазия ВЯВ: просвет >3× ОСА на уровне перстневидного хряща. */
  ijvPhlebectasiaCcaRatio: 3,
  /** Малая ВЯВ: диаметр ≤ ОСА, не увеличивается при Вальсальве. */
  /** PSV ВЯВ >70 см/с; PSV ПВ >30 см/с (лежа). */
  ijvPsvMaxCmS: 70,
  pvPsvMaxCmS: 30,
  /** ПВ в канале ≤2,5 мм (лежа); флебэктазия ПВ >2,5 мм в канале / >9 мм у устья. */
  pvCanalDiameterMaxMm: 2.5,
  pvPhlebectasiaCanalMm: 2.5,
  pvPhlebectasiaMouthMm: 9,
} as const;

/** Коррекция PSV при пульсовом АД >60 мм рт.ст.: уменьшить на 1/5 (Куликов, гл. 4.5.1). */
export function correctPsvForPulsePressure(
  psvCmS: number,
  pulsePressureMmHg: number,
): { corrected: number; applied: boolean } {
  if (pulsePressureMmHg <= 60) return { corrected: psvCmS, applied: false };
  return { corrected: Math.round(psvCmS * 0.8), applied: true };
}

/** Асимметрия АД на руках >15 мм рт.ст. — маркер стил-синдрома. */
export const SUBCLAVIAN_STEAL_BP_ASYMMETRY_MMHG = 15;

/** §6.4–6.5 — артерии нижних конечностей (Куликов, гл. 6). */
export const LOWER_LIMB_ARTERIAL_NORMS = {
  /** ЛПИ норма 0,9–1,3; <0,9 — стеноокклюзирующее поражение; ≤0,4 — тяжёлое. */
  abiNormalMin: 0.9,
  abiNormalMax: 1.3,
  abiPathologicMax: 0.9,
  abiCriticalMax: 0.4,
  /** ППИ <0,7 — заболевание периферических артерий (диабет/кальциноз). */
  toeBrachialIndexPathologicMax: 0.7,
  /** Асимметрия PSV <30%. */
  psvAsymmetryMaxPercent: 30,
  /** ИПС (PSV stenosis / PSV proximal): 2–3,2 — стеноз. */
  peakVelocityRatioStenosisMin: 2,
  peakVelocityRatioStenosisMax: 3.2,
  /** Диаметры (мм, ориентиры Кунцевич/BeSchler). */
  diameterMm: {
    externalIliac: 8.5,
    commonFemoral: 8.1,
    superficialFemoral: 6.5,
    popliteal: 5.7,
    tibial: 2.0,
  },
  /** PSV норма (см/с): НПА/ОБА 90–145; ПБА 70–110; ПкА 50–85; берцовые 35–60. */
  psvNormalCmS: {
    iliacAndCfa: { min: 90, max: 145 },
    sfa: { min: 70, max: 110 },
    popliteal: { min: 50, max: 85 },
    tibial: { min: 35, max: 60 },
  },
} as const;

/** Табл. 6.1 — гемодинамические критерии стеноза (Jager K.A. et al., 1985). */
export const LOWER_LIMB_STENOSIS_DOPPLER = [
  { range: "Норма", psvMax: 150, spectrum: "Трехфазный" },
  { range: "1–19%", psvNote: "↑ до 30%", spectrum: "Трехфазный" },
  { range: "20–49%", psvRange: "150–200", spectrum: "Трехфазный" },
  { range: "50–74%", psvRange: "200–400", spectrum: "Двухфазный проксимально" },
  { range: "75–99%", psvMin: 400, spectrum: "Монофазный проксимально" },
  { range: "Окклюзия", psvNote: "Нет потока", spectrum: "—" },
] as const;

export type LowerLimbStenosisGrade =
  | "normal"
  | "mild"
  | "moderate"
  | "severe"
  | "critical"
  | "occlusion";

export function gradeLowerLimbStenosis(input: {
  psvStenosisCmS?: number | null;
  psvProximalCmS?: number | null;
  monophasicProximal?: boolean;
  occlusionSuspected?: boolean;
}): {
  grade: LowerLimbStenosisGrade;
  label: string;
  percentRange: string;
  criteria: string[];
} {
  if (input.occlusionSuspected) {
    return {
      grade: "occlusion",
      label: "Окклюзия",
      percentRange: "100%",
      criteria: ["Отсутствие потока по ЦДК + подтверждение допплером"],
    };
  }

  const psv = input.psvStenosisCmS ?? null;
  const ratio =
    psv != null && input.psvProximalCmS != null && input.psvProximalCmS > 0
      ? psv / input.psvProximalCmS
      : null;
  const criteria: string[] = [];
  let grade: LowerLimbStenosisGrade = "normal";

  if (psv != null) {
    if (psv >= 400) {
      grade = "critical";
      criteria.push(`PSV в зоне стеноза ${psv} см/с ≥400 (табл. 6.1)`);
    } else if (psv >= 200) {
      grade = "severe";
      criteria.push(`PSV ${psv} см/с: 200–400 — стеноз 50–74%`);
    } else if (psv >= 150) {
      grade = "moderate";
      criteria.push(`PSV ${psv} см/с: 150–200 — стеноз 20–49%`);
    } else if (psv >= 120) {
      grade = "mild";
      criteria.push(`PSV ${psv} см/с — пограничное повышение (<150)`);
    }
  }

  if (ratio != null && ratio >= LOWER_LIMB_ARTERIAL_NORMS.peakVelocityRatioStenosisMin) {
    criteria.push(`ИПС ${ratio.toFixed(1)} ≥2,0`);
    if (grade === "normal" || grade === "mild") grade = "moderate";
  }

  if (input.monophasicProximal && grade !== "critical") {
    criteria.push("Монофазный спектр проксимально — стеноз ≥75%");
    grade = "critical";
  }

  const meta: Record<
    LowerLimbStenosisGrade,
    { label: string; range: string }
  > = {
    normal: { label: "Без гемодинамически значимого стеноза", range: "<20%" },
    mild: { label: "Начальное стенозирование", range: "1–19%" },
    moderate: { label: "Умеренный стеноз", range: "20–49%" },
    severe: { label: "Выраженный стеноз", range: "50–74%" },
    critical: { label: "Критический стеноз", range: "75–99%" },
    occlusion: { label: "Окклюзия", range: "100%" },
  };

  if (!criteria.length) criteria.push("Укажите PSV в зоне стеноза и проксимально для ИПС.");

  const m = meta[grade];
  return { grade, label: m.label, percentRange: m.range, criteria };
}

/** §5.4 — нормы интракраниальных артерий (Куликов, гл. 5). */
export const TCD_ARTERIAL_NORMS = {
  /** PSV СМА в норме ≤155 см/с (локальное ускорение — подозрение на стеноз). */
  mcaPsvNormalMaxCmS: 155,
  /** Межполушарная асимметрия скорости <30%. */
  interhemisphericAsymmetryMaxPercent: 30,
  /** RI интракраниальных артерий: 0,45–0,6. */
  riNormalMin: 0.45,
  riNormalMax: 0.6,
  /** Типичная глубина M1 СМА: 50–55 мм. */
  mcaM1DepthMm: { min: 50, max: 55 },
  /** Стеноз >50% — критические PSV (Baumgartner R.W. et al., 1999). */
  stenosisMcaPsvCmS: 220,
  stenosisAcaPsvCmS: 155,
  stenosisPcaPsvCmS: 145,
  stenosisVaPsvCmS: 120,
  stenosisBaPsvCmS: 140,
  /** Индекс Линдегарда (SAH): 2,2–3 гиперперфузия; >3 умеренный; >6 выраженный спазм. */
  lindegaardHyperperfusionMin: 2.2,
  lindegaardModerateVasospasmMin: 3,
  lindegaardSevereVasospasmMin: 6,
  /** Коллатеральный резерв при компрессии ОСА: падение TAMX СМА <50% — достаточный. */
  collateralAdequateDropMaxPercent: 50,
  collateralReducedDropMaxPercent: 80,
  collateralDecompensationTamxCmS: 20,
  /** Vmax интракраниальных вен ≤25 см/с. */
  intracranialVenousVmaxMaxCmS: 25,
} as const;

export type LindegaardGrade = "normal" | "hyperperfusion" | "moderate_vasospasm" | "severe_vasospasm";

export function gradeLindegaardRatio(mcaPsvCmS: number, icaPsvCmS: number): {
  ratio: number;
  grade: LindegaardGrade;
  label: string;
} {
  if (icaPsvCmS <= 0) {
    return { ratio: 0, grade: "normal", label: "Укажите PSV ВСА (экстракраниальная)" };
  }
  const ratio = mcaPsvCmS / icaPsvCmS;
  const n = TCD_ARTERIAL_NORMS;
  if (ratio >= n.lindegaardSevereVasospasmMin) {
    return { ratio, grade: "severe_vasospasm", label: "Выраженный ангиоспазм (Lindegaard ≥6)" };
  }
  if (ratio >= n.lindegaardModerateVasospasmMin) {
    return { ratio, grade: "moderate_vasospasm", label: "Умеренный ангиоспазм (Lindegaard 3–6)" };
  }
  if (ratio >= n.lindegaardHyperperfusionMin) {
    return { ratio, grade: "hyperperfusion", label: "Избыточная перфузия / погранично (2,2–3)" };
  }
  return { ratio, grade: "normal", label: "Без признаков выраженного спазма (<2,2)" };
}
