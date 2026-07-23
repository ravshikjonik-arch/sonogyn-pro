/**
 * Наблюдение после лечения CIN / кольпоскопии.
 * Актуализировано: ASCCP 2019 + Enduring Guidelines 2024–2025 (dual stain, extended genotyping),
 * HPV-primary post-treatment surveillance.
 */

export type CinHistology =
  | "cin1"
  | "cin2"
  | "cin3"
  | "ais"
  | "negative"
  | "hpv_positive_cytology_normal";

export type CinTreatment = "none" | "excision" | "ablation";

export type CinFollowUpInput = {
  age: number;
  histology: CinHistology;
  treatment: CinTreatment;
  marginsPositive: boolean;
  /** HPV-test доступен */
  hpvTestAvailable: boolean;
  /** Extended genotyping выполнен (ASCCP 2025) */
  extendedGenotypingAvailable?: boolean;
  /** Self-collected HPV опция (ASCCP 2025, FDA 2024) */
  selfCollectionEligible?: boolean;
  /** p16/Ki67 dual stain выполнен (ASCCP 2024) */
  dualStainResult?: "positive" | "negative" | "not_done";
};

export type CinFollowUpResult = {
  intervalMonths: number;
  tests: string[];
  notes: string[];
};

export function cinFollowUpPlan(input: CinFollowUpInput): CinFollowUpResult {
  const notes: string[] = [];
  const tests: string[] = [];

  if (input.histology === "negative" && input.treatment === "none") {
    return {
      intervalMonths: input.age >= 30 ? 36 : 36,
      tests: ["ВПЧ/цитология по национальному скринингу"],
      notes: ["Плановый скрининг без укорочения интервала."],
    };
  }

  if (input.histology === "hpv_positive_cytology_normal") {
    // ASCCP Enduring 2024: triage dual stain
    if (input.dualStainResult === "positive") {
      return {
        intervalMonths: 0,
        tests: ["Кольпоскопия", "Биопсия по показаниям"],
        notes: ["p16/Ki67 dual stain+ при HPV+ NILM → кольпоскопия (ASCCP 2024 Clarke et al.)."],
      };
    }
    if (input.dualStainResult === "negative") {
      return {
        intervalMonths: 12,
        tests: ["ВПЧ ± цитология"],
        notes: ["Dual stain− при HPV+ → повтор HPV через 12 мес (ASCCP 2024)."],
      };
    }
    return {
      intervalMonths: 12,
      tests: ["ВПЧ ± цитология"],
      notes: ["Повтор через 12 мес; при persistent HPV+ — кольпоскопия. Рассмотреть dual stain triage (ASCCP 2024)."],
    };
  }

  if (input.histology === "cin1") {
    if (input.age < 25) {
      return {
        intervalMonths: 12,
        tests: ["Цитология ± ВПЧ"],
        notes: ["CIN1 у молодых — наблюдение 12 мес (ASCCP); regression частая."],
      };
    }
    return {
      intervalMonths: 12,
      tests: ["Кольпоскопия + цитология/ВПЧ"],
      notes: ["CIN1 ≥25 лет — кольпоскопия через 12 мес или лечение по протоколу."],
    };
  }

  if (input.treatment === "excision") {
    tests.push("ВПЧ ± цитология");
    if (input.marginsPositive) {
      notes.push("⚠ Положительный край — кольпоскопия через 4–6 мес, consider re-excision.");
      return { intervalMonths: 6, tests: [...tests, "Кольпоскопия"], notes };
    }
    if (input.histology === "cin2" || input.histology === "cin3") {
      notes.push("После excision CIN2/3 — ВПЧ-primary testing через 12 мес (ASCCP 2019 / Enduring Guidelines 2025). Self-collection допустим для фоллоу-апа.");
      if (input.extendedGenotypingAvailable) {
        notes.push("Extended genotyping: HPV 56/59/66+ на контроле → повтор 12 мес; 16/18+ → кольпоскопия (ASCCP 2025).");
      }
      return { intervalMonths: 12, tests, notes };
    }
    if (input.histology === "ais") {
      notes.push("AIS после conization — гистерoscopy/endometrial sampling по протоколу; онкогинеколог. Excision с negative margins обязательна.");
      return { intervalMonths: 6, tests: [...tests, "Кольпоскопия", "Гистерoscopy по показаниям"], notes };
    }
  }

  if (input.histology === "cin2" || input.histology === "cin3") {
    return {
      intervalMonths: 6,
      tests: ["Кольпоскопия", "ВПЧ ± цитология"],
      notes: ["CIN2/3 без лечения — кольпоскопия 6 мес или excision по решению коллегии. CIN2 у молодых — manage-or-observe (ASCCP 2019)."],
    };
  }

  return {
    intervalMonths: 12,
    tests: ["Кольпоскопия", "ВПЧ/цитология"],
    notes: ["Индивидуальный план — сверка с ASCCP 2019 / Enduring Guidelines 2024–2025 и КР МЗ РФ «Предраковые заболевания шейки матки»."],
  };
}

export const CIN_FOLLOWUP_DISCLAIMER =
  "Интервалы наблюдения — ориентир. Финальный план — по гистологии, краям resection и протоколу центра. Источники: ASCCP 2019, Enduring Guidelines 2024–2025 (dual stain, extended genotyping, self-collection), КР МЗ РФ.";
