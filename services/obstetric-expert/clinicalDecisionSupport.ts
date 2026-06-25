import { findPathologyById } from "../../medical-knowledge/index";

import type { AneuploidyRiskOutput } from "./aneuploidyRiskEngine";
import type { DifferentialOutput } from "./types";
import type { DopplerAssessmentOutput } from "./dopplerEngine";
import type { FetalBiometryOutput } from "./fetalBiometryEngine";
import type { FindingToken } from "./types";

export type CdsActionType =
  | "genetic_counseling"
  | "nipt"
  | "amniocentesis"
  | "cvs"
  | "karyotype"
  | "microarray"
  | "fetal_mri"
  | "fetal_echo"
  | "mfm_referral"
  | "serial_ultrasound"
  | "doppler_surveillance"
  | "pediatric_surgery_consult"
  | "neonatal_planning";

export type CdsAction = {
  type: CdsActionType;
  labelRu: string;
  priority: "required" | "recommended" | "conditional";
  rationale: string;
  source?: string;
};

export type ClinicalDecisionSupportOutput = {
  actions: CdsAction[];
  summaryRu: string;
  disclaimer: string;
};

const ACTION_LABELS: Record<CdsActionType, string> = {
  genetic_counseling: "Консультация медицинского генетика",
  nipt: "NIPT (cfDNA)",
  amniocentesis: "Амниоцентез",
  cvs: "Биопсия хориона (CVS)",
  karyotype: "Кариотипирование плода",
  microarray: "Хромосомный microarray (CMA)",
  fetal_mri: "МРТ плода",
  fetal_echo: "Fetal echo (эхокардиография плода)",
  mfm_referral: "Консультация MFM / fetal medicine",
  serial_ultrasound: "Серийное УЗ-наблюдение",
  doppler_surveillance: "Допплер-мониторинг (UA/MCA/DV)",
  pediatric_surgery_consult: "Консультация детского хирурга (пrenatal)",
  neonatal_planning: "Планирование неонатальной тактики / родов",
};

const PATHOLOGY_CDS: Record<string, CdsActionType[]> = {
  "agenesis-dysgenesis-of-the-corpus-callosum": [
    "fetal_mri",
    "karyotype",
    "microarray",
    "genetic_counseling",
    "mfm_referral",
    "serial_ultrasound",
  ],
  "lobar-holoprosencephaly": ["fetal_mri", "karyotype", "microarray", "genetic_counseling", "mfm_referral"],
  "alobar-holoprosencephaly": ["fetal_mri", "karyotype", "genetic_counseling", "mfm_referral", "neonatal_planning"],
  "septo-optic-dysplasia": ["fetal_mri", "genetic_counseling", "mfm_referral", "serial_ultrasound"],
  "trisomy-21": ["genetic_counseling", "nipt", "amniocentesis", "fetal_echo", "mfm_referral"],
  "trisomy-18": ["genetic_counseling", "amniocentesis", "cvs", "mfm_referral", "neonatal_planning"],
  "trisomy-13": ["genetic_counseling", "amniocentesis", "cvs", "mfm_referral", "neonatal_planning"],
  "turner-syndrome": ["genetic_counseling", "amniocentesis", "cvs", "fetal_echo", "mfm_referral"],
  triploidy: ["genetic_counseling", "amniocentesis", "cvs", "mfm_referral"],
  "fetal-growth-restriction": ["doppler_surveillance", "serial_ultrasound", "mfm_referral", "neonatal_planning"],
  cdh: ["fetal_echo", "mfm_referral", "karyotype", "pediatric_surgery_consult", "neonatal_planning"],
};

const TOKEN_CDS: Partial<Record<FindingToken, CdsActionType[]>> = {
  increased_nt: ["genetic_counseling", "nipt", "amniocentesis"],
  absent_nasal_bone: ["genetic_counseling", "nipt"],
  reversed_dv_a_wave: ["genetic_counseling", "fetal_echo"],
  tricuspid_regurgitation: ["genetic_counseling", "fetal_echo"],
  ventriculomegaly: ["fetal_mri", "serial_ultrasound", "genetic_counseling"],
  absent_csp: ["fetal_mri", "karyotype", "genetic_counseling"],
  agenesis_cc: ["fetal_mri", "karyotype", "microarray"],
  holoprosencephaly: ["fetal_mri", "karyotype", "genetic_counseling"],
  cdh: ["fetal_echo", "pediatric_surgery_consult", "mfm_referral"],
};

function toAction(type: CdsActionType, priority: CdsAction["priority"], rationale: string): CdsAction {
  return {
    type,
    labelRu: ACTION_LABELS[type] ?? type,
    priority,
    rationale,
  };
}

/**
 * Этап 9 — клиническая поддержка решений: генетика, инвазивная диагностика, МРТ, echo, наблюдение.
 */
export function buildClinicalDecisionSupport(input: {
  differential?: DifferentialOutput;
  biometry?: FetalBiometryOutput;
  doppler?: DopplerAssessmentOutput;
  aneuploidy?: AneuploidyRiskOutput;
  tokens?: FindingToken[];
}): ClinicalDecisionSupportOutput {
  const actions: CdsAction[] = [];
  const push = (a: CdsAction) => {
    if (!actions.some((x) => x.type === a.type)) actions.push(a);
  };

  for (const dx of input.differential?.slice(0, 4) ?? []) {
    const types = PATHOLOGY_CDS[dx.pathologyId] ?? [];
    const entry = findPathologyById(dx.pathologyId);
    for (const t of types) {
      push(
        toAction(
          t,
          dx.confidence >= 0.7 ? "required" : "recommended",
          `${dx.diagnosis} (${Math.round(dx.confidence * 100)}%)${entry?.bookPage ? ` · Woodward p.${entry.bookPage}` : ""}`,
        ),
      );
    }
    for (const step of dx.nextSteps.slice(0, 3)) {
      if (/мрт/i.test(step)) push(toAction("fetal_mri", "required", step));
      if (/кариотип|microarray|cma/i.test(step)) push(toAction("karyotype", "required", step));
      if (/генетик/i.test(step)) push(toAction("genetic_counseling", "required", step));
      if (/echo|эхокарди/i.test(step)) push(toAction("fetal_echo", "recommended", step));
      if (/nipt|cfDNA/i.test(step)) push(toAction("nipt", "recommended", step));
      if (/амниo|амнио|инвазив/i.test(step)) push(toAction("amniocentesis", "conditional", step));
    }
  }

  for (const token of input.tokens ?? []) {
    for (const t of TOKEN_CDS[token] ?? []) {
      push(toAction(t, "recommended", `Маркер: ${token}`));
    }
  }

  if (input.aneuploidy?.riskLevel === "high") {
    push(toAction("genetic_counseling", "required", "Высокий риск анеуплоидии по модели"));
    push(toAction("nipt", "recommended", "NIPT или инвазивная диагностика по протоколу"));
  } else if (input.aneuploidy?.riskLevel === "intermediate") {
    push(toAction("genetic_counseling", "recommended", "Промежуточный риск — уточнение FMF/NIPT"));
  }

  if (
    input.biometry?.growthPattern === "asymmetric_head_spare" ||
    input.biometry?.growthPattern === "asymmetric_abdominal" ||
    input.biometry?.efw?.classification === "below_p3"
  ) {
    push(toAction("doppler_surveillance", "required", input.biometry!.summaryRu));
    push(toAction("serial_ultrasound", "required", "FGR / асимметрия — динамика биометрии"));
    push(toAction("mfm_referral", "recommended", "Fetal medicine при FGR"));
  }

  if (
    input.doppler?.fgrPattern === "critical_dv" ||
    input.doppler?.fgrPattern === "redistribution" ||
    input.doppler?.fgrPattern === "brain_sparing"
  ) {
    push(toAction("doppler_surveillance", "required", input.doppler!.summaryRu));
    push(toAction("mfm_referral", "required", "Патологический допплер-профиль"));
    push(toAction("neonatal_planning", "conditional", "Подготовка к преterm delivery по показаниям"));
  }

  if (!actions.length) {
    push(toAction("serial_ultrasound", "conditional", "Рутинное наблюдение по сроку"));
  }

  const priorityOrder = { required: 0, recommended: 1, conditional: 2 };
  actions.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return {
    actions: actions.slice(0, 12),
    summaryRu: actions
      .filter((a) => a.priority === "required")
      .slice(0, 4)
      .map((a) => a.labelRu)
      .join("; ") || "Специализированные вмешательства по показаниям",
    disclaimer:
      "Рекомендации CDS — ориентир по Woodward/ISUOG/КР; окончательная тактика — MFM/генетик. Не заменяет информированное согласие.",
  };
}
