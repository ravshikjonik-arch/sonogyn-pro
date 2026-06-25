import type { FindingToken } from "./types";

export type ClinicalRule = {
  id: string;
  labelRu: string;
  /** Все должны присутствовать для активации правила */
  requiredTokens: FindingToken[];
  /** Повышают confidence если есть */
  supportiveTokens?: FindingToken[];
  /** Если есть — снижают confidence primary */
  excludeTokens?: FindingToken[];
  diagnoses: {
    pathologyId: string;
    baseConfidence: number;
    /** Доп. находки, ожидаемые при этом диагнозе */
    expectedTokens?: FindingToken[];
  }[];
  /** Рекомендации независимо от диагноза при срабатывании правила */
  ruleNextSteps?: string[];
};

export const CLINICAL_RULES: ClinicalRule[] = [
  {
    id: "brain-csp-vm-midline",
    labelRu: "Отсутствие CSP + вентрикуломегалия (midline)",
    requiredTokens: ["absent_csp", "ventriculomegaly"],
    supportiveTokens: ["agenesis_cc"],
    diagnoses: [
      {
        pathologyId: "agenesis-dysgenesis-of-the-corpus-callosum",
        baseConfidence: 0.82,
        expectedTokens: ["absent_csp", "ventriculomegaly", "agenesis_cc"],
      },
      {
        pathologyId: "lobar-holoprosencephaly",
        baseConfidence: 0.55,
        expectedTokens: ["absent_csp", "ventriculomegaly"],
      },
      {
        pathologyId: "septo-optic-dysplasia",
        baseConfidence: 0.48,
        expectedTokens: ["absent_csp"],
      },
      {
        pathologyId: "mild-ventriculomegaly",
        baseConfidence: 0.25,
        expectedTokens: ["ventriculomegaly"],
      },
    ],
    ruleNextSteps: [
      "Сагittal + coronal: оценить мозолистое тело, CSP, morphology frontal horns (Texas longhorn vs flat-top)",
      "МРТ плода (Woodward: меняет тактику в >1/3 при ACC)",
      "Кариотипирование / microarray (15–20% хромосомных аномалий при ACC)",
      "Консультация медицинского генетика",
      "Fetal neurosonography expert review",
    ],
  },
  {
    id: "brain-acc-direct",
    labelRu: "Прямые признаки агенезии МТ",
    requiredTokens: ["agenesis_cc"],
    supportiveTokens: ["absent_csp", "ventriculomegaly"],
    diagnoses: [
      {
        pathologyId: "agenesis-dysgenesis-of-the-corpus-callosum",
        baseConfidence: 0.9,
        expectedTokens: ["agenesis_cc", "absent_csp"],
      },
      {
        pathologyId: "lobar-holoprosencephaly",
        baseConfidence: 0.35,
      },
    ],
    ruleNextSteps: [
      "3D US multislice — axial/coronal/sagittal",
      "МРТ плода",
      "Поиск ассоциированных аномалий (75% ACC)",
    ],
  },
  {
    id: "brain-hpe-spectrum",
    labelRu: "Голопросенцефалия",
    requiredTokens: ["holoprosencephaly"],
    diagnoses: [
      {
        pathologyId: "alobar-holoprosencephaly",
        baseConfidence: 0.75,
      },
      {
        pathologyId: "lobar-holoprosencephaly",
        baseConfidence: 0.7,
      },
      {
        pathologyId: "semilobar-holoprosencephaly",
        baseConfidence: 0.68,
      },
    ],
    ruleNextSteps: ["МРТ плода", "Кариотип / CMA", "Оценка лицевого профиля"],
  },
  {
    id: "first-trimester-screen-failure",
    labelRu: "Скрининг I триместра — маркеры анеуплоидии",
    requiredTokens: ["increased_nt"],
    supportiveTokens: ["absent_nasal_bone", "tricuspid_regurgitation", "reversed_dv_a_wave"],
    diagnoses: [
      { pathologyId: "trisomy-21", baseConfidence: 0.45 },
      { pathologyId: "trisomy-18", baseConfidence: 0.35 },
      { pathologyId: "trisomy-13", baseConfidence: 0.2 },
      { pathologyId: "turner-syndrome", baseConfidence: 0.15 },
    ],
    ruleNextSteps: [
      "Комбинированный расчёт риска (FMF/локальный алгоритм)",
      "NIPT или invasive testing по протоколу",
      "Fetal echo при положительном скрининге",
    ],
  },
  {
    id: "fetal-growth-restriction-doppler",
    labelRu: "Задержка роста + допpler",
    requiredTokens: ["oligohydramnios"],
    supportiveTokens: ["hydrops"],
    diagnoses: [
      { pathologyId: "fetal-growth-restriction", baseConfidence: 0.5 },
      { pathologyId: "hydrops", baseConfidence: 0.35 },
    ],
    ruleNextSteps: [
      "Serial biometry + doppler UA/MCA/DV",
      "TORCH / анемия / кардиология по показаниям",
    ],
  },
];
