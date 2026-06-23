export * from "./schemas";

export const CPI_ACTION_LABELS: Record<
  import("./schemas").CpiClinicalAction,
  string
> = {
  observation: "Наблюдение",
  repeat_hpv: "Повторный HPV-тест",
  repeat_cytology: "Повторная цитология",
  repeat_colposcopy: "Повторная кольпоскопия",
  targeted_biopsy: "Прицельная биопсия",
  multiple_biopsies: "Множественные биопсии",
  ecc: "ECC (эндоцервикальное curettage)",
  lletz: "LLETZ / LEEP",
  cold_knife_conization: "Cold knife конизация",
  referral_oncologist: "Направление к онкогинекологу",
};
