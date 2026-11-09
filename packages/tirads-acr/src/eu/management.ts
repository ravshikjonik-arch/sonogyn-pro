import { EU_SOURCES } from "./sources";
import type { EuManagement, EuPolicyProfile, EuTiradsCategory, EuTiradsInput, EuWarning } from "./types";

/** FNA size cut-offs are strict ("более" / ">") in both RU KR 2024 and ETA 2023. */
export const EU_FNA_THRESHOLD_MM: Record<3 | 4 | 5, number> = { 3: 20, 4: 15, 5: 10 };

function hasNodalOrEteConcern(input: EuTiradsInput): boolean {
  return (
    input.lymphNodes === "suspicious" ||
    input.extrathyroidalExtension === "suspected" ||
    input.extrathyroidalExtension === "definite"
  );
}

function validSize(input: EuTiradsInput): number | undefined {
  const s = input.maxDiameterMm;
  return typeof s === "number" && Number.isFinite(s) && s > 0 ? s : undefined;
}

function pediatricManagement(
  category: EuTiradsCategory,
  input: EuTiradsInput,
  profile: EuPolicyProfile,
): EuManagement {
  if (profile === "ETA_2023") {
    return {
      profile,
      fna: "undetermined",
      fnaReasonRu: "ETA 2023 — рекомендации для взрослых. У ребёнка взрослые пороги ТАБ не применяются автоматически.",
      followUpRu: null,
      source: EU_SOURCES.ETA_2023,
    };
  }
  const size = validSize(input);
  if (category === 1) {
    return { profile, fna: "not_indicated", fnaReasonRu: "Узлов нет.", followUpRu: null, source: EU_SOURCES.RU_KR_2024 };
  }
  if (size === undefined) {
    return {
      profile,
      fna: "undetermined",
      fnaReasonRu: "Укажите наибольший размер узла: у детей КР 2024 задают порог ТАБ по размеру (более 1 см).",
      followUpRu: null,
      source: EU_SOURCES.RU_KR_2024,
    };
  }
  if (size > 10) {
    return {
      profile,
      fna: "indicated",
      fnaReasonRu: "КР 2024: у детей рекомендуется ТАБ всех узловых образований более 1 см.",
      followUpRu: null,
      source: EU_SOURCES.RU_KR_2024,
    };
  }
  return {
    profile,
    fna: "undetermined",
    fnaReasonRu: "Узел ≤1 см у ребёнка: КР 2024 отдельного правила не задают — решение врача.",
    followUpRu: null,
    source: EU_SOURCES.RU_KR_2024,
  };
}

function ruAdultManagement(category: EuTiradsCategory, input: EuTiradsInput): EuManagement {
  const source = EU_SOURCES.RU_KR_2024;
  const base = { profile: "RU_KR_2024" as const, followUpRu: null, source };
  if (category === 1) return { ...base, fna: "not_indicated", fnaReasonRu: "Узлов нет." };
  if (category === 2) {
    return { ...base, fna: "not_indicated", fnaReasonRu: "ТАБ не показана (кроме проведения ТАБ с лечебной целью)." };
  }
  const size = validSize(input);
  const threshold = EU_FNA_THRESHOLD_MM[category];
  if (size === undefined) {
    return { ...base, fna: "undetermined", fnaReasonRu: "Укажите наибольший размер узла — показания к ТАБ зависят от размера." };
  }
  if (size > threshold) {
    return { ...base, fna: "indicated", fnaReasonRu: `EU-TIRADS ${category}: ТАБ показана при узлах более ${threshold} мм.` };
  }
  if (category === 5) {
    return {
      ...base,
      fna: "consider",
      fnaReasonRu: "EU-TIRADS 5, узел ≤10 мм: возможно проведение ТАБ или активное наблюдение.",
    };
  }
  const smallNote =
    size <= 10
      ? " ТАБ узлов 1 см и менее не рекомендуется, если УЗ-признаки не подозрительны и нет высокого риска по анамнезу."
      : "";
  return {
    ...base,
    fna: "not_indicated",
    fnaReasonRu: `EU-TIRADS ${category}: размер не превышает ${threshold} мм — ТАБ по размерному критерию не показана.${smallNote}`,
  };
}

function etaAdultManagement(category: EuTiradsCategory, input: EuTiradsInput): EuManagement {
  const source = EU_SOURCES.ETA_2023;
  const base = { profile: "ETA_2023" as const, source };
  const size = validSize(input);
  if (category === 1) return { ...base, fna: "not_indicated", fnaReasonRu: "Узлов нет.", followUpRu: null };

  if (hasNodalOrEteConcern(input)) {
    if (category === 5 && size !== undefined && size <= 10) {
      if (size < 5) {
        return {
          ...base,
          fna: "undetermined",
          fnaReasonRu: "EU-TIRADS 5 <5 мм с подозрительными ЛУ / ЭТР: ETA 2023 отдельного правила не даёт — решение врача.",
          followUpRu: null,
        };
      }
      return {
        ...base,
        fna: "consider",
        fnaReasonRu: "EU-TIRADS 5, 5–10 мм: при подозрительных ЛУ или подозрении на ЭТР ТАБ следует рассмотреть.",
        followUpRu: null,
      };
    }
    return {
      ...base,
      fna: "indicated",
      fnaReasonRu: "Подозрительные ЛУ или подозрение на ЭТР: ТАБ выполняется независимо от категории EU-TIRADS.",
      followUpRu: null,
    };
  }

  if (category === 2) {
    const followUpRu =
      size === undefined
        ? "Срок повторной оценки зависит от размера — укажите размер."
        : size <= 10
          ? "≤10 мм: дальнейшая оценка не требуется."
          : ">10 мм: повторная оценка узла через 3–5 лет.";
    return { ...base, fna: "not_indicated", fnaReasonRu: "ТАБ не показана, если не планируется лечение.", followUpRu };
  }

  const threshold = EU_FNA_THRESHOLD_MM[category];
  if (size === undefined) {
    return {
      ...base,
      fna: "undetermined",
      fnaReasonRu: "Укажите наибольший размер узла — показания к ТАБ зависят от размера.",
      followUpRu: null,
    };
  }
  if (size > threshold) {
    return { ...base, fna: "indicated", fnaReasonRu: `EU-TIRADS ${category}: ТАБ при размере более ${threshold} мм.`, followUpRu: null };
  }
  if (category === 3) {
    return {
      ...base,
      fna: "not_indicated",
      fnaReasonRu: "EU-TIRADS 3, ≤20 мм: ТАБ по размерному критерию не показана.",
      followUpRu: size <= 10 ? "≤10 мм: дальнейшая оценка не требуется." : "10–20 мм: повторная оценка узла через 3–5 лет.",
    };
  }
  if (category === 4) {
    return {
      ...base,
      fna: "not_indicated",
      fnaReasonRu: "EU-TIRADS 4, ≤15 мм: ТАБ по размерному критерию не показана.",
      followUpRu: "Повторная оценка узла через 1 год.",
    };
  }
  return {
    ...base,
    fna: "not_indicated",
    fnaReasonRu: "EU-TIRADS 5, ≤10 мм без подозрительных ЛУ и ЭТР: ТАБ по размерному критерию не показана.",
    followUpRu: "Активное наблюдение: повторная оценка каждые 6–12 месяцев.",
  };
}

export function manageEuNodule(
  category: EuTiradsCategory,
  input: EuTiradsInput,
  profile: EuPolicyProfile,
): EuManagement {
  if (input.isPediatric) return pediatricManagement(category, input, profile);
  return profile === "RU_KR_2024" ? ruAdultManagement(category, input) : etaAdultManagement(category, input);
}

export function euClinicalWarnings(input: EuTiradsInput, profile: EuPolicyProfile): EuWarning[] {
  const out: EuWarning[] = [];
  if (input.extrathyroidalExtension === "definite") {
    out.push({
      code: "definite_ete",
      messageRu:
        "Явное экстратиреоидное распространение: нужна срочная оценка специалистом. Категория EU-TIRADS автоматически не меняется.",
    });
  } else if (input.extrathyroidalExtension === "suspected") {
    out.push({
      code: "suspected_ete",
      messageRu: "Подозрение на экстратиреоидное распространение: уточните при осмотре и учтите при решении о ТАБ.",
    });
  }
  if (input.lymphNodes === "suspicious") {
    out.push(
      profile === "ETA_2023"
        ? {
            code: "suspicious_lymph_nodes",
            messageRu: "Подозрительные шейные лимфоузлы: ETA 2023 рекомендует ТАБ лимфоузла (смыв на тиреоглобулин / кальцитонин).",
            source: EU_SOURCES.ETA_2023,
          }
        : {
            code: "suspicious_lymph_nodes",
            messageRu:
              "Подозрительные шейные лимфоузлы оцениваются отдельно от категории узла. В КР 2024 размерные критерии ТАБ их не учитывают — решение врача.",
            source: EU_SOURCES.RU_KR_2024,
          },
    );
  } else if (input.lymphNodes === "indeterminate") {
    out.push({
      code: "indeterminate_lymph_nodes",
      messageRu: "Лимфоузлы с неопределёнными признаками: сопоставьте с клиникой и данными узла.",
    });
  }
  if (input.isPediatric) {
    out.push({
      code: "pediatric",
      messageRu: "Пациент младше 18 лет: взрослые пороги ТАБ не применяются автоматически.",
    });
  }
  return out;
}
